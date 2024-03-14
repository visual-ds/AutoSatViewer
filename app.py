from flask import Flask, render_template,json,request, jsonify
import json 
import numpy as np
import pandas as pd
import geopandas as gpd
import scipy.sparse

POLY = ["SpCenterCensus2k", "SpCenterCensus5k", "SpDistricts", "SpGrid", "NYBlocks", "BLACities"][-1]
TIME = ["Day", "Month", "5days", "3days", "Year"][-1]
configs = {
    "n_freqs": 4,
    "threshold": 0.6
}

app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/get_map')
def get_map():
    with open(f"wavelet_code/data/shapefiles/{POLY}.geojson") as f:
        data = json.load(f)
    return jsonify(data)


@app.route('/get_heatmap_data/<string:request>')
def get_heatmap_data(request):
    request = request.split("_")
    change_type = request[0]
    n_freqs = int(request[1])
    threshold = float(request[2])
    configs["threshold"] = threshold
    if change_type == "spatiotemporal":
        coeffs = pd.read_csv(f"wavelet_code/data/coeffs/{POLY}_{TIME}.csv")
    elif change_type == "spatial":
        coeffs = pd.read_csv(f"wavelet_code/data/coeffs_spatial/{POLY}_{TIME}.csv")

    def get_high_count(df):
        #return (df.iloc[:, 1:] > threshold).sum(axis=0)
        return (df.iloc[:, 1:]).mean(axis=0)
        #return (df.iloc[:, 1:]).quantile(0.95, axis=0)
    
    coeffs = coeffs.groupby(["date", "type"]).apply(get_high_count).reset_index()
    coeffs = pd.melt(coeffs, id_vars=["date", "type"], var_name="freq", value_name="value")
    coeffs["freq"] = coeffs["freq"].str.replace("mean_freq_", "").astype(int)
    return jsonify(coeffs.to_dict(orient="records"))
    

@app.route('/get_high_coefficients/<string:request>')
def get_high_coefficients(request):
    typ, date, freq, change_type = request.split("_")
    typ = typ.replace("%20", " ")
    freq = int(freq)
    date = pd.to_datetime(date)
    if change_type == "spatiotemporal":
        coeffs = pd.read_csv(f"wavelet_code/data/coeffs/{POLY}_{TIME}.csv")
    elif change_type == "spatial":
        coeffs = pd.read_csv(f"wavelet_code/data/coeffs_spatial/{POLY}_{TIME}.csv")
    coeffs["date"] = pd.to_datetime(coeffs["date"])
    coeffs = coeffs[coeffs.type == typ]
    threshold = np.quantile(coeffs[f"mean_freq_{freq}"], configs["threshold"])
    coeffs = coeffs[coeffs["date"] == date]
    idx_high = coeffs[f"mean_freq_{freq}"] > threshold
    coeffs["highlight"] = idx_high
    coeffs["value"] = coeffs[f"mean_freq_{freq}"]
    return jsonify(coeffs.to_dict(orient="records"))

    
@app.route('/get_time_series', methods=["GET", "POST"])
def get_time_series():
    block_id = int(request.form['block_id'])
    df = pd.read_csv(f"wavelet_code/data/polygon_data/{POLY}_{TIME}.csv")
    try:
        adj_matrix = np.load(f"wavelet_code/data/adj_matrix/{POLY}.npy")
        if block_id != -1:
            neighbors = np.where(adj_matrix[block_id] > 0)[0]
        else:
            neighbors = np.arange(adj_matrix.shape[0])
    except:
        adj_matrix = scipy.sparse.load_npz(f"wavelet_code/data/adj_matrix/{POLY}.npz")
        if block_id != -1:
            neighbors = adj_matrix[block_id].nonzero()[1]
        else:
            neighbors = np.arange(adj_matrix.shape[0])
    neighbors = list(neighbors)
    if block_id == -1: # get mean data as neighbors
        temporal = df[df["id_poly"] == 0]
        temporal.iloc[:, 2:] = temporal.iloc[:, 2:] * 0
        temporal_neigh = df
    else:
        temporal = df[df['id_poly'] == block_id]
        temporal_neigh = df[df['id_poly'].isin(neighbors)]
    temporal_neigh = temporal_neigh.groupby('date').mean().reset_index()
    return json.dumps({
        'temporal': json.loads(temporal.to_json(orient='records')), 
        'columns': temporal.columns.values.tolist()[2:], 
        'neighbors': json.loads(temporal_neigh.to_json(orient='records'))
    })

