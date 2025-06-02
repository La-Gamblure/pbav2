# pba_excel_processor.js — Explication étape par étape

Ce fichier gère la transformation et la conversion des fichiers Excel de marque PBA en JSON exploitable par l’application.

## 1. Chargement du fichier Excel
- **Fonction : `loadWorkbook(input)`**
  - Prend en entrée un fichier Excel (File, Blob ou Workbook ExcelJS).
  - Utilise la librairie ExcelJS (doit être chargée dans la page) pour lire le fichier.
  - Retourne un objet Workbook ExcelJS prêt à être manipulé.

## 2. Transformation du fichier Excel
- **Fonction : `transformExcel(input, options)`**
  - Charge le fichier via `loadWorkbook`.
  - Sélectionne la feuille à traiter (par défaut la première).
  - Nettoie et prépare la feuille :
    - Vide les cellules A1 et B1 (pour éviter des artefacts d’export).
    - Déplace les en-têtes de A2:G2 vers A1:G1 (pour que la première ligne soit toujours les en-têtes attendus).
    - Insère une ligne de début de match standardisée à la ligne 2.
    - Remplace toutes les occurrences de "{rien}" par des chaînes vides.
    - Gère certains cas particuliers (ex : cellule DF2 mise à vide si elle vaut 0).
  - Reconstruit la ligne d’en-têtes complète attendue par l’application :
    - Ajoute d’abord les colonnes de scoreboard et commentaires.
    - Génère dynamiquement les colonnes pour chaque joueur (A1 à B5) et chaque statistique (Points, 3-Points, etc.).
    - Force la feuille à n’avoir que ces colonnes, pour éviter tout décalage.
    - Écrase la première ligne avec ces nouveaux en-têtes.
  - Retourne le Workbook transformé.

## 3. Conversion en JSON
- **Fonction : `workbookToJson(workbook)`**
  - Récupère la feuille à traiter.
  - Récupère la première ligne comme en-têtes (sans les normaliser, pour garder la compatibilité avec le reste de l’app).
  - Parcourt chaque ligne suivante :
    - Construit un objet clé/valeur pour chaque ligne (clé = nom de colonne).
    - Ignore les lignes vides.
  - Retourne un tableau d’objets (une entrée par ligne d’action de match).

## 4. Traitement complet en une étape
- **Fonction : `processExcel(input, options)`**
  - Enchaîne les deux étapes précédentes :
    1. Transforme le fichier Excel.
    2. Convertit le résultat en JSON.
  - Ajoute automatiquement une dernière étape (701) à la fin du match pour signaler la fin.
  - Retourne un objet `{ workbook, jsonData }`.

## 5. Sauvegarde des résultats
- **Fonctions : `saveWorkbook(workbook)` et `saveJson(jsonData)`**
  - Permettent de sauvegarder côté navigateur :
    - Le fichier Excel transformé (au format .xlsx)
    - Le fichier JSON généré (au format .json)

## 6. Exposition globale
- À la fin du fichier, les fonctions principales sont exposées dans `window.PBAExcelProcessor` pour être appelées depuis d’autres scripts ou l’interface HTML.

---

## **Résumé du flux complet**
1. **Upload** d’un fichier Excel →
2. **Transformation** du format brut en format standardisé →
3. **Conversion** en JSON →
4. **Utilisation** du JSON dans le lecteur PBA (affichage, stats, etc.)
5. **Possibilité de sauvegarder** le résultat (Excel ou JSON)

---

**Ce fichier est donc la passerelle centrale pour importer, nettoyer et normaliser les données de match issues d’Excel avant toute exploitation dans l’application.**
