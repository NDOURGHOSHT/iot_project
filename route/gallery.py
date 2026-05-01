from flask import Blueprint, render_template, request, jsonify
from db import db
from datetime import datetime
import base64

gallery_bp = Blueprint("gallery", __name__)

@gallery_bp.route("/galerie")
def galerie_page():
    captures = list(db["captures"].find().sort("_id", -1).limit(20))
    for c in captures:
        c["_id"] = str(c["_id"])
        if "timestamp" in c:
            c["timestamp"] = c["timestamp"].strftime("%d/%m/%Y %H:%M")
    return render_template("galerie.html", captures=captures)

@gallery_bp.route("/api/capture", methods=["POST"])
def receive_capture():
    data = request.get_json()
    db["captures"].insert_one({
        "image": data["image"],  # base64
        "source": data.get("source", "webcam"),
        "timestamp": datetime.utcnow()
    })
    return jsonify({"status": "ok"}), 200

@gallery_bp.route("/api/captures", methods=["GET"])
def get_captures():
    captures = list(db["captures"].find().sort("_id", -1).limit(20))
    for c in captures:
        c["_id"] = str(c["_id"])
        c["timestamp"] = c["timestamp"].strftime("%d/%m/%Y %H:%M")
    return jsonify(captures)

@gallery_bp.route("/api/cam-status")
def cam_status():
    last = db["captures"].find_one(sort=[("_id", -1)])
    if not last:
        return jsonify({"online": False})
    diff = (datetime.utcnow() - last["timestamp"]).total_seconds()
    return jsonify({"online": diff < 60})