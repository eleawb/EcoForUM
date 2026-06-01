# Projet L3 EcoForum

[Lien vers le drive du projet](https://drive.google.com/drive/folders/1pDWjVzZtVJSltq6X1iO6_A5gh6dT9goN)

## Nom des étudiants
- Aurore Minihot
- Éléa Weber
- Ernest Niederman
- Francisco Ernesto Suarez Roca
- Maeva Zerbib
- Oriane Roux

## Nom des encadrants
- Anne-Muriel Arigon
- Marine Zwicke
- Annie Chateau

Dans # package.json, explications des dépendences

voir s'il suffit de taper "npm run dependencies" et "devDependencies" pour installer les dépendences


TEST POUR SE CONNECTER A LA BDD ECOFORUMV7 (avec intégration données hobo_n°02, hobo_n°36, tms4, dendromètre (puis plus tard intégration par ajout de fichier du reste))

avant tout, créez vous un fichier .env dans /Base_de_donnees et ajoutez : 
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=EcoForumV7
DB_USER=postgres
DB_PASSWORD=mdp
```

et modifiez postgres avec votre nom d'utilisateur sur pgAdmin, et mdp votre mdp pgAdmin
normalement .env est ajouté dans .gitignore pour ne pas que le fichier soit push dans le gitlab (sécurité)

ENSUITE :

- soit sur pgAdmin : créer une bdd vide EcoForumV7, clic droit sur la base, "Query Tool", Menu File, Open, choisir EcoForumV7.sql, Execute / Play
- soit ligne de cmd : psql -U postgres -d EcoForumV7 -f EcoForumV7.sql

se mettre dans dossier racine : npm install (installe tous les imports et dépendances)
se mettre dans /mon-projet
pour lancer le client et le serveur en simultané : lancer "npm run dev:all"



Carte des zones du campus avec instruments de mesure :
https://www.google.com/maps/d/u/1/viewer?ll=43.63208270185771%2C3.8634961583030103&z=17&mid=1zQxZ4ap-1xYahwCcU7LALE8AnQ5Dhs0

## Requis pour lancer les scripts sans l'application
Placez-vous tout d'abord à la base du projet (projet-l3-ecoforum).

Sous Linux : 
```bash
python/python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
```

Sous Windows :
```bash
python/python3 -m venv .venv
.venv/Scripts/activate.bat
pip install -r requirements.txt
```

Pour lancer la vérification/intégration d'un fichier de mesure ou de métadonnées depuis le controleur : 
```bash
cd mon-projet
python/python3 ../Base_de_donnees/controleur.py 'chemin_fichier_JSON'
```

Les champs commençant par une * sont obligatoires.

Structure type d'un JSON de vérification : 
```json
* "script" : "verification",
* "chemin_source" : "chemin_du_fichier_dont_on_veut_integrer_les_donnees",
* "nom_outil" : "nom_de_l'instrument_de_mesure",
* "num_instrument" : "numero_defini_par_Marine_Zwicke"
```

Structure type d'un JSON d'intégration de métadonnées : 
```json
* "script" : "inte_metadonnees",
* "nom_fichier_meta" : "nom_de_fichier_contenant_les_metadonnees",
# Parmis (Personne, Capteur, Localisation, Projet)
# Et (Projet => Personne)
* "type_script" : ["", ...]
```

Structure type d'un JSON d'intégration de fichier de mesure : 
```json
* "script" : "integration",
* "chemin_source" : "chemin_du_fichier_dont_on_veut_integrer_les_donnees",
* "type_source" : "fichier",
* "nom_outil" : "nom_de_l'instrument_de_mesure",
* "num_instrument" : "numero_defini_par_Marine_Zwicke",
"num_serie" : "numero_present_dans_le_nom_du_fichier",
# Exemple 'csv', 'xlsx'
"extension" : "...",
"date_recueil" : "YYYY -MM -DD HH :MM :SS",
"date_import" : "YYYY -MM -DD HH :MM :SS",
"commentaire" : "...",

* "mail_responsable" : "nom@example.com",
* "est_responsable_fichier" : false,
# A ajouter si la personne n'est pas déjà un responsable
"nom" : "nom",
"prenom" : "prenom",
"fonction" : "...",
"encadre_par" : "nom2@example.com"
```