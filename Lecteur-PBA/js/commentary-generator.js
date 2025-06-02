/* commentary-generator.js
 * Générateur de commentaires aléatoires pour match de basket
 * 
 * Fonctions globales :
 *   - wrapPlayer(name, teamCode) → string HTML
 *   - generateComments(timeline) → Array<{...evt, generatedComment}>
 *   - renderComments(timeline, containerSelector) → injecte dans le DOM + console.log
 */

// Utiliser les données d'équipe déjà chargées dans main.js
// Cette fonction sera utilisée pour récupérer les données d'équipe
function getGlobalTeamsData() {
  return window.teamsData || { teams: [] };
}
/**
 * Vérifie si une valeur est considérée comme vide (null, undefined ou chaîne vide)
 * @param {*} value - Valeur à vérifier
 * @returns {boolean}
 */
function isEmptyValue(value) {
  return value === null || value === undefined || value === "";
}
/**
 * Obtient les informations de couleur pour une équipe donnée
 * @param {string} teamCode - 'A' ou 'B'
 * @returns {Object} Objet contenant primaryColor et secondaryColor
 */
function getTeamColors(teamCode) {
  // Récupérer les données d'équipe depuis la variable globale
  const teamsData = getGlobalTeamsData();
  
  // Si les données d'équipe ne sont pas chargées, utiliser des couleurs par défaut
  if (!teamsData.teams || !window.jsonData) {
    return {
      primaryColor: teamCode === 'A' ? '#706FD6' : '#D65F5F',
      secondaryColor: '#FFFFFF'
    };
  }

  // Récupérer l'index de l'équipe à partir des données du match
  let teamIndex = -1;
  try {
    if (teamCode === 'A' && typeof window.jsonData[0]['TeamA'] !== 'undefined') {
      teamIndex = parseInt(window.jsonData[0]['TeamA']);
    } else if (teamCode === 'B' && typeof window.jsonData[0]['TeamB'] !== 'undefined') {
      teamIndex = parseInt(window.jsonData[0]['TeamB']);
    }
  } catch (e) {
    console.warn('Impossible de déterminer l\'index d\'équipe:', e);
  }

  // Si on a trouvé l'index, récupérer les couleurs correspondantes
  if (teamIndex >= 0 && teamIndex < teamsData.teams.length) {
    return {
      primaryColor: teamsData.teams[teamIndex].primaryColor,
      secondaryColor: teamsData.teams[teamIndex].secondaryColor
    };
  }

  // Couleurs par défaut si l'équipe n'est pas trouvée
  return {
    primaryColor: teamCode === 'A' ? '#706FD6' : '#D65F5F',
    secondaryColor: '#FFFFFF'
  };
}

/**
 * Enrobe le nom du joueur dans un <span> avec style selon l'équipe
 * @param {string} name
 * @param {string} teamCode 'A' ou 'B'
 * @returns {string}
 */
function wrapPlayer(name, teamCode) {
  if (!name) return '';
  
  // Utilisation des classes CSS avec variables CSS au lieu des styles inline
  return `<span class="comment-player team-${teamCode}">${name}</span>`;
}

/**
 * Pour chaque événement de timeline, génère un commentaire
 * et l'ajoute dans la propriété `generatedComment`.
 * @param {Array<Object>} timeline
 * @returns {Array<Object>}
 */
function generateComments(timeline) {
  return timeline.map((evt, idx) => {
    const nextEvt = timeline[idx + 1] || {};
    const text = buildComment(evt, nextEvt);
    return { ...evt, generatedComment: text };
  });
}

/**
 * Injecte en console et dans le DOM sous forme de <p> les commentaires générés
 * @param {Array<Object>} timeline
 * @param {string} containerSelector
 */
function renderComments(timeline, containerSelector = '#comments') {
  const plays = generateComments(timeline);
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.warn(`Container "${containerSelector}" introuvable.`);
    return;
  }
  container.innerHTML = '';

  plays.forEach((evt, idx) => {
    const text = evt.generatedComment;
    if (!text) return;
    console.log(text);
    const p = document.createElement('p');
    p.className = 'generated-comment';

    // Les noms des joueurs sont déjà encapsulés dans buildComment
    p.innerHTML = text;

    // Appliquer style succès/échec uniquement sur Shoot
    if (evt['commentaire-Situation'] === 'Shoot') {
      const res = evt['commentaire-Succes'];
      if (res === 'Succès') p.classList.add('shoot-success');
      else if (res === 'Echec' || res === 'Blocked') p.classList.add('shoot-failure');
    }

    container.appendChild(p);
  });
}

