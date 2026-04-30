from flask import Blueprint, render_template
from db import collection

main_bp = Blueprint('main', __name__)



@main_bp.route('/')
def home():
    data = collection.find_one(sort=[("_id", -1)])
    return render_template("index.html", data=data)

@main_bp.route('/history')
def history():
    return render_template("history.html")