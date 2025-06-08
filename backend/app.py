from flask import Flask, request, jsonify
import csv
import os
from flask_cors import CORS


app = Flask(__name__)
CORS(app) 
CSV_FILE = 'plates.csv'
FIELDNAMES = ['plate', 'authorized']

def read_csv():
    if not os.path.exists(CSV_FILE):
        return []
    with open(CSV_FILE, newline='') as f:
        return list(csv.DictReader(f))

def write_csv(rows):
    with open(CSV_FILE, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(rows)

@app.route('/plates', methods=['GET'])
def get_plates():
    return jsonify(read_csv())

@app.route('/plates', methods=['POST'])
def add_plate():
    data = request.json
    plate = data.get('plate')
    if not plate:
        return jsonify({'error': 'Plate is required'}), 400
    rows = read_csv()
    if any(row['plate'] == plate for row in rows):
        return jsonify({'error': 'Plate already exists'}), 400
    rows.append({'plate': plate, 'authorized': 'False'})
    write_csv(rows)
    return jsonify({'message': 'Plate added'})

@app.route('/plates/<plate>', methods=['PATCH'])
def toggle_plate(plate):
    rows = read_csv()
    for row in rows:
        if row['plate'] == plate:
            row['authorized'] = 'False' if row['authorized'] == 'True' else 'True'
            write_csv(rows)
            return jsonify({'message': 'Authorization toggled'})
    return jsonify({'error': 'Plate not found'}), 404

@app.route('/plates/<plate>', methods=['DELETE'])
def delete_plate(plate):
    rows = read_csv()
    new_rows = [r for r in rows if r['plate'] != plate]
    if len(rows) == len(new_rows):
        return jsonify({'error': 'Plate not found'}), 404
    write_csv(new_rows)
    return jsonify({'message': 'Plate deleted'})

if __name__ == '__main__':
    app.run(debug=True, port=5001)
