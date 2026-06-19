import psycopg2
import pandas as pd
import os
import csv
import re
from pathlib import Path
import argparse
from dotenv import load_dotenv #ajout
import json


def format_date(date):
    if date == None :
        return None

    #pour vérifier si date est de type timestamp ou datetime :
    #demander si date a un attribut strftime, si oui, alors le format est toujours le format classique YYYY-MM-DD
    if hasattr(date, "strftime"): 
        return "YYYY-MM-DD"

    elif date[0:4].isdigit() and len(date) >= 10:
        fmt = "YYYY" + date[4] + "MM" + date[7] + "DD"
        return fmt

    elif date[-4:].isdigit() and len(date) >= 10:
        fmt = "DD" + date[2] + "MM" + date[5]+ "YYYY"
        return fmt

    else :
        return None

def format_timestamp(date):
    if date == None :
        return None

    #pour vérifier si date est de type timestamp ou datetime :
    #demander si date a un attribut strftime, si oui, alors le format est toujours le format classique YYYY-MM-DD
    if hasattr(date, "strftime"): 
        return "YYYY-MM-DD HH24:MI:SS"

    elif date[0:4].isdigit() and len(date) >= 19:
        fmt = "YYYY" + date[4] + "MM" + date[7] + "DD" + " HH24:MI:SS"
        return fmt

    elif date[-4:].isdigit() and len(date) >= 10:
        fmt = "DD" + date[2] + "MM" + date[5]+ "YYYY" + " HH24:MISS"
        return fmt

    else :
        return None



