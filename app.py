# importer flask
from flask import Flask, render_template

# créer application
app = Flask(__name__)

# page principale
@app.route('/')
def home():
    return render_template("index.html")

# lancer serveur
if __name__ == '__main__':
    app.run(debug=True)