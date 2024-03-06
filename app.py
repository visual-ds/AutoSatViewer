from flask import Flask, render_template,json,request, jsonify
import json 
import numpy as np
import pandas as pd
import geopandas as gpd
import scipy.sparse

POLY = ["SpCenterCensus10k", "SpCenterCensus5k", "SpDistricts", "SpGrid"][1]
TIME = ["Day", "Month"][0]
configs = {
    "n_freqs": 4,
    "threshold": 0.6
}

app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html')


def average_coeffs(n_freqs, typ, coeffs):
    n_f = 32 // n_freqs
    for i in range(n_freqs):
        columns = [f"{typ}_coeff_{j}" for j in range(i * n_f, (i + 1) * n_f)]
        coeffs["mean_freq" + str(i)] = coeffs[columns].mean(axis=1)
        coeffs.drop(columns, axis=1, inplace=True)
    return coeffs

@app.route('/get_map')
def get_map():
    with open(f"wavelet_code/data/shapefiles/{POLY}.geojson") as f:
        data = json.load(f)
    return jsonify(data)


@app.route('/get_heatmap_data/<string:request>')
def get_heatmap_data(request):
    data = []
    request = request.split("_")
    change_type = request[0]
    n_freqs = 4 #int(request[1])
    threshold = float(request[2])
    SIGNAL_TYPES = request[3:]
    configs["n_freqs"] = n_freqs
    configs["threshold"] = threshold
    for typ in SIGNAL_TYPES:
        typ = typ.replace("%20", " ")
        if change_type == "spatiotemporal":
            coeffs = pd.read_csv(f"wavelet_code/data/coeffs/{typ}_{POLY}_{TIME}.csv")
        elif change_type == "spatial":
            coeffs = pd.read_csv(f"wavelet_code/data/coeffs_spatial/{typ}_{POLY}_{TIME}.csv")

        coeffs = average_coeffs(n_freqs, typ, coeffs)

        def get_high_count(df):
            #return (df.iloc[:, 2:] > threshold).sum(axis=0)
            #return (df.iloc[:, 2:]).mean(axis=0)
            return (df.iloc[:, 2:]).quantile(0.75, axis=0)
        
        coeffs = coeffs.groupby("date").apply(get_high_count)
        coeffs["type"] = typ
        coeffs = coeffs.reset_index()
        coeffs.columns = ["date"] + list(range(n_freqs)) + ["type"]
        # transform freq columns to new rows
        coeffs = pd.melt(coeffs, id_vars=["date", "type"], value_vars=list(range(n_freqs)), var_name="freq", value_name="value")
        data.append(coeffs)
    
    data = pd.concat(data)
    data = data.to_dict(orient="records")
    return jsonify(data)

@app.route('/get_high_coefficients/<string:request>')
def get_high_coefficients(request):
    typ, date, freq = request.split("_")
    typ = typ.replace("%20", " ")
    freq = int(freq)
    date = pd.to_datetime(date)
    coeffs = pd.read_csv(f"wavelet_code/data/coeffs/{typ}_{POLY}_{TIME}.csv")
    coeffs = average_coeffs(configs["n_freqs"], typ, coeffs)
    coeffs["date"] = pd.to_datetime(coeffs["date"])
    coeffs = coeffs[coeffs["date"] == date]
    idx_high = coeffs.iloc[:, 2 + freq] > configs["threshold"]
    coeffs["highlight"] = idx_high
    coeffs["value"] = coeffs[f"mean_freq{freq}"]
    return jsonify(coeffs.to_dict(orient="records"))

    
