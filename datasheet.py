import csv
csv.field_size_limit(70 * 1024 * 1024)  # Increase to 10 MB or higher if needed
import pandas as pd
import re
from dateutil.parser import parse

input_file = "gate_outs.csv"
clean_file = "gate_outs_intermediate.csv"
output_file = "gate_outs_cleaned.csv"

def is_date(string):
    try:
        parse(string)
        return True
    except:
        return False

def is_all_caps(string):
    return bool(re.fullmatch(r'[A-Z]+', string))

# Step 1: Clean the CSV line by line
with open(input_file, encoding='ISO-8859-1', errors='ignore') as infile, \
     open(clean_file, 'w', newline='', encoding='utf-8') as outfile:

    reader = csv.reader(infile)
    writer = csv.writer(outfile)

    header = next(reader)
    writer.writerow(header)

    for row in reader:
        if len(row) < 4:
            continue  # skip rows with missing columns
        if all(is_date(row[i]) for i in range(3)) and is_all_caps(row[3]):
            writer.writerow(row)

print(f"Cleaned intermediate CSV written: {clean_file}")

# Step 2: Load cleaned CSV with pandas
df = pd.read_csv(clean_file, encoding='utf-8')

# Step 3: Drop rows by index range safely
start_idx, end_idx = 920251, 946421
df = df.drop(df.index[start_idx:end_idx], errors='ignore')

# Step 4: Rename columns
df = df.rename(columns={
    'gate_out_time': 'Exit Time',
    'paid_date': 'Entry Time',
    'terminal': 'Terminal Name'
})

# Step 5: Save final cleaned CSV
df.to_csv(output_file, index=False, encoding='utf-8-sig')

print(f"✅ Final cleaned CSV saved: {output_file}")