@app.route('/get_scatter_data/<string:request>')
def get_scatter_plot(request):
    data = []
    request = request.split("_")
    change_type = request[0]
    n_freqs = 4 #int(request[1])
    threshold = float(request[1])
    configs["n_freqs"] = n_freqs
    configs["threshold"] = threshold
    if change_type == "spatiotemporal":
        coeffs = pd.read_csv(f"wavelet_code/data/coeffs/{POLY}_{TIME}.csv")
    elif change_type == "spatial":
        coeffs = pd.read_csv(f"wavelet_code/data/coeffs_spatial/{POLY}_{TIME}.csv")

    SIGNAL_TYPES = coeffs["type"].unique().tolist()
    coeffs["high"] = False
    for typ in SIGNAL_TYPES:
        quant = np.quantile(coeffs[coeffs["type"] == typ, "mean_freq_3"], threshold)
        coeffs.loc[coeffs["type"] == typ, "high"] = coeffs.loc[coeffs["type"] == typ, "mean_freq_3"] > quant


    coeffs = coeffs[["date", "high", "mean_freq_3", "type"]]
    
    data = pd.concat(data)
    return json.dumps({
        'scatter' : json.loads(data.to_json(orient='records')),
        'columns' : SIGNAL_TYPES,
    })

@app.route('/get_spatial_data/<string:request>')
def get_spatial_data(request):
    date, typ, value = request.split("_")
    typ = typ.replace("%20", " ")
    if value == "signal":
        df = pd.read_csv(f"wavelet_code/data/polygon_data/{POLY}_{TIME}.csv")
    elif "spatial" in value:
        df = pd.read_csv(f"wavelet_code/data/coeffs_spatial/{POLY}_{TIME}.csv")
        df = df[df["type"] == typ]
        coeff_idx = [int(s) for s in value if s.isdigit()][0]
        df["value"] = df[f"mean_freq_{coeff_idx}"]
    else:
        df = pd.read_csv(f"wavelet_code/data/coeffs/{POLY}_{TIME}.csv")
        df = df[df["type"] == typ]
        coeff_idx = [int(s) for s in value if s.isdigit()][0]
        df["value"] = df[f"mean_freq_{coeff_idx}"]
    df["date"] = pd.to_datetime(df["date"], format="%Y-%m-%d")
    q = [i/8 for i in range(1, 9)]
    if value == "signal":
        values = df[typ].values
    else:
        values = df[f"mean_freq_{coeff_idx}"].values
    quantiles = np.quantile(values[values > 0], q).tolist()
    dates = df["date"].unique()
    date = dates[int(date)]
    df = df[df["date"] == date]
    if value == "signal":
        df["value"] = df[typ]
    else:
        df["value"] = df[f"mean_freq_{coeff_idx}"]
    return jsonify({"data" : df.to_dict(orient="records"), "quantiles": quantiles})


@app.route('/get_similarity_table/<string:request>')
def get_similarity_table(request):
    request = request.split("_")
    similarity = request[0]
    data = pd.read_csv(f"wavelet_code/data/similarity_matrix/{POLY}_{TIME}.csv")
    SIGNAL_TYPES = data["row"].unique().tolist()
    return jsonify({
        "table" : data.to_dict(orient="records"),
        "columns" : SIGNAL_TYPES
    })

@app.route('/get_projection/<string:request>')
def get_projection(request):
    df = pd.read_csv(f"wavelet_code/data/projections/{POLY}_{TIME}.csv")
    return jsonify(df.to_dict(orient="records"))


@app.route('/get_signal_types')
def get_signal_types():
    data = pd.read_csv(f"wavelet_code/data/coeffs/{POLY}_{TIME}.csv")
    return jsonify(data["type"].unique().tolist())

if __name__ == '__main__':
    app.run(debug=True, port=8080)