@app.route('/get_time_series', methods=["GET", "POST"])
def get_time_series():
    block_id = int(request.form['block_id'])
    selected_signals = request.form.getlist('signals[]')
    selected_signals = [s.replace("%20", " ") for s in selected_signals]
    df = pd.read_csv(f"wavelet_code/data/polygon_data/{POLY}_{TIME}.csv")
    try:
        adj_matrix = np.load(f"wavelet_code/data/adj_matrix/{POLY}.npy")
        # compute adj_matrix^2
        adj_matrix = adj_matrix.dot(adj_matrix)
        if block_id != -1:
            neighbors = np.where(adj_matrix[block_id] > 0)[0]
        else:
            neighbors = np.arange(adj_matrix.shape[0])
    except:
        adj_matrix = scipy.sparse.load_npz(f"wavelet_code/data/adj_matrix/{POLY}.npz")
        # compute adj_matrix^2
        adj_matrix = adj_matrix.dot(adj_matrix)
        if block_id != -1:
            neighbors = adj_matrix[block_id].nonzero()[1]
        else:
            neighbors = np.arange(adj_matrix.shape[0])
    neighbors = list(neighbors)
    if block_id == -1: # get mean data as neighbors
        temporal = df[df["id_poly"] == 0][['date'] + selected_signals]
        temporal[selected_signals] = temporal[selected_signals] * 0
        temporal_neigh = df[['date'] + selected_signals]
    else:
        temporal = df[df['id_poly'] == block_id][['date'] + selected_signals]
        temporal_neigh = df[df['id_poly'].isin(neighbors)][['date'] + selected_signals]
    temporal_neigh = temporal_neigh.groupby('date').mean().reset_index()
    return json.dumps({
        'temporal': json.loads(temporal.to_json(orient='records')), 
        'columns': temporal.columns.values.tolist()[1:], 
        'neighbors': json.loads(temporal_neigh.to_json(orient='records'))
    })

@app.route('/get_scatter_data/<string:request>')
def get_scatter_plot(request):
    data = []
    request = request.split("_")
    change_type = request[0]
    n_freqs = 4 #int(request[1])
    threshold = float(request[1])
    SIGNAL_TYPES = request[2:]
    configs["n_freqs"] = n_freqs
    configs["threshold"] = threshold
    for typ in SIGNAL_TYPES:
        typ = typ.replace("%20", " ")
        if change_type == "spatiotemporal":
            coeffs = pd.read_csv(f"wavelet_code/data/coeffs/{typ}_{POLY}_{TIME}.csv")
        elif change_type == "spatial":
            coeffs = pd.read_csv(f"wavelet_code/data/coeffs_spatial/{typ}_{POLY}_{TIME}.csv")

        coeffs = average_coeffs(n_freqs, typ, coeffs)
        coeffs["high"] = coeffs["mean_freq3"] > threshold
        coeffs = coeffs[["date", "high", "mean_freq3"]]
        coeffs = coeffs.groupby("date").agg({"high": "sum", "mean_freq3": "mean"}).reset_index()
        coeffs["type"] = typ
        data.append(coeffs)
    
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
    else:
        df = pd.read_csv(f"wavelet_code/data/coeffs/{typ}_{POLY}_{TIME}.csv")
        df = average_coeffs(4, typ, df)
        coeff_idx = int(value[-1])
        df["value"] = df[f"mean_freq{coeff_idx}"]
    df["date"] = pd.to_datetime(df["date"], format="%Y-%m-%d")
    q = [i/8 for i in range(1, 9)]
    if value == "signal":
        values = df[typ].values
    else:
        values = df[f"mean_freq{coeff_idx}"].values
    quantiles = np.quantile(values[values > 0], q).tolist()
    dates = df["date"].unique()
    date = dates[int(date)]
    df = df[df["date"] == date]
    if value == "signal":
        df["value"] = df[typ]
    else:
        df["value"] = df[f"mean_freq{coeff_idx}"]
    return jsonify({"data" : df.to_dict(orient="records"), "quantiles": quantiles})


@app.route('/get_similarity_table/<string:request>')
def get_similarity_table(request):
    request = request.split("_")
    similarity = request[0]
    SIGNAL_TYPES = [s.replace("%20", " ") for s in request[2:]]
    data = pd.read_csv(f"wavelet_code/data/similarity_matrix/{POLY}_{TIME}.csv")
    data = data[data["row"].isin(SIGNAL_TYPES) & data["column"].isin(SIGNAL_TYPES)]
    return jsonify({
        "table" : data.to_dict(orient="records"),
        "columns" : SIGNAL_TYPES
    })

if __name__ == '__main__':
    app.run(debug=True, port=8080)
