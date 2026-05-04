c'est un site qui capte les donnés des capteur et le mettent dans le site

iot_projet/
├── app.py
├── db.py
├── route/
├── static/
├── templates/
├── esp32/              
│   ├── src/
│   │   └── main.cpp
│   ├── platformio.ini
│   └── README.md
└── requirements.txt


procedure de travail:
 apres chaque pip install je dois faire  pip freeze > requirements.txt pour enregister les depandences.
 pip freeze enregistre toutes les dépendances du projet pour qu’un autre PC puisse refaire :
pip install -r requirements.txt

 et faire un 
 git add .
git commit -m "Initial project setup"
git push 

source env/Scripts/activate   pour awtiver le env

pour un mise a jour du .gitignoe
git add .gitignore
git commit -m "mise a jour gitignore"
git push