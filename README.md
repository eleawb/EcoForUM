# Projet L3 EcoForum 2025-2026

[Lien vers le drive du projet](https://drive.google.com/drive/folders/1pDWjVzZtVJSltq6X1iO6_A5gh6dT9goN)

## Nom des étudiants en L3 informatique
- Aurore Minihot
- Éléa Weber
- Ernest Niederman
- Francisco Ernesto Suarez Roca
- Maeva Zerbib
- Olivia Aing
- Oriane Roux

## Nom des encadrants
- Anne-Muriel Arigon
- Marine Zwicke
- Annie Chateau


<!--ENSUITE :

- soit sur pgAdmin : créer une bdd vide EcoForumV7, clic droit sur la base, "Query Tool", Menu File, Open, choisir EcoForumV7.sql, Execute / Play
- soit ligne de cmd : psql -U postgres -d EcoForumV7 -f EcoForumV7.sql

se mettre dans dossier racine : npm install (installe tous les imports et dépendances)
se mettre dans /mon-projet
pour lancer le client et le serveur en simultané : lancer "npm run dev:all"
-->



Carte des zones du campus avec instruments de mesure :
https://www.google.com/maps/d/u/1/viewer?ll=43.63208270185771%2C3.8634961583030103&z=17&mid=1zQxZ4ap-1xYahwCcU7LALE8AnQ5Dhs0

## Créer la base de données

- Créez une base avec le nom et le mdp de votre choix
- Lancez le script de création de base présent dans `"./Base_de_donnees/Script_creation_tables.sql"`
- Créez un fichier .env dans le dossier Base_de_donnees 
Ceci n'est qu'un exemple, remplacé ces informations par celles de votre base de données.
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nom_base
DB_USER=postgres
DB_PASSWORD=mdp
```

Le .env est ajouté dans .gitignore pour ne pas que le fichier soit push dans le gitlab (sécurité).

## Requis pour lancer l'application (sans dockerisation)

### Installer NodeJS s'il ne l'ait pas déjà

- Vérifiez si NodeJS et npm sont déjà installés ou non sur votre ordinateur avec :
```bash
node -v
npm -v
```
- S'il ne l'est pas (la version ne s'affiche pas), installez le depuis `"nodejs.org"`
    - Installez la version LTS la plus récente
    - Cochez 'add to Path' et 'install npm package manager'

### Lancer l'application

__Installer les dépendances :__  
Mettez-vous dans `"projet-l3-ecoforum/mon-projet"` pour avoir accès au `"package.json"` qui contient les dépendances à installer.
```bash
npm install 
```
__S'il y a des problèmes avec une dépendance :__ 
```
npm install 'dependance'
```
__Lancer l'application :__ 
```bash
npm run dev:all
```
Le serveur se lancera à l'adresse "http://localhost:5173/".

## Requis pour lancer les scripts sans l'application

### Appel au controleur pour lancer des scripts

Placez-vous tout d'abord à la base du projet `"projet-l3-ecoforum"`.

__Sous Linux :__ 
```bash
python/python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
```

__Sous Windows :__
```bash
python/python3 -m venv .venv
.venv/Scripts/activate.bat
pip install -r requirements.txt
```

**Pour lancer la vérification/intégration d'un fichier de mesure ou de métadonnées depuis le controleur :**
```bash
cd mon-projet
python/python3 ../Base_de_donnees/controleur.py 'chemin_fichier_JSON'
```

### JSON à fournir au controleur

Les champs commençant par une * sont obligatoires.

__Structure type d'un JSON de vérification :__ 
```json
* "script" : "verification",
* "chemin_source" : "chemin_du_fichier_dont_on_veut_integrer_les_donnees",
* "nom_outil" : "nom_de_l'instrument_de_mesure",
* "num_instrument" : "numero_defini_par_Marine_Zwicke"
```

__Structure type d'un JSON d'intégration de métadonnées :__ 
```json
* "script" : "inte_metadonnees",
# Parmis (Personne, Capteur, Localisation, Projet)
# Et (Projet => Personne)
* "type_script" : ["", ...],
# Dans le même ordre que les scripts
* "fichier_donnees" : ["nom_de_fichier_contenant_les_metadonnees", ...]
```

__Structure type d'un JSON d'intégration de fichier de mesure :__ 
```json
* "script" : "integration",
* "chemin_source" : "chemin_du_fichier_dont_on_veut_integrer_les_donnees",
* "type_source" : "fichier",
* "nom_outil" : "nom_de_l'instrument_de_mesure",
* "num_instrument" : "numero_defini_par_Marine_Zwicke",
"num_serie" : "numero_present_dans_le_nom_du_fichier",
# Exemple 'csv', 'xlsx'
"extension" : "...",
"date_recueil" : "YYYY-MM-DD HH:MM:SS",
"date_import" : "YYYY-MM-DD HH:MM:SS",
"commentaire" : "...",

* "mail_responsable" : "nom@example.com",
* "est_responsable_fichier" : false,
# A ajouter si la personne n'est pas déjà un responsable
"nom" : "nom",
"prenom" : "prenom",
"fonction" : "...",
"encadre_par" : "nom2@example.com"
```