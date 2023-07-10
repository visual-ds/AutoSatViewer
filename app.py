from flask import Flask, render_template, request, json,jsonify
import csv
import pandas as pd
import numpy as np
import os

app = Flask(__name__,static_url_path='/static')

@app.route("/",methods=["GET","POST"])
def index():
    print(os.path.dirname(app.instance_path))
    return render_template('index.html')

if __name__=="__main__":
	app.run(debug=True)