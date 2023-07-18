from flask import Flask, render_template, request, json,jsonify
import csv
import pandas as pd
import numpy as np
import math
import os
from glob import glob

app = Flask(__name__,static_url_path='/static')
files = glob('static/data/*.png')

@app.route("/",methods=["GET","POST"])
def index():
    print(os.path.dirname(app.instance_path))
    return render_template('index.html')

@app.route("/tiles/<int:z>/<int:x>/<int:y>.png")
def tiles(z,x,y):
    tile = files[1500]
    tile = open(tile, 'rb').read()
    return tile, 200, {'Content-Type': 'image/png'}


if __name__=="__main__":
	app.run(debug=True)