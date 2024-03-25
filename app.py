from flask import Flask, render_template,json,request, jsonify
import json 
import numpy as np
import pandas as pd
import geopandas as gpd
import scipy.sparse

POLY = ["SpCenterCensus5k", "SpCenterCensus2k", "NYBlocks", "BLACities"][-1]
TIME = ["Year", "Year2", "Period1", "Period2"][1]
configs = {
    "n_freqs": 4,
    "threshold": 0.6
}
SELECTIONS = {
    "projection" : [],
    "map" : [],
    "heatmap" : [],
}

app = Flask(__name__)

def get_intersection_lists():
    global SELECTIONS
    intersec = lambda x, y : list(set(x) & set(y))
    # get all lists that are not empty
    intersec_lists = [l for l in SELECTIONS.values() if len(l) > 0]
    if len(intersec_lists) == 0: # if no list is not empty, return empty list
        return []
    intersection = intersec_lists[0]
    for l in intersec_lists:
        intersection = intersec(intersection, l)
    return intersection


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
        df_ = df.iloc[:, 2:6]
        # calculate mean of the values that are bigger than 1e-3
        return (df_.apply(lambda x: np.mean(x[x >= 0]), axis=0))
        
    coeffs = coeffs.groupby(["date", "type"]).apply(get_high_count).reset_index()
    coeffs = pd.melt(coeffs, id_vars=["date", "type"], var_name="freq", value_name="value")
    coeffs["freq"] = coeffs["freq"].str.replace("mean_freq_", "").astype(int)
    coeffs = coeffs.fillna(0)
    return jsonify(coeffs.to_dict(orient="records"))
    
@app.route('/clean_high_coefficients/<string:request>')
def clean_high_coefficients(request):
    global SELECTIONS
    typ, date, freq, change_type = request.split("_")
    typ = typ.replace("%20", " ")
    key = f"heatmap_{typ}_{date}_{freq}"
    if key in SELECTIONS:
        SELECTIONS[key] = []

    freq = int(freq)
    if change_type == "spatiotemporal":
        coeffs = pd.read_csv(f"wavelet_code/data/coeffs/{POLY}_{TIME}.csv")
    elif change_type == "spatial":
        coeffs = pd.read_csv(f"wavelet_code/data/coeffs_spatial/{POLY}_{TIME}.csv")
    coeffs["date"] = pd.to_datetime(coeffs["date"])
    coeffs = coeffs[coeffs.type == typ]
    dates = coeffs["date"].unique()
    date = dates[int(date)]
    coeffs = coeffs[coeffs["date"] == date]

    intersection_list = get_intersection_lists()
    # create array with ones at the indexes of intersection_list
    intersection_array = np.zeros(coeffs.shape[0])
    if len(intersection_list) > 0:
        intersection_array[np.array(intersection_list)] = 1
    
   
    coeffs["highlight"] = intersection_array.astype(bool)

    return jsonify(coeffs.to_dict(orient="records"))

    

@app.route('/get_high_coefficients/<string:request>')
def get_high_coefficients(request):
    global SELECTIONS
    typ, date, freq, change_type = request.split("_")
    typ = typ.replace("%20", " ")
    key = f"heatmap_{typ}_{date}_{freq}"
    if not key in SELECTIONS:
        SELECTIONS[key] = []
    
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

    if idx_high.sum() > 0:
        SELECTIONS[key] = np.where(idx_high)[0].tolist()

    intersection_list = get_intersection_lists()
    # create array with ones at the indexes of intersection_list
    intersection_array = np.zeros(coeffs.shape[0])
    if len(intersection_list) > 0:
        intersection_array[np.array(intersection_list)] = 1
   
    coeffs["highlight"] = intersection_array.astype(bool)

    return jsonify(coeffs.to_dict(orient="records"))

    
@app.route('/get_time_series', methods=["GET", "POST"])
def get_time_series():
    block_id = request.get_json()["block_id"]
    df = pd.read_csv(f"wavelet_code/data/polygon_data/{POLY}_{TIME}.csv")
    all_polys = df['id_poly'].unique()       
    temporal = df[df['id_poly'].isin(block_id)]
    temporal_all = df[df['id_poly'].isin(all_polys)]
    func_1_quantile = lambda x: np.quantile(x, 0.)
    func_3_quantile = lambda x: np.quantile(x, 1)
    agg_cols = temporal.columns.tolist()[2:]
    agg = {col: [func_1_quantile, func_3_quantile] for col in agg_cols}
    new_columns = [f"{col}_{func}" for col in agg_cols for func in ["1", "3"]]
    temporal_all = temporal_all.groupby('date').agg(agg)
    temporal_all.columns = new_columns
    temporal_all = temporal_all.reset_index()
    return json.dumps({
        'selected': json.loads(temporal.to_json(orient='records')), 
        'columns': agg_cols, 
        'all': json.loads(temporal_all.to_json(orient='records'))
    })

@app.route('/set_proj_selection', methods=["POST"])
def set_proj_selection():
    global SELECTIONS
    data = request.get_json()
    SELECTIONS["projection"] = data
    intersection_list = get_intersection_lists()
    df = pd.read_csv(f"wavelet_code/data/polygon_data/{POLY}_{TIME}.csv")
    df = df.drop_duplicates(subset=["id_poly"])
    df["highlight"] = False
    intersection_array = np.zeros(df.shape[0])
    if len(intersection_list) > 0:
        intersection_array[np.array(intersection_list)] = 1
    df["highlight"] = intersection_array.astype(bool)
    return jsonify(df.to_dict(orient="records"))

@app.route('/set_map_selection', methods=["POST"])
def set_map_selection():
    global SELECTIONS
    data = request.get_json()
    if len(data) == 0:
        SELECTIONS["map"] = []
    else:
        data = data[0]
        if data in SELECTIONS["map"]:
            SELECTIONS["map"].remove(data)
        else:
            SELECTIONS["map"].append(data)

    intersection_list = get_intersection_lists()
    df = pd.read_csv(f"wavelet_code/data/polygon_data/{POLY}_{TIME}.csv")
    df = df.drop_duplicates(subset=["id_poly"])
    df["highlight"] = False
    intersection_array = np.zeros(df.shape[0])
    if len(intersection_list) > 0:
        intersection_array[np.array(intersection_list)] = 1
    df["highlight"] = intersection_array.astype(bool)
    return jsonify(df.to_dict(orient="records"))

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


@app.route('/get_similarity_table')
def get_similarity_table():
    data = pd.read_csv(f"wavelet_code/data/similarity_matrix/{POLY}_{TIME}.csv")
    SIGNAL_TYPES = data["row"].unique().tolist()
    return jsonify({
        "table" : data.to_dict(orient="records"),
        "columns" : SIGNAL_TYPES
    })

@app.route('/get_projection/<string:change_type>')
def get_projection(change_type):
    if change_type == "spatiotemporal":
        df = pd.read_csv(f"wavelet_code/data/projections/{POLY}_{TIME}.csv")
    elif change_type == "spatial":
        df = pd.read_csv(f"wavelet_code/data/projections_spatial/{POLY}_{TIME}.csv")
    return jsonify(df.to_dict(orient="records"))


@app.route('/get_signal_types')
def get_signal_types():
    data = pd.read_csv(f"wavelet_code/data/coeffs/{POLY}_{TIME}.csv")
    return jsonify(data["type"].unique().tolist())

if __name__ == '__main__':
    app.run(debug=True, port=8080)
