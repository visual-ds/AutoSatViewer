from flask import Flask, render_template,json,request, jsonify
import json 
import numpy as np
import pandas as pd
import geopandas as gpd
import scipy.sparse

POLY = ["SpCenterCensus5k", "NYBlocks", "BLACities"][0]
TIME = ["Year", "Period1", "Period2"][-1]
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
        #return (df.iloc[:, 1:]).mean(axis=0, numeric_only=True)
        #return (df.iloc[:, 1:]).quantile(threshold, axis=0)
        df_ = df.iloc[:, 2:6]
        # calculate mean of the values that are bigger than 1e-3
        return (df_.apply(lambda x: np.mean(x[x > 1e-3]), axis=0))
        #return (df.iloc[:, 1:].max(axis=0, numeric_only=True))
        
    coeffs = coeffs.groupby(["date", "type"]).apply(get_high_count).reset_index()
    coeffs = pd.melt(coeffs, id_vars=["date", "type"], var_name="freq", value_name="value")
    coeffs["freq"] = coeffs["freq"].str.replace("mean_freq_", "").astype(int)
    coeffs = coeffs.fillna(0)
    return jsonify(coeffs.to_dict(orient="records"))
    

@app.route('/get_high_coefficients/<string:request>')
def get_high_coefficients(request):
    typ, date, freq, change_type = request.split("_")
    typ = typ.replace("%20", " ")
    freq = int(freq)
    if change_type == "spatiotemporal":
        coeffs = pd.read_csv(f"wavelet_code/data/coeffs/{POLY}_{TIME}.csv")
    elif change_type == "spatial":
        coeffs = pd.read_csv(f"wavelet_code/data/coeffs_spatial/{POLY}_{TIME}.csv")
    coeffs["date"] = pd.to_datetime(coeffs["date"])
    coeffs = coeffs[coeffs.type == typ]
    threshold = np.quantile(coeffs[f"mean_freq_{freq}"], configs["threshold"])
    dates = coeffs["date"].unique()
    date = dates[int(date)]
    coeffs = coeffs[coeffs["date"] == date]
    idx_high = coeffs[f"mean_freq_{freq}"] > threshold
    coeffs["highlight"] = idx_high
    coeffs["value"] = coeffs[f"mean_freq_{freq}"]
    return jsonify(coeffs.to_dict(orient="records"))

    
@app.route('/get_time_series', methods=["GET", "POST"])
def get_time_series():
    block_id = request.get_json()["block_id"]
    df = pd.read_csv(f"wavelet_code/data/polygon_data/{POLY}_{TIME}.csv")
    all_polys = df['id_poly'].unique()

    if len(block_id) == 0: # no block selected
        block_id = [0]
        multiply_by_zero = True
    else:
        multiply_by_zero = False
       
    temporal = df[df['id_poly'].isin(block_id)]
    if multiply_by_zero:
        cols = temporal.columns.tolist()[2:]
        print(cols)
        temporal[cols] = -777
    temporal_all = df[df['id_poly'].isin(all_polys)]
    func_1_quantile = lambda x: np.quantile(x, 0.)
    func_3_quantile = lambda x: np.quantile(x, 1)
    agg_cols = temporal.columns.tolist()[2:]
    agg = {col: [func_1_quantile, func_3_quantile] for col in agg_cols}
    new_columns = [f"{col}_{func}" for col in agg_cols for func in ["1", "3"]]
    temporal = temporal.groupby('date').agg(agg)
    temporal.columns = new_columns
    temporal = temporal.reset_index()
    temporal_all = temporal_all.groupby('date').agg(agg)
    temporal_all.columns = new_columns
    temporal_all = temporal_all.reset_index()
    return json.dumps({
        'selected': json.loads(temporal.to_json(orient='records')), 
        'columns': agg_cols, 
        'all': json.loads(temporal_all.to_json(orient='records'))
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
    df["date"] = pd.to_datetime(df["date"])
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

@app.route('/get_projection')
def get_projection():
    df = pd.read_csv(f"wavelet_code/data/projections/{POLY}_{TIME}.csv")
    return jsonify(df.to_dict(orient="records"))


@app.route('/get_signal_types')
def get_signal_types():
    data = pd.read_csv(f"wavelet_code/data/coeffs/{POLY}_{TIME}.csv")
    return jsonify(data["type"].unique().tolist())

if __name__ == '__main__':
    app.run(debug=True, port=8080)
