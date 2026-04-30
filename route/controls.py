# route/controls.py
from flask import Blueprint, request
from db import collection

controls_bp = Blueprint('controls', __name__, url_prefix='/controls')

@controls_bp.route('/light', methods=['POST'])
def toggle_light():
    # envoyer commande au ESP32
    pass

@controls_bp.route('/fan', methods=['POST'])
def toggle_fan():
    pass