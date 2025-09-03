from flask import Flask, request, jsonify
import csv
import os
import cv2
import numpy as np
import easyocr
from flask_cors import CORS
import re


app = Flask(__name__)
CORS(app) 
CSV_FILE = 'plates.csv'
FIELDNAMES = ['plate', 'authorized']

_PLATE_REGEX = re.compile(r"^\d{4}[A-Z]{3}$")


reader = easyocr.Reader(['en'])

def _normalize_text_for_plate(s: str) -> str:
    """Remove non-alnum, uppercase and strip so OCR variants match the regex."""
    if not s:
        return ""
    cleaned = re.sub(r"[^A-Za-z0-9]", "", s)
    return cleaned.upper().strip()

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

@app.route("/detect_plate", methods=["POST"])
def detect_plate():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files["image"]
    img_bytes = np.frombuffer(file.read(), np.uint8)
    image = cv2.imdecode(img_bytes, cv2.IMREAD_COLOR)

    results = reader.readtext(image)

    if not results:
        return jsonify({"error": "No text detected"}), 404

    for p in results:
        # add a transient normalized field (won't affect other logic)
        p["_normalized_text"] = _normalize_text_for_plate(p.get("text", ""))

    # keep only those that match the plate regex
    _valid_candidates = [p for p in results if _PLATE_REGEX.match(p["_normalized_text"])]

    if not _valid_candidates:
        # strict enforcement: return 400 if none match
        return jsonify({
            "error": "No valid plate found matching regex (4 digits followed by 3 letters)."
        }), 400

    # choose highest-prob among valid candidates and use normalized text
    _best = max(_valid_candidates, key=lambda x: float(x.get("prob", 0.0)))
    plate_text = _best["_normalized_text"]
    prob = float(_best.get("prob", 0.0))
    # _, plate_text, prob = best_result

    rows = read_csv()
    authorized = False
    for row in rows:
        if row['plate'].strip().upper() == plate_text.strip().upper():
            authorized = row['authorized'] == 'True'
            break

    return jsonify({
        "plate": plate_text,
        "confidence": f"{prob:.2f}",
        "authorized": authorized
    })

if __name__ == '__main__':
    app.run(debug=True, port=5001)
