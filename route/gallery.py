from flask import Blueprint, render_template, request, jsonify
from db import db
from datetime import datetime
import base64
import requests
from flask import Response

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
        "source": data.get("source", "ESP32_STREAM"),
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

# @gallery_bp.route("/api/cam-status")
# def cam_status():
#     import urllib.request
#     try:
#         urllib.request.urlopen(f"http://192.168.43.200:81/stream", timeout=2)
#         return jsonify({"online": True})
#     except:
#         return jsonify({"online": False})

@gallery_bp.route("/api/cam-status")
def cam_status():
    import socket
    try:
        s = socket.create_connection(("192.168.43.200", 81), timeout=2)
        s.close()
        return jsonify({"online": True})
    except:
        return jsonify({"online": False})

@gallery_bp.route("/api/stream")
def proxy_stream():
    try:
        r = requests.get("http://192.168.43.200:81/stream", stream=True, timeout=5)
        return Response(
            r.iter_content(chunk_size=1024),
            content_type=r.headers['Content-Type']
        )
    except:
        return jsonify({"error": "stream indisponible"}), 503