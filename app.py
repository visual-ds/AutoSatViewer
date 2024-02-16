from flask import Flask, render_template, jsonify
import numpy as np
import pandas as pd

POLY = "SpDistricts"
TIME = "Month"
SIGNAL_TYPES = ["RouboCelular", "FurtoCelular", "WazeAlerts"]
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
        coeffs = np.load(f"wavelet_code/data/coeffs/{typ}_{POLY}_{TIME}.npy")
        
        n_f = coeffs.shape[2] // N_FREQS
        dom_freq = np.zeros((coeffs.shape[0], coeffs.shape[1], N_FREQS))
        for i in range(N_FREQS):
            dom_freq[:, :, i] = np.mean(coeffs[:, :, i * n_f : (i + 1) * n_f], axis=-1)

        high_freq = dom_freq > THRESHOLD
        high_freq = high_freq.sum(axis = 0)

        print(high_freq.shape)
        
        for i in range(high_freq.shape[0]):
            for j in range(high_freq.shape[1]):
                data.append({
                    "type": typ,
                    "timestamp": i,
                    "freq" : j,
                    "value" : float(high_freq[i, j])
                })
    return data

if __name__ == '__main__':
    app.run(debug=True, port=8080)
