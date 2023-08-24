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
    tile = f"/media/giovani/DATA/gee-data/patches/image_{T}/patch_{x}_{y}_{z}.jpg"
    try:
        tile = open(tile, "rb").read()
        return tile, 200, {"Content-Type": "image/png"}
    except:
        return "", 204


if __name__ == "__main__":
    app.run(debug=True)
