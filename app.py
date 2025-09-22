from flask import Flask, render_template, request, jsonify
import pandas as pd
from datetime import datetime, timedelta

app = Flask(__name__)

# Load and preprocess CSV
df = pd.read_csv('colombo_truck_data_2024.csv')
df['Entry Time'] = pd.to_datetime(df['Entry Time'])
df['Exit Time'] = pd.to_datetime(df['Exit Time'])



if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
