/**
 * Animations et effets visuels pour PBA Lecteur
 * Gère les animations et effets visuels dynamiques de l'interface
 */

// Styles CSS pour l'animation de tir
const style = document.createElement('style');
style.textContent = `
    @keyframes shotArc {
        0% {
            transform: translate(0, 0) scale(1);
        }
        50% {
            transform: translate(var(--shot-distance), -100px) scale(0.7);
        }
        100% {
            transform: translate(calc(var(--shot-distance) * 2), 0) scale(1);
        }
    }

    .shooting {
        animation: shotArc 1.2s cubic-bezier(0.36, 0, 0.66, -0.56) forwards;
        z-index: 1000;
    }

    .ball-container {
        transition: opacity 0.3s ease-in-out;
    }
`;
document.head.appendChild(style);

// Stockage des valeurs précédentes pour détecter les changements
let previousStatsValues = {};
let previousPossession = null;

/**
 * Affiche une animation furtive lors d'un changement de quart-temps (Q2, Q3, Q4)
 * @param {number} quarterNum - 2, 3 ou 4
 */
function showQuarterTransition(quarterNum) {
    console.log('[QUARTER-ANIMATION] showQuarterTransition appelé pour Q'+quarterNum);

    if (![2,3,4].includes(quarterNum)) return;
    // Importer le CSS si pas déjà fait
    if (!document.getElementById('quarter-transition-css')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/quarter-transition.css';
        link.id = 'quarter-transition-css';
        document.head.appendChild(link);
    }
    // Supprimer un éventuel bandeau existant
    const prev = document.getElementById('quarter-transition-banner');
    if (prev) prev.remove();
    // Créer le bandeau
    const banner = document.createElement('div');
    banner.id = 'quarter-transition-banner';
    banner.className = 'quarter-transition';
    banner.textContent = `Q${quarterNum}`;
    document.body.appendChild(banner);
    console.log('[QUARTER-ANIMATION] Bandeau injecté dans le DOM');
    // Supprimer après l'animation (1.2s)
    setTimeout(() => {
        banner.remove();
        console.log('[QUARTER-ANIMATION] Bandeau retiré du DOM');
    }, 1300);
}


/**
 * Initialisation des animations
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Animations initialized');
    
    // Initialiser le stockage des valeurs précédentes
    initPreviousValues();
});

/**
 * Initialise le stockage des valeurs précédentes des statistiques
 */
function initPreviousValues() {
    // Récupérer toutes les cellules de statistiques
    const statCells = document.querySelectorAll('#stats-table .team-a td:not(.player-name):not(.team-label), #stats-table .team-b td:not(.player-name):not(.team-label)');
    
    // Initialiser les valeurs précédentes à 0
    statCells.forEach(cell => {
        const rowIndex = cell.parentElement.rowIndex;
        const cellIndex = cell.cellIndex;
        const key = `${rowIndex}-${cellIndex}`;
        previousStatsValues[key] = cell.textContent || '0';
    });
    
    console.log('Previous values initialized');
}

/**
 * Met en évidence les cellules dont la valeur a changé
 * @param {HTMLElement} cell - La cellule à vérifier
 */
/**
 * Met en surbrillance une cellule dont la valeur a changé
 * @param {HTMLElement} cell - La cellule à animer
 */
function highlightChangedCell(cell) {
    // Stocker les informations de la cellule pour le suivi
    const rowIndex = cell.parentElement.rowIndex;
    const cellIndex = cell.cellIndex;
    const key = `${rowIndex}-${cellIndex}`;
    const currentValue = cell.textContent || '0';
    
    // Si la valeur n'a pas changé, ne pas faire d'animation
    if (previousStatsValues[key] === currentValue) {
        return;
    }
    
    // Si la valeur a augmenté
    const prevValue = parseFloat(previousStatsValues[key] || '0');
    const newValue = parseFloat(currentValue || '0');
    const valueIncreased = newValue > prevValue;
    
    // Si l'animation est déjà en cours, la réinitialiser
    if (cell.classList.contains('stat-highlight')) {
        cell.classList.remove('stat-highlight');
        // Force un reflow pour redémarrer correctement l'animation
        void cell.offsetWidth; 
    }
    
    // Sauvegarder les styles originaux avant l'animation
    const originalBackgroundColor = cell.style.backgroundColor;
    const originalTextColor = cell.style.color;
    const originalWeight = cell.style.fontWeight;
    
    // Appliquer l'animation de highlight
    cell.classList.add('stat-highlight');
    

    
    // Retirer la classe après l'animation et restaurer les styles originaux
    setTimeout(() => {
        cell.classList.remove('stat-highlight');
    }, 1000);
    
    // Mettre à jour la valeur précédente
    previousStatsValues[key] = currentValue;
}

/**
 * Vérifie et applique le style pour les valeurs TO négatives
 * @param {HTMLElement} cell - La cellule à vérifier
 */