def integration_fichier_metadonnees(ficPers, ficInstr, ficProj, ficJSON):
    """ Cette fonction prends en entrée les 4 fichiers .xlsx de métadonnées contenant des infos sur les personnes,
    les instruments, les capteurs, les localisations et les projets et insère les données dans la base"""

    #pour obtenir le chemin jusqu'au repertoire dans lequel se trouve ce programme (car dans mon cas les fichiers .xlsx y sont aussi)
    #s'ils n'y sont pas dans la version finale, il faudra donner dans chemin le chemin vers le répertoire où ils sont stockés

    #dictionnaire qui sera renvoyé en tant que JSON au contrôleur
    dico = {
        "reussite" : False,
        "commentaire" : "",
    }

    if ficPers is None and ficInstr is None and ficProj is None :
        dico["commentaire"] = "Il n'y avait aucun fichier à intégrer..."
        print(json.dumps(dico))
        return 0

    """
    if Path(os.getcwd()).stem == "projet-l3-ecoforum":
        chemin = os.path.join(os.getcwd(), "Base_de_donnees","Fichiers_metadonnees")
    elif Path(os.getcwd()).stem == "Base_de_donnees":
        chemin = os.path.join(os.getcwd(),"Fichiers_metadonnees")
    elif Path(os.getcwd()).stem == "mon-projet":
        chemin = "../Base_de_donnees/Fichiers_metadonnees"
    else :
        dico["commentaire"] = "Je ne sais pas d'où je suis lancé... (donc je ne sais pas comment ajuster le chemin vers le dossier contenant les fichiers de métadonnées)"
        print(json.dumps(dico))
        return False
"""



    #Ouverture de tous les fichiers .xlsx de métadonnées avec pandas + récupération dans des listes des noms des onglets
    #exemple : ['Instruments', 'Capteurs', 'Remplace_instrument&capteur', 'Coefficients_correcteurs', 'Maintenance', 'Localisations']
    if ficPers != None:
        dfPers = pd.read_excel(ficPers, sheet_name=None)
        onglets_Pers = list(dfPers.keys())
    if ficInstr != None :
        dfInstr = pd.read_excel(ficInstr, sheet_name=None)
        onglets_Instr = list(dfInstr.keys())
    #dfLoc = pd.read_excel(os.path.join(chemin, ficLoc), sheet_name=None)
    #onglets_Loc = list(dfLoc.keys())
    if ficProj != None :
        dfProj = pd.read_excel(ficProj, sheet_name=None)
        onglets_Proj = list(dfProj.keys())

    #Chargement du json contenant les informations utiles pour l'insertion du responsable fichier et de source_donnees
    with open(ficJSON, "r", encoding="utf-8") as f:
        data = json.load(f)

    if ficPers != None :
        #insertion des Personnes :
        #on itère sur des tuples de la forme (index, (ligne)) qui sont dans le premier onglet du fichier des personnes
        for index, row in dfPers[onglets_Pers[0]].iterrows():
            row = row.tolist()
            #conversion des valeurs des cases vides (NaN -> None) car PostgreSQL ne comprend pas les NaN mais arrive à convertir les None en NULL
            row = [None if pd.isna(x) else x for x in row]
            if row[2] != None and row[4] != None:

                #requête à la base pour insèrer une personne
                #ON CONFLICT (attribut) DO NOTHING sert à si on tente d'insérer un doublon et que l'on tombe sur une erreur due à une contrainte UNIQUE, on n'insère pas (on ne veut pas de doublons)
                #cur.execute("INSERT INTO personne (nom, prenom, adresse_mail, fonction) VALUES (%s, %s, %s, %s) ON CONFLICT (adresse_mail) DO NOTHING;", (row[0], row[1], row[2], row[3]))
                cur.execute("""INSERT INTO personne (nom, prenom, adresse_mail, fonction) SELECT %s, %s, %s, %s WHERE NOT EXISTS (SELECT 1 FROM personne WHERE lower(adresse_mail) IS NOT DISTINCT FROM lower(%s));""", (row[0], row[1], row[2], row[3], row[2]))
                #print("insertion d'une personne réussie")
                #Si la 4ème colonne de l'onglet contient un 'Oui', on crée également un responsable fichier
                if row[4].lower() == ("Oui").lower(): #on met les chaînes de caractère en minuscules pour tester leur égalité, ça évite la casse
                    #cur.execute("INSERT INTO responsable_fichier SELECT id_personne FROM personne WHERE lower(adresse_mail) IS NOT DISTINCT FROM lower(%s) ON CONFLICT (id_responsable) DO NOTHING;", (row[2],))
                    cur.execute("INSERT INTO responsable_fichier SELECT id_personne FROM personne WHERE lower(adresse_mail) IS NOT DISTINCT FROM lower(%s) AND NOT EXISTS (SELECT 1 FROM responsable_fichier WHERE id_responsable = (SELECT id_personne FROM personne WHERE lower(adresse_mail) IS NOT DISTINCT FROM lower(%s)));", (row[2], row[2]))
                    #print("insertion d'un responsable fichier réussie")

    if ficInstr != None :
        #insère les instruments de mesure
        for index, row in dfInstr[onglets_Instr[0]].iterrows():
            row = row.tolist()
            row = [None if pd.isna(x) else x for x in row]
            if row[1] != None and row[3] != None :
                #cur.execute("INSERT INTO instrument_mesure (num_instrument, modele, num_serie, nom_outil, pas_temps, fuseau_horaire, description_instrument, id_structure) SELECT %s, %s, %s, %s, %s, %s, %s, id_structure FROM structure_fichier WHERE lower(nom_instrument) IS NOT DISTINCT FROM lower(%s) ON CONFLICT (num_instrument) DO NOTHING;", (row[1], row[2], row[0], row[3], row[4], row[5], row[6], row[3]))
                cur.execute("""
                INSERT INTO instrument_mesure (num_instrument, modele, num_serie, nom_outil, pas_temps, fuseau_horaire, description_instrument, id_structure) SELECT %s, %s, %s, %s, %s, %s, %s, s.id_structure FROM structure_fichier s WHERE lower(s.nom_instrument) IS NOT DISTINCT FROM lower(%s)
                AND NOT EXISTS (SELECT 1 FROM instrument_mesure im WHERE lower(im.num_instrument) = lower(%s)
                );""", (row[1], row[2], row[0], row[3], row[4], row[5], row[6], row[3], row[1]))
                #print("insertion d'un instrument de mesure réussie")

        #insère les capteurs
        for index, row in dfInstr[onglets_Instr[1]].iterrows():
            row = row.tolist()
            row = [None if pd.isna(x) else x for x in row]
            if row[0] != None and row[3] != None and row[4] != None:
                #Pour insérer un capteur, il faut d'abord créer un capteur générique auquel il faudra le relier
                #cur.execute("INSERT INTO capteur_generique (description) VALUES (%s) ON CONFLICT (description) DO NOTHING;", (row[2],))
                cur.execute("""
                INSERT INTO capteur_generique (description) SELECT %s WHERE NOT EXISTS (SELECT 1 FROM capteur_generique cg JOIN capteur c ON cg.id_capteur_generique = c.id_capteur JOIN instrument_mesure im ON c.id_instrument = im.id_instrument AND lower(im.num_instrument) = lower(%s) AND c.num_colonne = %s and lower(c.nom_capteur) = lower(%s)) RETURNING id_capteur_generique;
                """, (row[2], row[0], row[3], row[4]))

                #cur.execute("""
                #SELECT id_capteur_generique FROM capteur_generique WHERE id_capteur_generique = (SELECT id_capteur FROM capteur c JOIN instrument_mesure im ON c.id_instrument = im.id_instrument AND lower(im.num_instrument) = lower(%s) AND c.num_colonne = %s and lower(c.nom_capteur) = lower(%s))
                #""", (row[0], row[3], row[4]))
                
                result = cur.fetchone()
                id_capt_gen = result[0] if result else None
                #print("insertion d'un capteur générique réussie")
                #Si la date que l'on a dans la case est de type date ou timestamp et pas string, il faut la convertir en string pour le bien des insert qui prennent des dates comme attributs car la fonction to_date de PostgreSQL n'aime que les string
                date_act = row[1].strftime("%Y-%m-%d") if hasattr(row[1], "strftime") else row[1]

                #cur.execute("INSERT INTO capteur (id_capteur, date_activation, id_instrument, num_colonne) SELECT (SELECT id_capteur_generique FROM capteur_generique WHERE lower(description) IS NOT DISTINCT FROM lower(%s)), to_date(%s, %s), (SELECT id_instrument FROM instrument_mesure WHERE lower(num_instrument) IS NOT DISTINCT FROM lower(%s)), %s ON CONFLICT (id_capteur) DO NOTHING;", (row[2], date_act, format_date(row[1]), row[0], row[3]))
                cur.execute("""
                INSERT INTO capteur (id_capteur, date_activation, id_instrument, num_colonne, nom_capteur) SELECT %s, to_date(%s, %s), (SELECT id_instrument FROM instrument_mesure WHERE lower(num_instrument) IS NOT DISTINCT FROM lower(%s)), %s, %s
                WHERE %s IS NOT NULL
                AND (SELECT id_instrument FROM instrument_mesure WHERE lower(num_instrument) IS NOT DISTINCT FROM lower(%s)) IS NOT NULL
                AND NOT EXISTS (SELECT 1 FROM capteur c WHERE c.id_capteur = %s
                );
                """, (id_capt_gen, date_act, format_date(row[1]), row[0], row[3], row[4], id_capt_gen, row[0], id_capt_gen))
                #print("insertion d'un capteur réussie")

        #insère les remplacements des instruments/capteurs
        for index, row in dfInstr[onglets_Instr[2]].iterrows():
            row = row.tolist()
            row = [None if pd.isna(x) else x for x in row]
            if row[0] != None and row[1] != None and row[4] != None:
                date_rempl = row[2].strftime("%Y-%m-%d") if hasattr(row[2], "strftime") else row[2]

                if row[4].lower() == "i":
                    #cur.execute("INSERT INTO remplacement_instrument (id_instrument, id_nouvel_instrument, date_remplacement, raison_remplacement) SELECT (SELECT id_instrument FROM instrument_mesure WHERE lower(num_instrument) IS NOT DISTINCT FROM lower(%s)), (SELECT id_instrument FROM instrument_mesure WHERE lower(num_instrument) IS NOT DISTINCT FROM lower(%s)), to_date(%s, %s), %s ON CONFLICT (id_instrument, id_nouvel_instrument) DO NOTHING;", (row[0], row[1], date_rempl, format_date(row[2]), row[3]))
                    cur.execute("""
                    INSERT INTO remplacement_instrument (id_instrument, id_nouvel_instrument, date_remplacement, raison_remplacement)
                    SELECT (SELECT id_instrument FROM instrument_mesure WHERE lower(num_instrument) IS NOT DISTINCT FROM lower(%s)), (SELECT id_instrument FROM instrument_mesure WHERE lower(num_instrument) IS NOT DISTINCT FROM lower(%s)), to_date(%s, %s), %s
                    WHERE (SELECT id_instrument FROM instrument_mesure WHERE lower(num_instrument) IS NOT DISTINCT FROM lower(%s)) IS NOT NULL
                    AND (SELECT id_instrument FROM instrument_mesure WHERE lower(num_instrument) IS NOT DISTINCT FROM lower(%s)) IS NOT NULL
                    AND NOT EXISTS (SELECT 1 FROM remplacement_instrument r WHERE r.id_instrument = (SELECT id_instrument FROM instrument_mesure WHERE lower(num_instrument) IS NOT DISTINCT FROM lower(%s)) AND r.id_nouvel_instrument = (SELECT id_instrument FROM instrument_mesure WHERE lower(num_instrument) IS NOT DISTINCT FROM lower(%s))
                    );
                    """, (row[0], row[1], date_rempl, format_date(row[2]), row[3], row[0], row[1], row[0], row[1]))
                    #print("insertion de remplacement instrument réussie")
                elif row[4].lower() == "c":
                    #cur.execute("INSERT INTO remplacement_capteur (id_capteur, id_nouveau_capteur, date_remplacement, raison_remplacement) SELECT (SELECT id_capteur_generique FROM capteur_generique WHERE lower(description) IS NOT DISTINCT FROM lower(%s)), (SELECT id_capteur_generique FROM capteur_generique WHERE lower(description) IS NOT DISTINCT FROM lower(%s)), to_date(%s, %s), %s ON CONFLICT (id_capteur, id_nouveau_capteur) DO NOTHING;", (row[0], row[1], date_rempl, format_date(row[2]), row[3]))
                    cur.execute("""
                    INSERT INTO remplacement_capteur (id_capteur, id_nouveau_capteur, date_remplacement, raison_remplacement)
                    SELECT (SELECT id_capteur FROM capteur WHERE lower(nom_capteur) = lower(%s)), (SELECT id_capteur FROM capteur WHERE lower(nom_capteur) = lower(%s)), to_date(%s, %s), %s
                    WHERE (SELECT id_capteur FROM capteur WHERE lower(nom_capteur) = lower(%s)) IS NOT NULL
                    AND (SELECT id_capteur FROM capteur WHERE lower(nom_capteur) = lower(%s)) IS NOT NULL
                    AND NOT EXISTS (SELECT 1 FROM remplacement_capteur rc WHERE rc.id_capteur = (SELECT id_capteur FROM capteur WHERE lower(nom_capteur) = lower(%s)) AND rc.id_nouveau_capteur = (SELECT id_capteur FROM capteur WHERE lower(nom_capteur) = lower(%s))
                    );
                    """, (row[0], row[1], date_rempl, format_date(row[2]), row[3], row[0], row[1], row[0], row[1]))
                    #print("insertion de remplacement capteur réussie")

        #insère les coefficients correcteurs des capteurs
        for index, row in dfInstr[onglets_Instr[3]].iterrows():
            row = row.tolist()
            row = [None if pd.isna(x) else x for x in row]
            if row[0] != None and row[1] != None and row[2] != None :
                date_cal = row[1].strftime("%Y-%m-%d") if hasattr(row[1], "strftime") else row[1]
                #cur.execute("INSERT INTO coefficient_correcteur (valeur, date_calibration, id_capteur) SELECT %s, to_date(%s, %s), (SELECT id_capteur_generique FROM capteur_generique WHERE lower(description) IS NOT DISTINCT FROM lower(%s)) ON CONFLICT (date_calibration, id_capteur) DO NOTHING;", (row[0], date_cal, format_date(row[1]), row[2]))
                cur.execute("""
                INSERT INTO coefficient_correcteur (valeur, date_calibration, id_capteur) SELECT %s, to_date(%s, %s), (SELECT id_capteur FROM capteur WHERE lower(nom_capteur) = lower(%s))
                WHERE (SELECT id_capteur FROM capteur WHERE lower(nom_capteur) = lower(%s)) IS NOT NULL
                AND NOT EXISTS (SELECT 1 FROM coefficient_correcteur cc WHERE cc.date_calibration = to_date(%s, %s) AND cc.id_capteur = (SELECT id_capteur FROM capteur WHERE lower(nom_capteur) = lower(%s))
                );
                """, (row[0], date_cal, format_date(row[1]), row[2], row[2], date_cal, format_date(row[1]), row[2]))
                #print("insertion de coefficient capteur réussie")

        #insère les maintenances capteur
        for index, row in dfInstr[onglets_Instr[4]].iterrows():
            row = row.tolist()
            row = [None if pd.isna(x) else x for x in row]
            if row[0] != None and row[3] != None :
                date_deb = row[0].strftime("%Y-%m-%d") if hasattr(row[0], "strftime") else row[0]
                date_fin = row[1].strftime("%Y-%m-%d") if hasattr(row[1], "strftime") else row[1]
                #le WHERE NOT EXISTS permet de vérifier avant d'insérer que le ligne n'existe pas déjà, qu'il ne va pas y avoir de doublon. C'est l'équivalent au ON CONFLICT ... DO NOTHING sauf que lui peut s'appliquer sans qu'il y ait une contraine UNIQUE
                cur.execute("""INSERT INTO maintenance_capteur (date_debut, date_fin, description, id_capteur) SELECT to_date(%s, %s), to_date(%s, %s), %s, (SELECT id_capteur FROM capteur WHERE lower(nom_capteur) = lower(%s))
                WHERE (SELECT id_capteur FROM capteur WHERE lower(nom_capteur) = lower(%s)) IS NOT NULL
                AND NOT EXISTS (SELECT 1 FROM maintenance_capteur WHERE date_debut = to_date(%s, %s) AND date_fin = to_date(%s, %s) AND description IS NOT DISTINCT FROM %s AND id_capteur = (SELECT id_capteur FROM capteur WHERE lower(nom_capteur) = lower(%s)))
                ;""", (date_deb, format_date(row[0]), date_fin, format_date(row[1]), row[2], row[3], row[3], date_deb, format_date(row[0]), date_fin, format_date(row[1]), row[2], row[3]))
                #print("insertion de maintenance capteur réussie")

    if ficPers != None :
        #insère les référents instrument et les collecteurs
        for index, row in dfPers[onglets_Pers[1]].iterrows():
            row = row.tolist()
            row = [None if pd.isna(x) else x for x in row]
            if row[0] != None and row[1] != None and row[2] != None:

                if row[2].lower() == "r" :
                    #cur.execute("INSERT INTO referent_instrument (id_referent) SELECT id_personne FROM personne WHERE lower(adresse_mail) IS NOT DISTINCT FROM lower(%s) ON CONFLICT (id_referent) DO NOTHING;", (row[0],))
                    cur.execute("""
                    INSERT INTO referent_instrument (id_referent) SELECT id_personne FROM personne WHERE lower(adresse_mail) IS NOT DISTINCT FROM lower(%s) 
                    AND (SELECT id_personne FROM personne WHERE lower(adresse_mail) IS NOT DISTINCT FROM lower(%s)) IS NOT NULL
                    AND NOT EXISTS (SELECT 1 FROM referent_instrument r WHERE r.id_referent = (SELECT id_personne FROM personne WHERE lower(adresse_mail) IS NOT DISTINCT FROM lower(%s))
                    );

                    """, (row[0], row[0], row[0]))
                    #print("insertion de référent instrument réussie")

                    date_deb = row[3].strftime("%Y-%m-%d") if hasattr(row[3], "strftime") else row[3]
                    date_fin = row[4].strftime("%Y-%m-%d") if hasattr(row[4], "strftime") else row[4]
                    
                    if row[3] != None :

                        #cur.execute("INSERT INTO est_referent_de (id_referent, id_instrument, date_debut, date_fin) SELECT (SELECT id_personne FROM personne WHERE lower(adresse_mail) IS NOT DISTINCT FROM lower(%s)), (SELECT id_instrument FROM instrument_mesure WHERE lower(num_instrument) IS NOT DISTINCT FROM lower(%s)), to_date(%s, %s), to_date(%s, %s) ON CONFLICT (id_referent, id_instrument, date_debut) DO NOTHING;", (row[0], row[1], date_deb, format_date(row[3]), date_fin, format_date(row[4])))
                        cur.execute("""
                        INSERT INTO est_referent_de (id_referent, id_instrument, date_debut, date_fin)
                        SELECT (SELECT id_personne FROM personne WHERE lower(adresse_mail) IS NOT DISTINCT FROM lower(%s)), (SELECT id_instrument FROM instrument_mesure WHERE lower(num_instrument) IS NOT DISTINCT FROM lower(%s)), to_date(%s, %s), to_date(%s, %s)
                        WHERE (SELECT id_personne FROM personne WHERE lower(adresse_mail) IS NOT DISTINCT FROM lower(%s)) IS NOT NULL AND (SELECT id_instrument FROM instrument_mesure WHERE lower(num_instrument) IS NOT DISTINCT FROM lower(%s)) IS NOT NULL
                        AND NOT EXISTS (SELECT 1 FROM est_referent_de er WHERE er.id_referent = (SELECT id_personne FROM personne WHERE lower(adresse_mail) IS NOT DISTINCT FROM lower(%s))
                        AND er.id_instrument = (SELECT id_instrument FROM instrument_mesure WHERE lower(num_instrument) IS NOT DISTINCT FROM lower(%s))
                        AND er.date_debut = to_date(%s, %s)
                        );
                        """, (row[0], row[1], date_deb, format_date(row[3]), date_fin, format_date(row[4]), row[0], row[1], row[0], row[1], date_deb, format_date(row[3])))
                        #print("insertion de est_referent_de réussie")

                elif row[2].lower() == "c" :
                    #cur.execute("INSERT INTO collecteur (id_collecteur) SELECT id_personne FROM personne WHERE lower(adresse_mail) IS NOT DISTINCT FROM lower(%s) ON CONFLICT (id_collecteur) DO NOTHING;", (row[0],))
                    cur.execute("""
                    INSERT INTO collecteur (id_collecteur) SELECT id_personne FROM personne WHERE lower(adresse_mail) IS NOT DISTINCT FROM lower(%s) 
                    AND (SELECT id_personne FROM personne WHERE lower(adresse_mail) IS NOT DISTINCT FROM lower(%s)) IS NOT NULL
                    AND NOT EXISTS (SELECT 1 FROM collecteur c WHERE c.id_collecteur = (SELECT id_personne FROM personne WHERE lower(adresse_mail) IS NOT DISTINCT FROM lower(%s))
                    );
                    """, (row[0], row[0], row[0]))
                    #print("insertion de collecteur réussie")

                    #cur.execute("INSERT INTO collecte_instrument (id_collecteur, id_instrument) SELECT (SELECT id_personne FROM personne WHERE lower(adresse_mail) IS NOT DISTINCT FROM lower(%s)), (SELECT id_instrument FROM instrument_mesure WHERE lower(num_instrument) IS NOT DISTINCT FROM lower(%s)) ON CONFLICT (id_collecteur, id_instrument) DO NOTHING;", (row[0], row[1]))
                    cur.execute("""
                    INSERT INTO collecte_instrument (id_collecteur, id_instrument) SELECT
                    (SELECT id_personne FROM personne WHERE lower(adresse_mail) IS NOT DISTINCT FROM lower(%s)), (SELECT id_instrument FROM instrument_mesure WHERE lower(num_instrument) IS NOT DISTINCT FROM lower(%s))
                    WHERE (SELECT id_personne FROM personne WHERE lower(adresse_mail) IS NOT DISTINCT FROM lower(%s)) IS NOT NULL AND (SELECT id_instrument FROM instrument_mesure WHERE lower(num_instrument) IS NOT DISTINCT FROM lower(%s)) IS NOT NULL
                    AND NOT EXISTS (SELECT 1 FROM collecte_instrument ci WHERE ci.id_collecteur = (SELECT id_personne FROM personne WHERE lower(adresse_mail) IS NOT DISTINCT FROM lower(%s))
                    AND ci.id_instrument = (SELECT id_instrument FROM instrument_mesure WHERE lower(num_instrument) IS NOT DISTINCT FROM lower(%s))
                    );
                    """, (row[0], row[1], row[0], row[1], row[0], row[1]))
                    #print("insertion de collecte_instrument réussie")

        #insère les récolteurs
        for index, row in dfPers[onglets_Pers[2]].iterrows():
            row = row.tolist()
            row = [None if pd.isna(x) else x for x in row]
            if row[0] != None :
                #Comme pour les capteurs, il faut aussi d'abord créer un capteur générique avant d'insérer un récolteur
                #cur.execute("INSERT INTO capteur_generique (description) VALUES (%s) ON CONFLICT (description) DO NOTHING;", (row[1],))
                
                cur.execute("""
                INSERT INTO capteur_generique (description) SELECT %s 
                WHERE (SELECT id_personne FROM personne WHERE lower(adresse_mail) = lower(%s)) IS NOT NULL
                AND NOT EXISTS (SELECT id_capteur_generique FROM recolteur r JOIN Personne p ON r.id_recolteur = p.id_personne WHERE lower(adresse_mail) = lower(%s)) RETURNING id_capteur_generique;
                """, (row[1], row[0], row[0]))



                #cur.execute("""
                #SELECT id_capteur_generique FROM capteur_generique WHERE id_capteur_generique = (SELECT id_capteur_generique FROM recolteur r JOIN Personne p ON r.id_recolteur = p.id_personne WHERE lower(adresse_mail) = lower(%s))
                #""", (row[0],))

                result = cur.fetchone()
                id_capt_gen = result[0] if result else None
                #print("insertion d'un capteur générique réussie")

                #cur.execute("INSERT INTO recolteur (id_recolteur, id_capteur_generique) SELECT (SELECT id_personne FROM personne WHERE lower(adresse_mail) IS NOT DISTINCT FROM lower(%s)), (SELECT id_capteur_generique FROM capteur_generique WHERE lower(description) IS NOT DISTINCT FROM lower(%s)) ON CONFLICT (id_recolteur, id_capteur_generique) DO NOTHING;", (row[0], row[1]))
                cur.execute("""
                INSERT INTO recolteur (id_recolteur, id_capteur_generique) SELECT (SELECT id_personne FROM personne WHERE lower(adresse_mail) IS NOT DISTINCT FROM lower(%s)), %s
                WHERE (SELECT id_personne FROM personne WHERE lower(adresse_mail) IS NOT DISTINCT FROM lower(%s)) IS NOT NULL
                AND %s IS NOT NULL
                AND NOT EXISTS (SELECT 1 FROM recolteur r WHERE r.id_recolteur = (SELECT id_personne FROM personne WHERE lower(adresse_mail) IS NOT DISTINCT FROM lower(%s))
                AND r.id_capteur_generique = %s
                );
                """, (row[0], id_capt_gen, row[0], id_capt_gen, row[0], id_capt_gen))
                #print("insertion de récolteur réussie")

        #insère les groupes
        for index, row in dfPers[onglets_Pers[3]].iterrows():
            row = row.tolist()
            row = [None if pd.isna(x) else x for x in row]
            if row[0] != None and row[1] != None :
                cur.execute("INSERT INTO groupe (nom_groupe) SELECT %s WHERE NOT EXISTS (SELECT 1 FROM groupe WHERE lower(nom_groupe) IS NOT DISTINCT FROM lower(%s));", (row[0], row[0]))

                #insère les membres du groupe
                cur.execute("""INSERT INTO membre_groupe (id_groupe, id_personne) SELECT (SELECT id_groupe FROM groupe WHERE lower(nom_groupe) = lower(%s)), (SELECT id_personne FROM personne WHERE lower(adresse_mail) = lower(%s)) 
                WHERE (SELECT id_personne FROM personne WHERE lower(adresse_mail) = lower(%s)) IS NOT NULL
                AND NOT EXISTS (SELECT 1 FROM membre_groupe WHERE id_groupe = (SELECT id_groupe FROM groupe WHERE lower(nom_groupe) = lower(%s)) AND id_personne = (SELECT id_personne FROM personne WHERE lower(adresse_mail) = lower(%s)));""", (row[0], row[1], row[1], row[0], row[1]))

    if ficInstr != None :
        #insère localisation
        for index, row in dfInstr[onglets_Instr[5]].iterrows():
            row = row.tolist()
            row = [None if pd.isna(x) else x for x in row]
            if row[0] != None and row[1] != None and row[4] != None and row[5] != None :

                cur.execute("INSERT INTO milieu_specifique (categorie, description_milieu) SELECT %s, %s WHERE NOT EXISTS (SELECT 1 FROM milieu_specifique WHERE lower(categorie) = lower(%s) AND lower(description_milieu) = lower(%s));", (row[9], row[10], row[9], row[10]))
                #print("insertion de milieu spécifique réussie")

                cur.execute("""INSERT INTO localisation (altitude, longitude, latitude, pente, hauteur, orientation, id_milieu) SELECT %s, %s, %s, %s, %s, %s, (SELECT id_milieu FROM milieu_specifique WHERE lower(description_milieu) IS NOT DISTINCT FROM lower(%s) AND lower(categorie) IS NOT DISTINCT FROM lower(%s) LIMIT 1)
                WHERE 
                NOT EXISTS (SELECT 1 FROM localisation WHERE altitude IS NOT DISTINCT FROM %s AND longitude IS NOT DISTINCT FROM %s AND latitude IS NOT DISTINCT FROM %s AND pente IS NOT DISTINCT FROM %s AND hauteur IS NOT DISTINCT FROM %s AND orientation IS NOT DISTINCT FROM %s
                AND id_milieu = (SELECT id_milieu FROM milieu_specifique WHERE lower(description_milieu) IS NOT DISTINCT FROM lower(%s) AND lower(categorie) IS NOT DISTINCT FROM lower(%s) LIMIT 1))
                ;""", (row[3], row[4], row[5], row[6], row[7], row[8], row[10], row[9], row[3], row[4], row[5], row[6], row[7], row[8], row[10], row[9]))
                #print("insertion de localisation réussie")

                #on récupère tous les capteurs qui sont liés à l'instrument de mesure cité dans la ligne
                #print(row[0])
                cur.execute("SELECT id_capteur FROM capteur JOIN instrument_mesure im ON im.id_instrument = capteur.id_instrument WHERE lower(im.num_instrument) IS NOT DISTINCT FROM lower(%s);", (row[0],))
                capteurs = cur.fetchall()
                #print(capteurs)
                #pour chaque capteur associé à un instrument, on associe la bonne localisation. (dans notre .xlsx, la localisation est associée à un instrument et pas un capteur alors que dans notre modèle EA c'est l'inverse) 
                for c in capteurs: #normalement pas de problème avec la violation de contrainte not null car si l'instrument est pas dans la base, le fetchall renverra une liste vide
                    date_deb = row[1].strftime("%Y-%m-%d") if hasattr(row[1], "strftime") else row[1]
                    date_fin = row[2].strftime("%Y-%m-%d") if hasattr(row[2], "strftime") else row[2]
                    #cur.execute("INSERT INTO capteur_localise (id_capteur_gen, id_loc, date_debut, date_fin) SELECT %s, (SELECT id_localisation FROM localisation WHERE longitude IS NOT DISTINCT FROM %s AND latitude IS NOT DISTINCT FROM %s AND pente IS NOT DISTINCT FROM %s AND orientation IS NOT DISTINCT FROM %s AND altitude IS NOT DISTINCT FROM %s AND hauteur IS NOT DISTINCT FROM %s LIMIT 1), to_date(%s, %s), to_date(%s, %s) ON CONFLICT (id_capteur_gen, id_loc, date_debut) DO NOTHING;", (c[0], row[4], row[5], row[6], row[8], row[3], row[7], date_deb, format_date(row[1]), date_fin, format_date(row[2])))
                    cur.execute("""
                    INSERT INTO capteur_localise (id_capteur_gen, id_loc, date_debut, date_fin) SELECT %s,
                    (SELECT id_localisation FROM localisation WHERE longitude IS NOT DISTINCT FROM %s AND latitude IS NOT DISTINCT FROM %s AND pente IS NOT DISTINCT FROM %s AND orientation IS NOT DISTINCT FROM %s AND altitude IS NOT DISTINCT FROM %s AND hauteur IS NOT DISTINCT FROM %s LIMIT 1), to_date(%s, %s), to_date(%s, %s)
                    WHERE NOT EXISTS (SELECT 1 FROM capteur_localise cl WHERE cl.id_capteur_gen = %s AND cl.id_loc = (SELECT id_localisation FROM localisation WHERE longitude IS NOT DISTINCT FROM %s AND latitude IS NOT DISTINCT FROM %s AND pente IS NOT DISTINCT FROM %s AND orientation IS NOT DISTINCT FROM %s AND altitude IS NOT DISTINCT FROM %s AND hauteur IS NOT DISTINCT FROM %s LIMIT 1)
                    AND cl.date_debut = to_date(%s, %s)
                    );
                    """, (c[0], row[4], row[5], row[6], row[8], row[3], row[7], date_deb, format_date(row[1]), date_fin, format_date(row[2]), c[0], row[4], row[5], row[6], row[8], row[3], row[7], date_deb, format_date(row[1])))
                    #print("insertion de capteur localisé réussie")
    if ficProj != None :
        #insère les projets
        for index, row in dfProj[onglets_Proj[0]].iterrows():
            row = row.tolist()
            row = [None if pd.isna(x) else x for x in row]
            if row[0] != None and row[1] != None : 
                date_deb = row[2].strftime("%Y-%m-%d") if hasattr(row[2], "strftime") else row[2]
                date_fin = row[3].strftime("%Y-%m-%d") if hasattr(row[3], "strftime") else row[3]
                cur.execute("""INSERT INTO projet (nom_projet, id_responsable_projet, date_debut, date_fin) SELECT %s, (SELECT id_personne FROM personne WHERE lower(adresse_mail) = lower(%s)), to_date(%s, %s), to_date(%s, %s)
                WHERE (SELECT id_personne FROM personne WHERE lower(adresse_mail) = lower(%s)) IS NOT NULL
                AND NOT EXISTS (SELECT 1 FROM projet WHERE lower(nom_projet) = lower(%s))
                ;""", (row[0], row[1], date_deb, format_date(row[2]), date_fin, format_date(row[3]), row[1], row[0]))
                #print("insertion de projet réussie")

        #insère les association des récolteurs et des instruments associés à des projets
        #Double ou triple boucle for car il faut aller chercher les infos dans différents onglets voire différents fichiers
        for index, row in dfProj[onglets_Proj[1]].iterrows():
            row = row.tolist()
            row = [None if pd.isna(x) else x for x in row]
            if row[0] != None and row[1] != None and row[2] != None:

                if row[2].lower() == "i": #insertion des instruments en rapport avec le projet
                    cur.execute("""INSERT INTO instrument_projet (id_projet, id_instrument) SELECT (SELECT id_projet FROM projet WHERE lower(nom_projet) IS NOT DISTINCT FROM lower(%s) LIMIT 1), (SELECT id_instrument FROM instrument_mesure WHERE lower(num_instrument) IS NOT DISTINCT FROM lower(%s) LIMIT 1) 
                    WHERE (SELECT id_instrument FROM instrument_mesure WHERE lower(num_instrument) IS NOT DISTINCT FROM lower(%s) LIMIT 1) IS NOT NULL 
                    AND (SELECT id_projet FROM projet WHERE lower(nom_projet) IS NOT DISTINCT FROM lower(%s) LIMIT 1) IS NOT NULL
                    AND NOT EXISTS (SELECT 1 FROM instrument_projet WHERE id_projet = (SELECT id_projet FROM projet WHERE lower(nom_projet) IS NOT DISTINCT FROM lower(%s) LIMIT 1) AND id_instrument = (SELECT id_instrument FROM instrument_mesure WHERE lower(num_instrument) IS NOT DISTINCT FROM lower(%s) LIMIT 1))
                    ;""", (row[1], row[0], row[0], row[1], row[1], row[0]))

                elif row[2].lower() == "r" : #insertion des recolteurs en rapport avec le projet
                    cur.execute("""INSERT INTO membre_projet (id_projet, id_recolteur, id_capteur_generique) SELECT (SELECT id_projet FROM projet WHERE lower(nom_projet) IS NOT DISTINCT FROM lower(%s) LIMIT 1), (SELECT id_recolteur FROM recolteur JOIN personne ON id_personne = id_recolteur WHERE lower(adresse_mail) = lower(%s)), (SELECT id_capteur_generique FROM recolteur JOIN personne ON id_personne = id_recolteur WHERE lower(adresse_mail) = lower(%s))
                    WHERE (SELECT id_recolteur FROM recolteur JOIN personne ON id_personne = id_recolteur WHERE lower(adresse_mail) = lower(%s)) IS NOT NULL
                    AND (SELECT id_capteur_generique FROM recolteur JOIN personne ON id_personne = id_recolteur WHERE lower(adresse_mail) = lower(%s)) IS NOT NULL
                    AND (SELECT id_projet FROM projet WHERE lower(nom_projet) IS NOT DISTINCT FROM lower(%s) LIMIT 1) IS NOT NULL
                    AND NOT EXISTS (SELECT 1 FROM membre_projet WHERE id_projet = (SELECT id_projet FROM projet WHERE lower(nom_projet) IS NOT DISTINCT FROM lower(%s) LIMIT 1)
                    AND id_recolteur = (SELECT id_recolteur FROM recolteur JOIN personne ON id_personne = id_recolteur WHERE lower(adresse_mail) = lower(%s))
                    AND id_capteur_generique = (SELECT id_capteur_generique FROM recolteur JOIN personne ON id_personne = id_recolteur WHERE lower(adresse_mail) = lower(%s))
                    )
                    ;""", (row[1], row[0], row[0], row[0], row[0], row[1], row[1], row[0], row[0]))


    """
        for index1, row1 in dfProj[onglets_Proj[0]].iterrows():
            row1 = row1.tolist()
            row1 = [None if pd.isna(x) else x for x in row1]
            date_deb = row1[3].strftime("%Y-%m-%d") if hasattr(row1[3], "strftime") else row1[3]
            date_fin = row1[4].strftime("%Y-%m-%d") if hasattr(row1[4], "strftime") else row1[4]

            if row[2].lower() == "i" :
                if row1[0] == row[1]:
                    cur.execute("INSERT INTO instrument_projet (id_projet, id_instrument) SELECT (SELECT id_projet FROM projet WHERE lower(mail_responsable) IS NOT DISTINCT FROM lower(%s) AND date_debut IS NOT DISTINCT FROM to_date(%s, %s) AND date_fin IS NOT DISTINCT FROM to_date(%s, %s) AND lower(nom_responsable) IS NOT DISTINCT FROM lower(%s) LIMIT 1), (SELECT id_instrument FROM instrument_mesure WHERE lower(num_instrument) IS NOT DISTINCT FROM lower(%s)) ON CONFLICT (id_projet, id_instrument) DO NOTHING;", (row1[2], date_deb, format_date(row1[3]), date_fin, format_date(row1[4]), row1[1], row[0]))
                    #print("insertion (maudite) d'instrument_projet réussie")

            elif row[2].lower() == "r" :
                if row1[0] == row[1]:

                    for index2, row2 in dfPers[onglets_Pers[2]].iterrows():
                        row2 = row2.tolist()
                        row2 = [None if pd.isna(x) else x for x in row2]

                        if row2[0] == row[0]:
                            cur.execute("INSERT INTO membre_projet (id_projet, id_recolteur, id_capteur_generique) SELECT (SELECT id_projet FROM projet WHERE lower(mail_responsable) IS NOT DISTINCT FROM lower(%s) AND date_debut IS NOT DISTINCT FROM to_date(%s, %s) AND date_fin IS NOT DISTINCT FROM to_date(%s, %s) AND lower(nom_responsable) IS NOT DISTINCT FROM lower(%s) LIMIT 1), (SELECT id_personne FROM personne WHERE lower(adresse_mail) IS NOT DISTINCT FROM lower(%s)), (SELECT id_capteur_generique FROM capteur_generique WHERE lower(description) IS NOT DISTINCT FROM lower(%s)) ON CONFLICT(id_projet, id_recolteur, id_capteur_generique) DO NOTHING;", (row1[2], date_deb, format_date(row1[3]), date_fin, format_date(row1[4]), row1[1], row[0], row2[1]))
                            #print("insertion (maudite-bis) de membre projet")
    """
    cur.execute("SELECT id_responsable FROM responsable_fichier rf JOIN personne p ON rf.id_responsable = p.id_personne WHERE lower(p.adresse_mail) = lower(%s);", (data["mail_responsable"],))
    res = cur.fetchone()
    id_responsable_fic = res[0] if res else None

    if id_responsable_fic == None : 
        dico["commentaire"] = "Le responsable fichier sélectionné n'existe pas dans la base, impossible d'intégrer"
        print(json.dump(dico))
        cur.close()
        conn.close()
        exit(1)

    #insertion d'une source_données pour répertorier les informations sur les fichiers
    fics = [ficPers, ficInstr, ficProj]
    for i in range(len(fics)) :
        if fics[i] != None :
            ext = str(Path(fics[i]).suffix).split(".")[1]
            nom_fic = Path(fics[i]).stem
            chemin_fic = str(fics[i])
            if i == 0 :
                type_fic = "personne"
            elif i == 1 :
                type_fic = "instrument"
            else:
                type_fic = "projet"

            cur.execute("INSERT INTO source_donnees (extension, nom_source, chemin_source, date_import, commentaire, id_responsable, type_source) SELECT %s, %s, %s, to_timestamp(%s, %s), %s, %s, %s WHERE %s IS NOT NULL;", (ext, nom_fic, chemin_fic, data["date_import"], format_timestamp(data["date_import"]), data["commentaire"], id_responsable_fic, "fichier_métadonnées_"+type_fic, id_responsable_fic))

