from flask import Flask, render_template, request, json,jsonify, send_from_directory
import csv
import pandas as pd
import numpy as np
import math
import os
from glob import glob

app = Flask(__name__,static_url_path='/static')
#files = glob('static/data/*.png')
files = glob("/media/giovani/DATA/gee-data/patches/image_18/*.jpg")

@app.route("/",methods=["GET","POST"])
def index():
    print(os.path.dirname(app.instance_path))
    return render_template('index.html')

@app.route("/tiles/<int:z>/<int:x>/<int:y>.png")
def tiles(z,x,y):
    tile = [f for f in files if f"{x}_{y}_{z}" in f]
    if len(tile) == 0:
        return '', 204
    tile = tile[0]
    tile = open(tile, 'rb').read()
    return tile, 200, {'Content-Type': 'image/png'}


if __name__=="__main__":
	app.run(debug=True)