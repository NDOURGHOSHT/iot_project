# importer flask
from flask import Flask, render_template
from pymongo import MongoClient
# pour connecter le ESP32 
from flask import request
# créer application
app = Flask(__name__)
# connexion à MongoDB locale
client = MongoClient("mongodb://localhost:27017/")

# base de données
db = client["iot_database"]

# collection (table)
collection = db["sensor_data"]

# page principale
@app.route('/')
def home():
    # récupérer la dernière donnée ajoutée
    data = collection.find_one(sort=[("_id", -1)])

    return render_template("index.html", data=data)

    

@app.route('/test')
def test():
    collection.insert_one({
        "temperature": 25,
        "humidity": 60,
        "ldr": 300,
        "mq135": 100,
        "wind": 5
    })
    return "Donnée ajoutée"
#pour le ESP32

@app.route('/api/data', methods=['POST'])
def receive_data():
    data = request.json

    collection.insert_one(data)

    return {"message": "Donnée reçue"}, 200

# lancer serveur
if __name__ == '__main__':
    #app.run(debug=True)
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)