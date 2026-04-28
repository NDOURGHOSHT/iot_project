c'est un site qui capte les donnés des capteur et le mettent dans le site

procedure de travail:
 apres chaque pip install je dois faire  pip freeze > requirements.txt pour enregister les depandences.
 pip freeze enregistre toutes les dépendances du projet pour qu’un autre PC puisse refaire :
pip install -r requirements.txt

 et faire un 
 git add .
git commit -m "Initial project setup"
git push 