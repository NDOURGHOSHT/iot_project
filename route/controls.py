from flask import Blueprint, render_template, request, jsonify
from db import db
from datetime import datetime

controls_bp = Blueprint('controls', __name__)

# état par défaut

DEFAULT_STATE = {
    "mode": "auto",  # "auto" ou "manuel"
    "lampe1": False,
    "lampe2": False,
    "ventilateur": False,
    "fenetre1": False,
    "fenetre2": False
}

def get_state():
    state = db["controls"].find_one({"key": "state"})
    if not state:
        return DEFAULT_STATE.copy()
    return state["value"]

def save_state(state):
    db["controls"].update_one(
        {"key": "state"},
        {"$set": {"value": state, "updated_at": datetime.utcnow()}},
        upsert=True
    )

@controls_bp.route("/controls")
def controls_page():
    state = get_state()
    return render_template("controls.html", state=state)

@controls_bp.route("/api/commands", methods=["GET"])
def get_commands():
    # ESP32 poll cette route
    return jsonify(get_state())

@controls_bp.route("/api/commands", methods=["POST"])
def update_command():
    data = request.get_json()
    state = get_state()
    for key in DEFAULT_STATE:
        if key in data:
            state[key] = data[key]
    save_state(state)
    return jsonify({"status": "ok", "state": state})