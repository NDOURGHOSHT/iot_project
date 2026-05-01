from flask import Blueprint, render_template, request, jsonify
from db import db
from bson import ObjectId
from datetime import datetime

alerts_bp = Blueprint("alerts", __name__)

@alerts_bp.route("/alerts")
def alerts_page():
    active = list(db["alerts"].find({"resolved": False}).sort("timestamp", -1))
    history = list(db["alerts"].find({"resolved": True}).sort("timestamp", -1).limit(50))
    for a in active + history:
        a["_id"] = str(a["_id"])
        if "timestamp" in a:
            a["timestamp"] = a["timestamp"].strftime("%d/%m/%Y %H:%M")
    return render_template("alerts.html", active=active, history=history)

@alerts_bp.route("/alerts/ack/<alert_id>", methods=["PATCH"])
def acknowledge(alert_id):
    db["alerts"].update_one(
        {"_id": ObjectId(alert_id)},
        {"$set": {"resolved": True, "resolved_at": datetime.utcnow()}}
    )
    return jsonify({"status": "ok"})

@alerts_bp.route("/alerts/thresholds", methods=["GET", "POST"])
def thresholds():
    if request.method == "POST":
        data = request.get_json()
        db["settings"].update_one(
            {"key": "thresholds"}, {"$set": {"value": data}}, upsert=True
        )
        return jsonify({"status": "updated"})
    config = db["settings"].find_one({"key": "thresholds"})
    return jsonify(config["value"] if config else {})