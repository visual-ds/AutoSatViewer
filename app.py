from flask import Flask, render_template, jsonify
import numpy as np
import pandas as pd

POLY = ["SpCenterCensus10k", "SpDistricts"][0]
TIME = ["Day", "Month"][1]
SIGNAL_TYPES = ["RouboCelular", "FurtoCelular", "WazeJAM"]
N_SIGNALS = len(SIGNAL_TYPES)
N_FREQS = 4
THRESHOLD = 0.6

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/get_heatmap_data')
def get_heatmap_data():
    data = []
    for typ in SIGNAL_TYPES:
        coeffs = pd.read_csv(f"wavelet_code/data/coeffs/{typ}_{POLY}_{TIME}.csv")

        n_f = 32 // N_FREQS
        for i in range(N_FREQS):
            columns = [f"{typ}_coeff_{j}" for j in range(i * n_f, (i + 1) * n_f)]
            coeffs["mean_freq" + str(i)] = coeffs[columns].mean(axis=1)
            coeffs.drop(columns, axis=1, inplace=True)

        def get_high_count(df):
            return (df.iloc[:, 2:] > THRESHOLD).sum(axis=0)
        
        coeffs = coeffs.groupby("date").apply(get_high_count)
        coeffs["type"] = typ
        coeffs = coeffs.reset_index(drop=True)
        coeffs = coeffs.reset_index()
        coeffs.columns = ["timestamp"] + list(range(N_FREQS)) + ["type"]
        # transform freq columns to new rows
        coeffs = pd.melt(coeffs, id_vars=["timestamp", "type"], value_vars=list(range(N_FREQS)), var_name="freq", value_name="value")
        data.append(coeffs)
    
    data = pd.concat(data)
    data = data.to_dict(orient="records")
    return jsonify(data)


if __name__ == '__main__':
    app.run(debug=True, port=8080)
