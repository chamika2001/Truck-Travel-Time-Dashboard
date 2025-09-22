from flask import Flask, render_template, request, jsonify
import pandas as pd
from datetime import datetime, timedelta

app = Flask(__name__)

# Load and preprocess CSV
df = pd.read_csv('colombo_truck_data_2024.csv')
df['Entry Time'] = pd.to_datetime(df['Entry Time'])
df['Exit Time'] = pd.to_datetime(df['Exit Time'])

# Travel time in minutes
df['Travel Time (min)'] = (df['Exit Time'] - df['Entry Time']).dt.total_seconds() / 60
df = df[df['Travel Time (min)'] >= 0]  # Remove negative values

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_hourly_data')
def get_hourly_data():
    date_str = request.args.get('date')
    date = datetime.strptime(date_str, '%Y-%m-%d')
    day_start = datetime.combine(date, datetime.min.time())
    day_end = day_start + timedelta(days=1)

    day_data = df[(df['Entry Time'] >= day_start) & (df['Entry Time'] < day_end)]
    terminals = ['JCT', 'ECT', 'CICT', 'SAGT', 'CWIT']
    result = {t: [0] * 24 for t in terminals}
    counts = {t: [0] * 24 for t in terminals}

    for _, row in day_data.iterrows():
        t = row['Terminal Name']
        h = row['Exit Time'].hour
        if t in result:
            result[t][h] += row['Travel Time (min)']
            counts[t][h] += 1

    for t in terminals:
        result[t] = [round(result[t][h] / counts[t][h], 2) if counts[t][h] else 0 for h in range(24)]

    return jsonify(result)

@app.route('/get_daily_data')
def get_daily_data():
    year = int(request.args.get('year'))
    month = int(request.args.get('month'))
    month_start = datetime(year, month, 1)
    next_month = month_start + timedelta(days=32)
    month_end = datetime(next_month.year, next_month.month, 1)

    monthly_data = df[(df['Entry Time'] >= month_start) & (df['Entry Time'] < month_end)]
    terminals = ['JCT', 'ECT', 'CICT', 'SAGT', 'CWIT']
    days = (month_end - month_start).days
    result = {t: [0] * days for t in terminals}
    counts = {t: [0] * days for t in terminals}

    for _, row in monthly_data.iterrows():
        t = row['Terminal Name']
        d = row['Entry Time'].day - 1
        if t in result:
            result[t][d] += row['Travel Time (min)']
            counts[t][d] += 1

    for t in terminals:
        result[t] = [round(result[t][d] / counts[t][d], 2) if counts[t][d] else 0 for d in range(days)]

    return jsonify({'days': list(range(1, days + 1)), 'data': result})



if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
