# Documentation des fichiers JavaScript du Lecteur PBA

## 1. `main.js`
- **Gestion des équipes et joueurs** :
  - Charge les données des équipes depuis `teams.json`.
  - Initialise les variables globales pour les noms, logos, et joueurs des équipes.
  - Applique dynamiquement les couleurs d'équipe à l'interface.
  - Gère les changements de sélection d'équipe (A/B) et la réinitialisation de l'affichage.
  - Fournit une fonction de secours en cas d'erreur de chargement (`useFallbackTeamData`).

## 2. `json-processor.js`
- **Traitement et lecture du match** :
  - Gère le chargement, le parsing et l'affichage des données JSON d'un match.
  - Contrôle la lecture automatique/pause/reset de la timeline du match (playback).
  - Met à jour le scoreboard, les statistiques, la possession, les commentaires et l'affichage MVP.
  - Gère l'upload de fichiers JSON et la synchronisation avec l'interface.

## 3. `commentary-generator.js`
- **Génération de commentaires dynamiques** :
  - Génère des commentaires textuels pour chaque événement du match (shoot, passe, etc.)
  - Utilise des templates pour produire des phrases variées et naturelles.
  - Gère l'encapsulation des noms de joueurs avec styles CSS selon l'équipe.
  - Fournit des fonctions utilitaires pour détecter le type de tir, obtenir le nom d'équipe, etc.
  - Expose en global les fonctions principales : `wrapPlayer`, `generateComments`, `renderComments`.

## 4. `animations.js`
- **Animations et effets visuels** :
  - Gère les surbrillances et animations lors de changements de statistiques.
  - Met en évidence les cellules modifiées et affiche des effets visuels (+1, +2, etc.).
  - Met à jour l'indicateur de possession et applique les effets à chaque étape.
  - Exporte les fonctions principales sous `window.Animations`.

## 5. `utils/wrap-utils.js`
- **Utilitaires pour l'encapsulation HTML des joueurs** :
  - Fournit la fonction `wrapPlayer` pour encapsuler un nom de joueur dans un `<span>` stylé.
  - Fournit la fonction `wrapNamesOnce` pour encapsuler tous les noms d'une liste dans un HTML sans double-encapsulation.
  - Utilitaire pour échapper les caractères spéciaux dans les regex (`escapeRegExp`).
  - Exporte les fonctions pour usage global.

---

**Remarque :**
- Les fichiers sont pensés pour fonctionner ensemble dans l'interface du Lecteur PBA.
- Les fonctions exposées en global (via `window.`) permettent l'interopérabilité entre modules et scripts HTML.
