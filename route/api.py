from flask import Blueprint, request, jsonify
from db import collection, db
from datetime import datetime, timezone

api_bp = Blueprint('api', __name__)


@api_bp.route('/test')
def test():
    collection.insert_one({
        "temperature": 25,
        "humidity": 60,
        "ldr": 300,
        "mq135": 100,
        "wind": 5
    })
    return "Donnée ajoutée"

@api_bp.route('/api/data', methods=['POST'])
def receive_data():
    data = request.json
    collection.insert_one(data)
    return {"message": "Donnée reçue"}, 200

@api_bp.route('/data')
def get_data():
    data = collection.find().sort("_id", -1).limit(1)
    for d in data:
        d["_id"] = str(d["_id"])
        return d

@api_bp.route('/latest')
def latest():
    data = collection.find_one(sort=[("_id", -1)])
    if not data:
        return jsonify({"status": "no data"}), 404
    
    data["_id"] = str(data["_id"])
    
    # statut ESP32
    if "timestamp" in data:
        diff = (datetime.now(timezone.utc) - data["timestamp"]).total_seconds()
        data["esp32_online"] = diff < 30
    else:
        data["esp32_online"] = False

    return jsonify(data)

@api_bp.route('/history-data')
def history_data():
    data = list(collection.find().sort("_id", -1).limit(20))
    for d in data:
        d["_id"] = str(d["_id"])
    return data

@api_bp.route('/api/config', methods=['POST'])
def save_config():
    data = request.get_json()
    db["settings"].update_one(
        {"key": "frequency"},
        {"$set": {"value": data}},
        upsert=True
    )
    return jsonify({"status": "saved"})