function checkTOValue(cell) {
    // Vérifier si c'est une cellule TO (8ème colonne de stats)
    const cellIndex = cell.cellIndex;
    const headerRow = document.querySelector('#stats-table tr.stats-row');
    
    if (headerRow) {
        const headers = headerRow.querySelectorAll('td');
        
        // Parcourir les en-têtes pour trouver la colonne TO
        headers.forEach((header, index) => {
            if (header.textContent === 'TO' && cellIndex === index) {
                // C'est une cellule TO, vérifier sa valeur
                const value = parseInt(cell.textContent || '0');
                
                if (value < 0) {
                    cell.classList.add('negative-to');
                } else {
                    cell.classList.remove('negative-to');
                }
            }
        });
    }
}

/**
 * Met à jour l'indicateur de possession
 * @param {string} possession - 'Home' ou 'Away'
 */
function updatePossessionIndicator(possession) {
    if (previousPossession === possession) return;
    
    // Créer ou récupérer l'indicateur de possession
    let possessionIndicator = document.getElementById('possession-indicator');
    
    if (!possessionIndicator) {
        possessionIndicator = document.createElement('div');
        possessionIndicator.id = 'possession-indicator';
        possessionIndicator.className = 'possession-ball';
        
        // Ajouter l'indicateur à la section de commentaire
        const commentaryBox = document.querySelector('.commentary-box');
        if (commentaryBox) {
            commentaryBox.appendChild(possessionIndicator);
        }
    }
    
    // Mettre à jour la position de l'indicateur
    if (possession === 'Home') {
        possessionIndicator.classList.remove('away');
        possessionIndicator.classList.add('home');
    } else if (possession === 'Away') {
        possessionIndicator.classList.remove('home');
        possessionIndicator.classList.add('away');
    }
    
    // Animer l'apparition
    possessionIndicator.classList.add('animate');
    setTimeout(() => {
        possessionIndicator.classList.remove('animate');
    }, 500);
    
    // Mettre à jour la valeur précédente
    previousPossession = possession;
}

/**
 * Applique toutes les animations et effets visuels
 * Cette fonction est appelée après chaque mise à jour des données
 * @param {Object} currentRow - Les données JSON de l'étape actuelle
 */
/**
 * Détecte si une action est un tir et de quel type
 * @param {Object} evt - L'événement à analyser
 * @returns {Object} - { isShooting: boolean, points: number }
 */
function detectShot(evt) {
    console.log('[DEBUG] detectShot evt:', evt);
    if (!evt) return { isShooting: false, points: 0 };

    // Vérifier si c'est une action de tir
    const isShooting = evt['commentaire-Situation'] === 'Shoot' || 
                      (evt['commentaire-Situation'] && evt['commentaire-Situation'].includes('tir'));

    if (!isShooting) return { isShooting: false, points: 0 };

    // 1. Utiliser la colonne simplifiée pour les Shoot
    if (evt['commentaire-Situation'] === 'Shoot') {
        const points = parseInt(evt['Test 2-3 PT'], 10);
        if (points === 2 || points === 3) {
            return { isShooting: true, points };
        }
    }

    // 2. Vérifier la différence de score
    if (!Array.isArray(window.jsonData)) return { isShooting: true, points: 2 };

    const currentStep = Number(evt['scoreboard-Etape'] || 0);
    const team = evt['commentaire-Equipe'];
    if (!team || isNaN(currentStep)) return { isShooting: true, points: 2 };

    const prevEvt = window.jsonData.find(e => Number(e['scoreboard-Etape']) === currentStep - 1);
    if (!prevEvt) return { isShooting: true, points: 2 };

    const scoreKey = team === 'A' ? 'scoreboard-ScoreA' : 'scoreboard-ScoreB';
    const prevScore = Number(prevEvt[scoreKey] || 0);
    const curScore = Number(evt[scoreKey] || 0);
    const diff = curScore - prevScore;

    return { 
        isShooting: true, 
        points: diff === 3 ? 3 : 2
    };
}



function applyVisualEffects(currentRow) {
    console.log('[DEBUG] applyVisualEffects row:', currentRow);
    if (!currentRow) return;

    // Détecter le tir et son type
    const { isShooting, points } = detectShot(currentRow);
    const isThreePointer = points === 3;

    // Mettre à jour l'indicateur de possession avec l'animation de tir si nécessaire
    const team = currentRow['commentaire-Equipe'];
    if (team) {
        console.log(`[DEBUG] updatePossessionIndicator(${team}, isShooting=${isShooting}, isThreePointer=${isThreePointer})`);
        updatePossessionIndicator(team);

    }

    // Mettre en évidence les cellules modifiées
    const statCells = document.querySelectorAll('#stats-table .team-a td:not(.player-name):not(.team-label), #stats-table .team-b td:not(.player-name):not(.team-label)');
    statCells.forEach(cell => {
        highlightChangedCell(cell);
        checkTOValue(cell);
    });
}

// Exporter les fonctions pour utilisation dans d'autres scripts
window.Animations = {
    applyVisualEffects,
    initPreviousValues,
    showQuarterTransition
};
