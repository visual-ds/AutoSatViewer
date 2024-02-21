from flask import Flask, render_template,json,request, jsonify
import numpy as np
import pandas as pd
import geopandas as gpd

POLY = ["SpCenterCensus10k", "SpDistricts"][0]
TIME = ["Day", "Month"][1]
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


@app.route('/get_heatmap_data/<string:request>')
def get_heatmap_data(request):
    data = []
    request = request.split("_")
    n_freqs = int(request[0])
    threshold = float(request[1])
    SIGNAL_TYPES = request[2:]
    configs["n_freqs"] = n_freqs
    configs["threshold"] = threshold
    for typ in SIGNAL_TYPES:
        coeffs = pd.read_csv(f"wavelet_code/data/coeffs/{typ}_{POLY}_{TIME}.csv")
        coeffs = average_coeffs(n_freqs, typ, coeffs)

        def get_high_count(df):
            return (df.iloc[:, 2:] > threshold).sum(axis=0)
        
        coeffs = coeffs.groupby("date").apply(get_high_count)
        coeffs["type"] = typ
        coeffs = coeffs.reset_index(drop=True)
        coeffs = coeffs.reset_index()
        coeffs.columns = ["timestamp"] + list(range(n_freqs)) + ["type"]
        # transform freq columns to new rows
        coeffs = pd.melt(coeffs, id_vars=["timestamp", "type"], value_vars=list(range(n_freqs)), var_name="freq", value_name="value")
        data.append(coeffs)
    
    data = pd.concat(data)
    data = data.to_dict(orient="records")
    return jsonify(data)

@app.route('/get_high_coefficients/<string:request>')
def get_high_coefficients(request):
    typ, timestamp, freq = request.split("_")
    freq = int(freq)
    timestamp = int(timestamp)
    coeffs = pd.read_csv(f"wavelet_code/data/coeffs/{typ}_{POLY}_{TIME}.csv")
    coeffs = average_coeffs(configs["n_freqs"], typ, coeffs)
    coeffs["date"] = pd.to_datetime(coeffs["date"])
    dates = coeffs["date"].unique()
    selected_date = dates[timestamp]
    coeffs = coeffs[coeffs["date"] == selected_date]
    idx_high = coeffs.iloc[:, 2 + freq] > configs["threshold"]
    coeffs = coeffs[idx_high]
    coeffs["value"] = coeffs[f"mean_freq{freq}"]
    return jsonify(coeffs.to_dict(orient="records"))

    
@app.route('/get_time_series', methods=["GET", "POST"])
def get_time_series():
    block_id = int(request.form['block_id'])
    selected_signals = request.form.getlist('signals[]')
    df = pd.read_csv(f"wavelet_code/data/polygon_data/{POLY}_{TIME}.csv")
    temporal = df[df['id_poly'] == block_id][['date'] + selected_signals]
    return json.dumps({'temporal': json.loads(temporal.to_json(orient='records')), 'columns': temporal.columns.values.tolist()[1:]})


if __name__ == '__main__':
    app.run(debug=True, port=8080)