#if cur.rowcount == 0 : -> l'insertion ne s'est pas passée
    dico["commentaire"] = ""
    dico["reussite"] = True
    print(json.dumps(dico))

if __name__ == "__main__" :

    #arguments à donner si on veut lors de l'appel au programme en ligne de commande
    # exemple d'appel : python3 integration_metadonnees.py --ficPers Remplissage_des_tables_des_personnes.xlsx --ficInstr Remplissage_des_tables_liees_aux_capteurs.xlsx
    parser = argparse.ArgumentParser()
    parser.add_argument("--ficPers", default=None)
    parser.add_argument("--ficInstr", default=None)
    parser.add_argument("--ficProj", default=None)
    parser.add_argument("--ficJSON")
    args = parser.parse_args()

load_dotenv()

conn = psycopg2.connect(
    host=os.getenv("DB_HOST"),
    database=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    port=os.getenv("DB_PORT")
)

 #Création du curseur qui nous permettra de faire les requêtes
cur = conn.cursor()

#Appel à la fonction qui va ajouter les données stockées dans les fichiers de métadonnées en .xlsx
integration_fichier_metadonnees(args.ficPers, args.ficInstr, args.ficProj, args.ficJSON)
"""
python3 integration_metadonnees.py --ficPers Metadonnees_personnes.xlsx --ficInstr Metadonnees_instruments_capteurs.xlsx --ficLoc Metadonnees_localisations.xlsx --ficProj Metadonnees_projets.xlsx
"""

#Pour faire passer les modifications à la base de données
conn.commit()

#Fermeture du curseur et de la connexion
cur.close()
conn.close()