// =============================
// Templates et utilitaires
// =============================
const COMMENT_TEMPLATES = {
  Possession: {
    'Succès': [
      '{player} fait la passe à {nextPlayer}',
      '{player} trouve {nextPlayer}',
      'Passe de {player} vers {nextPlayer}',
      '{player} sert {nextPlayer}',
      '{player} oriente vers {nextPlayer}',
      '{player} pour {nextPlayer}',
      '{player} transmet à {nextPlayer}',
      '{player} décale {nextPlayer}',
      '{player} lance {nextPlayer}',
      '{player} écarte vers {nextPlayer}',
      '{player} trouve {nextPlayer}',
      '{player} envoie vers {nextPlayer}'
    ],
    'Echec': [
      '{player} rate sa passe..',
      '{player} perd le ballon sur la passe',
      'Passe manquée de {player}',
      '{player} échoue sur sa passe',
      'La passe de {player} ne trouve personne'
    ],
    'Self': [  // Nouveau template pour l'auto-passe
      '{player} dribble et hésite...',
      '{player} remonte le terrain',
      '{player} temporise',
      '{player} cherche une ouverture',
      '{player} peine à trouver un partenaire'
    ],
    default: [
      'Shoot à {pts}PT de {player}...',
      '{player} tente un shoot à {pts}PT...',
      '{player} prend un tir à {pts}PT',
      '{player} essaie à {pts}PT'
    ]
  },
  'Rebond Global': {
    default: [
      'Rebond pour {nextPlayer}',
      '{nextPlayer} capte le rebond',
      '{nextPlayer} arrache le rebond',
      '{nextPlayer} s\'impose au rebond',
      '{nextPlayer} récupère le ballon'
    ]
  },
  Steal: {
    default: [
      '{nextPlayer} intercepte la passe de {player}',
      '{player} se fait voler la balle par {nextPlayer}',
      '{nextPlayer} subtilise le ballon à {player}',
      'Interception de {nextPlayer}',
      '{nextPlayer} coupe la trajectoire de la balle'
    ]
  },
  Shoot: {
    'Succès': [
      "Et ça rentre pour {player} !     <span class=\"points\">+{pts}PT</span>  pour les <span class=\"teamtag\">{team}</span> !",
      '{player} marque à  <span class=\"points\">{pts}PT</span>  et fait briller les <span class=\"teamtag\">{team}</span> !',
      'Panier de {player} !     <span class=\"points\">+{pts}PT</span>  pour les <span class=\"teamtag\">{team}</span>',
      '{player} fait mouche !     <span class=\"points\">+{pts}PT</span>  pour les <span class=\"teamtag\">{team}</span>',
      'Superbe shoot de {player} et  <span class=\"points\">+{pts}PT</span>  pour les <span class=\"teamtag\">{team}</span> !'
    ],
    'Echec': [
      "C'est raté pour {player}",
      '{player} manque son tir à {pts}PT',
      'Tir manqué de {player}',
      'Et c\'est loupé pour {player}, il est temps de dépenser du $PAD !',
      '{player} manque son shoot à {pts}PT',
      'Le ballon rebondi sur l\'anneau, échec de {player}'
    ],
    'Blocked': [
      '{player} se fait  <span class="block">contrer !</span>',
      '<span class="block">Contre</span>  sur le tir de {player} à {pts}PT',
      'Tir de {player}  <span class="block"> bloqué net !</span>',
      '<span class="block">Énorme contre</span> sur le shoot de {player}',
      'Le shoot de {player} est  <span class="block">stoppé</span>'
     
    ]
  },
  Block: {
    default: [
      '{nextPlayer} bloque le shoot de {player}',
      '{nextPlayer} vient stopper {player}',
      '{nextPlayer} s\'interpose sur le tir de {player}',
      '{player} se fait stopper par {nextPlayer}',
      'Contre de {nextPlayer} sur {player}',
      '{nextPlayer} repousse le shoot de {player}',
      'Magnifique block de {nextPlayer} face à {player}'
    ]
  }
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Variable pour suivre si le premier message a été affiché
let debutMatchAffiche = false;

// Fonction pour encapsuler un nom de joueur avec les styles d'équipe
function wrapPlayer(name, teamCode) {
  if (!name) return '';
  return `<span class="comment-player team-${teamCode}">${name}</span>`;
}

function buildComment(evt, nextEvt) {
  // DEBUG
  console.log('buildComment - START =====================');
  console.log('commentaire-Equipe:', evt['commentaire-Equipe']);
  console.log('commentaire-Joueur:', evt['commentaire-Joueur']);
  console.log('commentaire-Situation:', evt['commentaire-Situation']);
  console.log('scoreboard-Etape:', evt['scoreboard-Etape']);
  
  // Gestion spéciale pour le coup d'envoi et la fin de match
  if (evt['scoreboard-Etape'] === 0 || evt['scoreboard-Etape'] === '0') {
    // Ne rien afficher de spécial au début du match
    return "Début du match !";
  }
  if (evt['scoreboard-Etape'] === 701) {
    return "Fin du match ! Merci d'avoir suivi cette rencontre.";
  }
  const situation = evt['commentaire-Situation'];
  const result = evt['commentaire-Succes'];
  const templates = COMMENT_TEMPLATES[situation];
  if (!templates) return '';
  
  // Vérifier si c'est une auto-passe (même joueur, possession consécutive)
  const isSelfPass = 
    situation === 'Possession' && 
    result === 'Succès' && 
    nextEvt['commentaire-Situation'] === 'Possession' &&
    evt['commentaire-Joueur'] === nextEvt['commentaire-Joueur'] &&
    evt['commentaire-Equipe'] === nextEvt['commentaire-Equipe'];
  
  // Choisir la liste de templates appropriée
  let list;
  if (isSelfPass) {
    list = templates['Self'];
  } else {
    list = (!isEmptyValue(result) && templates[result]) || templates.default;
  }
  
  if (!list) return '';
  let tpl = pick(list);
  
  // Déterminer le bon nombre de points en regardant aussi l'événement suivant
  let points = detectShotType(evt);
  
  // Vérifier si la situation est une Possession avec statut vide
  if (situation === 'Possession' && isEmptyValue(result) && nextEvt['commentaire-Situation'] === 'Shoot') {
    points = detectShotType(nextEvt);
  }
  
  // DEBUG avant le remplacement final
  console.log('Template avant remplacement:', tpl);
  console.log('Points détectés:', points);
  console.log('getTeamName retourne:', getTeamName(evt['commentaire-Equipe']));
  
  const finalComment = tpl
    .replace('{player}', wrapPlayer(evt['commentaire-Joueur'], evt['commentaire-Equipe']))
    .replace('{nextPlayer}', wrapPlayer(nextEvt['commentaire-Joueur'], nextEvt['commentaire-Equipe']))
    .replace('{pts}', points)
    .replace('{team}', getTeamName(evt['commentaire-Equipe']));
  
  console.log('Commentaire final:', finalComment);
  console.log('buildComment - END =====================');
  
  return finalComment;
}

// Cette fonction est appelée dans buildComment avec l'événement actuel
function detectShotType(evt) {
  // 1. Utiliser directement la colonne simplifiée uniquement pour les Shoot
  if (evt['commentaire-Situation'] === 'Shoot') {
    const directVal = parseInt(evt['Test 2-3 PT'], 10);
    if (directVal === 2 || directVal === 3) {
      return directVal;
    }
  }

  // 2. Fallback : calculer la différence de score par rapport à l'événement précédent
  if (!Array.isArray(window.jsonData)) return 2; // Sécurité

  const currentStep = Number(evt['scoreboard-Etape'] || 0);
  const team = evt['commentaire-Equipe'];
  if (!team || isNaN(currentStep)) return 2;

  // Chercher l'événement précédent dans la timeline
  const prevEvt = window.jsonData.find(e => Number(e['scoreboard-Etape']) === currentStep - 1);
  if (!prevEvt) return 2;

  const scoreKey = team === 'A' ? 'scoreboard-ScoreA' : 'scoreboard-ScoreB';
  const prevScore = Number(prevEvt[scoreKey] || 0);
  const curScore = Number(evt[scoreKey] || 0);
  const diff = curScore - prevScore;

  if (diff === 3) return 3;
  if (diff === 2) return 2;

  // 3. Par défaut (non déterminé)
  return 2;
}

function getTeamName(code) {
  // Debug
  console.log(`getTeamName appelé avec code: '${code}'`);
  
  // Récupérer les données d'équipe depuis la variable globale
  const teamsData = getGlobalTeamsData();
  
  let teamIndex = -1;
  let teamName = code === 'A' ? 'Hawks' : 'Bears'; // Valeurs par défaut
  
  if (code === 'A' || code === 'B') {
    // D'abord essayer de récupérer l'index depuis les sélecteurs
    const selectElement = document.getElementById(`team-${code.toLowerCase()}-select`);
    if (selectElement && selectElement.selectedIndex > 0) {
      teamIndex = parseInt(selectElement.value);
    }
    // Sinon, essayer depuis les données JSON
    else if (window.jsonData && window.jsonData[0]) {
      try {
        const jsonIndex = code === 'A' ? 'TeamA' : 'TeamB';
        if (typeof window.jsonData[0][jsonIndex] !== 'undefined') {
          teamIndex = parseInt(window.jsonData[0][jsonIndex]);
        }
      } catch (e) {
        console.warn('Impossible de déterminer l\'index d\'équipe depuis JSON:', e);
      }
    }
    
    // Si l'index est valide, récupérer le nom complet de l'équipe
    if (teamIndex >= 0 && teamsData.teams && teamIndex < teamsData.teams.length) {
      teamName = teamsData.teams[teamIndex].name || (code === 'A' ? 'Hawks' : 'Bears');
    }
  }
  
  // Retourner le nom complet de l'équipe
  console.log(`Utilisation du nom d'équipe: '${teamName}'`);
  return teamName;
}

/**
 * Échappe les caractères spéciaux pour RegExp
 */
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
}

// Expose en global
window.wrapPlayer = wrapPlayer;
window.generateComments = generateComments;
window.renderComments = renderComments;
