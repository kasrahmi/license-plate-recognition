from flask import Flask, request, jsonify
import csv
import os
import re
import cv2
import time
import base64
import numpy as np
import easyocr
from flask_cors import CORS
from flask_socketio import SocketIO


app = Flask(__name__)
CORS(app) 
socketio = SocketIO(app, cors_allowed_origins="*")

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

def run_plate_ocr(image):
    """Runs OCR on an image and returns the best valid plate, or None."""
    results = reader.readtext(image)
    if not results:
        return None
    valid_candidates = []
    for bbox, text, prob in results:
        normalized = _normalize_text_for_plate(text)
        if _PLATE_REGEX.match(normalized):
            valid_candidates.append((bbox, normalized, prob))
    if not valid_candidates:
        return None
    bbox, plate_text, prob = max(valid_candidates, key=lambda x: float(x[2]))
    return {"bbox": bbox, "plate": plate_text, "prob": prob}

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
    socketio.emit('plates_list', read_csv())
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
    socketio.emit('plates_list', read_csv())
    return jsonify({'message': 'Plate added'})

@app.route('/plates/<plate>', methods=['PATCH'])
def toggle_plate(plate):
    rows = read_csv()
    for row in rows:
        if row['plate'] == plate:
            row['authorized'] = 'False' if row['authorized'] == 'True' else 'True'
            write_csv(rows)
            socketio.emit('plates_list', read_csv())
            return jsonify({'message': 'Authorization toggled'})
    return jsonify({'error': 'Plate not found'}), 404

@app.route('/plates/<plate>', methods=['DELETE'])
def delete_plate(plate):
    rows = read_csv()
    new_rows = [r for r in rows if r['plate'] != plate]
    if len(rows) == len(new_rows):
        return jsonify({'error': 'Plate not found'}), 404
    write_csv(new_rows)
    socketio.emit('plates_list', read_csv())
    return jsonify({'message': 'Plate deleted'})

@app.route("/detect_plate", methods=["POST"])
def detect_plate():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400
    file = request.files["image"]
    img_bytes = np.frombuffer(file.read(), np.uint8)
    image = cv2.imdecode(img_bytes, cv2.IMREAD_COLOR)
    result = run_plate_ocr(image)
    if not result:
        return jsonify({"error": "No valid plate found"}), 400
    plate_text = result['plate']
    prob = float(result['prob'])
    rows = read_csv()
    authorized = any(
        row['plate'].strip().upper() == plate_text.strip().upper() and row['authorized'] == 'True'
        for row in rows
    )
    return jsonify({"plate": plate_text, "confidence": f"{prob:.2f}", "authorized": authorized})

# ----------------- Camera Streaming -----------------
cap = cv2.VideoCapture(0, cv2.CAP_AVFOUNDATION)
if not cap.isOpened():
    print("Error: Cannot open camera")
    exit(1)
ocr_interval = 0.5
last_ocr_time = 0
ocr_results = []

def generate_frames():
    global last_ocr_time, ocr_results
    while True:
        ret, frame = cap.read()
        if not ret:
            continue
        display_frame = frame.copy()
        current_time = time.time()
        if current_time - last_ocr_time > ocr_interval:
            last_ocr_time = current_time
            result = run_plate_ocr(frame)
            ocr_results = [result] if result else []
        if ocr_results:
            best = ocr_results[0]
            plate_text = best['plate']
            prob = float(best['prob'])
            bbox = best['bbox']

            # draw on frame (your existing drawing code)
            pts = [(int(p[0]), int(p[1])) for p in bbox]
            x1, y1 = min(p[0] for p in pts), min(p[1] for p in pts)
            x2, y2 = max(p[0] for p in pts), max(p[1] for p in pts)
            cv2.rectangle(display_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(display_frame, f"{plate_text} ({prob:.2f})",
                        (x1, max(10, y1 - 10)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

            # --- NEW: check CSV for authorized and emit plate_detected ---
            rows = read_csv()
            authorized = any(
                row['plate'].strip().upper() == plate_text.strip().upper() and row['authorized'] == 'True'
                for row in rows
            )
            socketio.emit('plate_detected', {
                'plate': plate_text,
                'confidence': float(prob),
                'authorized': bool(authorized)
            })
        else:
            h, w = frame.shape[:2]
            cv2.putText(display_frame, "No valid plate detected",
                        (10, h - 30), cv2.FONT_HERSHEY_SIMPLEX,
                        0.8, (0, 0, 255), 2)
        _, buffer = cv2.imencode('.jpg', display_frame)
        jpg_as_text = base64.b64encode(buffer).decode('utf-8')
        socketio.emit('frame', {'image': jpg_as_text})
        socketio.sleep(0.05)  # ~20 FPS

@socketio.on('connect')
def handle_connect():
    print("Client connected")

@socketio.on('disconnect')
def handle_disconnect():
    print("Client disconnected")

# ----------------- Run Server -----------------
if __name__ == '__main__':
    socketio.start_background_task(generate_frames)  # always running OCR
    try:
        socketio.run(app, host="0.0.0.0", port=5001)
    finally:
        cap.release()
        cv2.destroyAllWindows()
