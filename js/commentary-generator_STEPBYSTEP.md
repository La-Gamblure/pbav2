# commentary-generator.js — Explication détaillée et étapes de fonctionnement

Ce fichier génère dynamiquement les commentaires textuels affichés lors de la lecture d’un match dans le Lecteur PBA. Il s’appuie sur les événements du match (JSON) pour produire des phrases riches, stylisées et adaptées au contexte.

## 1. Fonctions utilitaires principales

- **wrapPlayer(name, teamCode)**
  - Encapsule un nom de joueur dans une balise `<span>` avec une classe CSS correspondant à l’équipe.
  - Permet de styliser les noms dans les commentaires.

- **wrapNamesOnce(html, names)**
  - Remplace tous les noms de joueurs par leur version stylisée dans un bloc HTML, sans double-encapsulation.
  - Utilisé pour éviter les conflits lors de l’injection de plusieurs noms dans le même commentaire.

## 2. Génération des commentaires

- **generateComments(evt, playerList)**
  - Prend un événement de match (ligne JSON) et la liste des joueurs.
  - Analyse le type d’action (tir, passe, interception, etc.) grâce à des motifs ou des champs spécifiques.
  - Sélectionne un template de phrase adapté à l’action et remplit dynamiquement les variables (joueur, équipe, score, etc.).
  - Appelle `wrapPlayer` pour styliser les noms.
  - Retourne un tableau de commentaires (un ou plusieurs par action).

- **buildComment(evt, playerList)**
  - Fonction centrale appelée pour chaque événement lors du rendu.
  - Utilise `generateComments` pour obtenir le ou les commentaires à afficher.
  - Peut enrichir le commentaire avec des informations de contexte (score, période, etc.).

## 3. Détection du type d’action/tir

- **detectShotType(evt)**
  - Détermine si un tir est à 2 ou 3 points.
  - Depuis la mise à jour, utilise d’abord la colonne "Test 2-3 PT" si elle existe (valeur 2 ou 3).
  - Sinon, se base sur la différence de score ou l’évolution des statistiques de tirs à 3/2 points.

## 4. Rendu dans le DOM

- **renderComments(comments, container)**
  - Affiche les commentaires générés dans un conteneur HTML (ex : une zone de texte ou un panneau latéral).
  - Applique les styles et animations nécessaires.

## 5. Exposition globale

- Les fonctions principales sont exposées dans `window.CommentaryGenerator` pour être utilisées ailleurs dans l’application.

---

## **Résumé du flux**
1. Un événement de match est lu depuis le JSON.
2. `buildComment` appelle `generateComments` pour produire le texte.
3. Les noms de joueurs sont stylisés avec `wrapPlayer`.
4. `detectShotType` précise le type de tir (2 ou 3 pts).
5. Le commentaire est injecté dans le DOM via `renderComments`.

---

**Ce module centralise toute la logique de génération de texte dynamique et d’habillage des commentaires pour une expérience utilisateur riche et personnalisée.**
