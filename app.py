from flask import Flask, render_template, request, json, jsonify, send_from_directory
import csv
import pandas as pd
import numpy as np
import math
import os
from glob import glob

app = Flask(__name__, static_url_path="/static")


@app.route("/", methods=["GET", "POST"])
def index():
    print(os.path.dirname(app.instance_path))
    return render_template("index.html")


@app.route("/tiles/<int:z>/<int:x>/<int:y>/<int:T>.png")
def tiles(z, x, y, T):
    load_from_github = True
    if load_from_github:
        import requests

        tile = f"https://raw.githubusercontent.com/visual-ds/AutoSatViewer/main/static/tiles/image_0/patch_{x}_{y}_{z}.jpg"
        try:
            tile = requests.get(tile).content
            return tile, 200, {"Content-Type": "image/png"}
        except:
            return "", 204
    else:
        tile = f"/media/giovani/DATA/gee-data/patches/image_{T}/patch_{x}_{y}_{z}.jpg"
        try:
            tile = open(tile, "rb").read()
            return tile, 200, {"Content-Type": "image/png"}
        except:
            return "", 204


@app.route("/data_source/<string:source>")
def load_data_source(source):
    df = pd.read_csv(
        "/home/giovani/Documents/amazonia_project/data/vis_tool/data_diff.csv"
    )
    df_overview = pd.read_csv(
        "/home/giovani/Documents/amazonia_project/data/vis_tool/data_diff_overview.csv"
    )
    df = df[["t", "pos", "lon_min", "lon_max", "lat_min", "lat_max", source]]
    df_overview = df_overview[
        ["t", "pos", "lon_min", "lon_max", "lat_min", "lat_max", source]
    ]
    df = df.to_json(orient="records")
    df_overview = df_overview.to_json(orient="records")
    return jsonify(data=df, data_overview=df_overview)


@app.route("/temporal_graph")
def load_temporal_graph():
    res = json.load(
        open(
            "/home/giovani/Documents/amazonia_project/data/vis_tool/data_temporal_graph.json"
        )
    )
    return jsonify(res)


if __name__ == "__main__":
    app.run(debug=True)
