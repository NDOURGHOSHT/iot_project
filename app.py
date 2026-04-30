from flask import Flask
from pymongo import MongoClient
from route.main import main_bp
from route.api import api_bp
from route.errors import errors_bp

app = Flask(__name__)

app.register_blueprint(main_bp)
app.register_blueprint(api_bp)
app.register_blueprint(errors_bp)

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)