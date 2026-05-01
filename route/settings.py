# route/settings.py
from flask import Blueprint, render_template, request, jsonify
from db import db  # ← ton db.py doit exposer `db` aussi

settings_bp = Blueprint("settings", __name__)

@settings_bp.route("/settings")
def settings_page():
    users = list(db["users"].find({}, {"password_hash": 0}))
    for u in users:
        u["_id"] = str(u["_id"])
    return render_template("settings.html", users=users)

@settings_bp.route("/settings/frequency", methods=["POST"])
def save_frequency():
    data = request.get_json()
    db["settings"].update_one(
        {"key": "frequency"},
        {"$set": {"value": data}},
        upsert=True
    )
    return jsonify({"status": "saved"})


    