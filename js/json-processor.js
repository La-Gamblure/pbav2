/**
 * JSON Processor pour le Lecteur PBA
 * Gère le chargement, le traitement et l'affichage des données JSON dans l'interface
 */


// Import du générateur de commentaires (mode module)




// Variables globales pour le stockage des données et l'état du lecteur
let jsonData = []; // Données du match
let currentRowIndex = 0; // Index de la ligne actuelle
let isPlaying = false; // État de lecture (lecture/pause)
let playbackTimer; // Timer pour l'avancement automatique
let playbackSpeed = 1; // Vitesse de lecture (par défaut: x1)

// Constantes pour mapper les clés JSON avec les ID HTML
const COLUMNS = {
    // Propriétés pour le scoreboard
    QUARTER: "scoreboard-QT",
    TIME: "scoreboard-Temps",
    ETAPE: "scoreboard-Etape",
    SCORE_TEAM_A: "Score cumulé Equipe A",
    SCORE_TEAM_B: "Score cumulé Equipe B",
    POSSESSION: "commentaire-Equipe", // Équipe qui a la possession
    
    // Propriétés pour les commentaires
    PLAYER_NAME: "commentaire-Joueur",
    ACTION_TYPE: "commentaire-Situation",
    ACTION_RESULT: "commentaire-Succes"
    
    // Statistiques des joueurs sont directement mappées avec les ID HTML (A1-Points, B2-Rebounds, etc.)
};

// Initialisation du traitement JSON
// Cet event listener a été consolidé avec celui en bas du fichier

/**
 * Configure les contrôles de lecture (play, pause, reset, vitesse)
 */
function setupPlaybackControls() {
    // Affiche le placeholder au chargement
    const commentsBox = document.getElementById('comments');
    if (commentsBox) {
        commentsBox.innerHTML = '<p id="placeholder-comment" class="generated-comment">Le match va bientôt commencer</p>';
    }
    try {
        const playButton = document.getElementById('play-button');
        const pauseButton = document.getElementById('pause-button');
        const resetButton = document.getElementById('reset-button');
        const speedSelector = document.getElementById('playback-speed');
        
        if (playButton) {
            playButton.addEventListener('click', startPlayback);
        } else {
            throw new Error('Bouton play introuvable dans le DOM');
        }
        
        if (pauseButton) {
            pauseButton.addEventListener('click', pausePlayback);
        } else {
            throw new Error('Bouton pause introuvable dans le DOM');
        }
        
        if (resetButton) {
            resetButton.addEventListener('click', resetPlayback);
        } else {
            throw new Error('Bouton reset introuvable dans le DOM');
        }
        
        if (speedSelector) {
            speedSelector.addEventListener('change', function() {
                playbackSpeed = parseFloat(this.value);
                
                // Si la lecture est en cours, redémarrer avec la nouvelle vitesse
                if (isPlaying) {
                    pausePlayback();
                    startPlayback();
                }
            });
        } else {
            throw new Error('Sélecteur de vitesse introuvable dans le DOM');
        }
        
        // Désactiver les boutons au démarrage
        updateControlButtonsState(false);
    } catch (error) {
        console.error('Erreur lors de la configuration des contrôles:', error.message);
    }
}

/**
 * Met à jour l'état d'activation des boutons de contrôle
 * @param {boolean} hasData - Si des données JSON sont disponibles
 */
function updateControlButtonsState(hasData) {
    try {
        const playButton = document.getElementById('play-button');
        const pauseButton = document.getElementById('pause-button');
        const resetButton = document.getElementById('reset-button');
        const speedSelector = document.getElementById('playback-speed');
        
        if (playButton) {
            playButton.disabled = !hasData || isPlaying;
        }
        
        if (pauseButton) {
            pauseButton.disabled = !hasData || !isPlaying;
        }
        
        if (resetButton) {
            resetButton.disabled = !hasData;
        }
        
        if (speedSelector) {
            speedSelector.disabled = !hasData;
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour des contrôles:', error.message);
    }
}

/**
 * Gère le téléchargement et le traitement du fichier JSON
 * @param {Event} event - Événement de changement du champ de fichier
 */
function handleFileUpload(event) {
    try {
        // Vérification de l'événement
        if (!event || !event.target) {
            throw new Error('Événement invalide');
        }
        
        // Vérification des fichiers
        if (!event.target.files || event.target.files.length === 0) {
            throw new Error('Aucun fichier sélectionné');
        }
            
        // Désactiver le lecteur pendant le chargement
        isPlaying = false;
        updateControlButtonsState(false);
        
        // Récupérer le fichier sélectionné
        const file = event.target.files[0];
        
        // Vérification du type MIME pour s'assurer qu'il s'agit d'un fichier Excel
        if (file.type && !file.name.endsWith('.xlsx')) {
            throw new Error('Le fichier sélectionné n\'est pas un fichier Excel (.xlsx)');
        }
        
        // Traiter le fichier Excel avec PBAExcelProcessor
        if (typeof window.PBAExcelProcessor === 'undefined') {
            throw new Error('Le processeur Excel PBA n\'est pas chargé');
        }
        
        // Afficher un message de chargement
        const loadingMessage = document.createElement('div');
        loadingMessage.id = 'loading-message';
        loadingMessage.textContent = 'Traitement du fichier Excel en cours...';
        loadingMessage.style.position = 'fixed';
        loadingMessage.style.top = '50%';
        loadingMessage.style.left = '50%';
        loadingMessage.style.transform = 'translate(-50%, -50%)';
        loadingMessage.style.padding = '20px';
        loadingMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        loadingMessage.style.color = 'white';
        loadingMessage.style.borderRadius = '5px';
        loadingMessage.style.zIndex = '9999';
        document.body.appendChild(loadingMessage);
        
        // Traiter le fichier Excel de manière asynchrone
        window.PBAExcelProcessor.processExcel(file)
            .then(result => {
                // Supprimer le message de chargement
                document.body.removeChild(loadingMessage);
                
                // Récupérer les données JSON et les noms d'équipes
                const { jsonData: rawJsonData, teamNames } = result;
                
                // Sélectionner automatiquement les équipes en fonction des noms extraits
                selectTeamsByNames(teamNames.teamA, teamNames.teamB);
                
                // Traiter le JSON avec le générateur de commentaires si disponible
                // IMPORTANT: utiliser la variable globale, pas une variable locale
                jsonData = rawJsonData;
                    
                    try {
                        // Enrichissement des actions (si enrichPlays existe)
                        if (typeof wrapPlayers === 'function') {
                            jsonData = wrapPlayers(rawJsonData);
                        }
                        // Génération des commentaires enrichis
                        jsonData = generateComments(jsonData);
                    } catch (enrichError) {
                        console.warn('Enrichissement ou génération de commentaires non disponible:', enrichError.message);
                    }
                    
                    // Stocker les données dans window pour compatibilité avec d'autres modules
                    window.jsonData = jsonData;
                    
                    // Le placeholder affiche déjà "Début du match !" par défaut
                    
                    // Mettre à jour les compteurs
                    document.getElementById('current-step').textContent = '1';
                    document.getElementById('total-steps').textContent = jsonData.length;
                    
                    // Réinitialiser l'index de la ligne actuelle
                    currentRowIndex = 0;
                    
                    // Mettre à jour l'affichage avec la première ligne
                    updateDisplay(currentRowIndex);
                    
                    // Activer les boutons de contrôle
                    updateControlButtonsState(true);
                    
                    // Notification à l'utilisateur
                    alert(`Données chargées avec succès! ${jsonData.length} étapes disponibles.`);
                })
                .catch(error => {
                    // Supprimer le message de chargement en cas d'erreur
                    if (document.getElementById('loading-message')) {
                        document.body.removeChild(document.getElementById('loading-message'));
                    }
                    
                    // Afficher l'erreur
                    console.error('Erreur lors du traitement du fichier Excel:', error);
                    alert('Erreur lors du traitement du fichier Excel: ' + error.message);
                });
            
            // Définir la fonction d'erreur
            // Pas besoin de reader.readAsText car processExcel gère la lecture du fichier
    } catch (error) {
        console.error('Erreur lors du chargement du fichier Excel:', error.message);
        alert('Erreur lors du chargement du fichier Excel: ' + error.message);
        updateControlButtonsState(false);
    }
}

/**
 * Met à jour l'affichage avec les données de la ligne actuelle
 * @param {number} rowIndex - Index de la ligne dans jsonData
 */
// --- Dans updateDisplay(rowIndex) ---
let previousQuarter = 'Q1';

function updateDisplay(rowIndex) {
    try {
      if (rowIndex < 0 || rowIndex >= jsonData.length) {
        throw new Error(`Index invalide: ${rowIndex}`);
      }
      const row     = jsonData[rowIndex];
      const nextRow = jsonData[rowIndex + 1] || {};
  
      // Mise à jour des compteurs, scoreboard, etc.
      document.getElementById('current-step').textContent = rowIndex + 1;
      
      // Vérifier si c'est la fin du match
      if (row['scoreboard-Etape'] === 701 || row['commentaire-Situation'] === 'Fin du Match !') {
          document.body.classList.add('match-ended');
      } else {
          document.body.classList.remove('match-ended');
      }
      // Détecter le changement de quart-temps (hors Q1)
      const currentQuarter = row[COLUMNS.QUARTER] || 'Q1';
      if (
        typeof window.Animations?.showQuarterTransition === 'function' &&
        previousQuarter !== currentQuarter &&
        ['Q2', 'Q3', 'Q4'].includes(currentQuarter)
      ) {
        // Affiche l'animation stylisée
        window.Animations.showQuarterTransition(parseInt(currentQuarter.replace('Q','')));
      }
      previousQuarter = currentQuarter;

      updateScoreboard(row);
      updatePossession(row);
  
      // Passe nextRow à updateCommentary
      updateCommentary(row, nextRow);
  
      updatePlayerStats(row);
      computeAndMarkMVP();
      // --- Ajout Cascade : animation visuelle à chaque étape ---
      if (window.Animations && typeof window.Animations.applyVisualEffects === 'function') {
        window.Animations.applyVisualEffects(row);
      }
    } catch (err) {
      console.error('updateDisplay error:', err);
    }
  }
  
  /**
   * Met à jour les commentaires avec les données de la ligne
   * @param {Object} row     - Ligne actuelle
   * @param {Object} nextRow - Ligne suivante (peut être vide)
   */
  function updateCommentary(row, nextRow) {
    const commentsBox = document.getElementById('comments');
    if (!commentsBox) return;
    commentsBox.innerHTML = '';
  
    if (!row.generatedComment) return;

    const p = document.createElement('p');
    p.className = 'generated-comment';

    // Appliquer style Succès/Échec si Shoot
    if (row['commentaire-Situation'] === 'Shoot') {
      const res = row['commentaire-Succes'];
      if (res === 'Succès')      p.classList.add('shoot-success');
      else if (res === 'Echec' || res === 'Blocked') p.classList.add('shoot-failure');
    }

    // Les noms des joueurs sont déjà encapsulés dans buildComment
    p.innerHTML = row.generatedComment;
    commentsBox.appendChild(p);
  }
  
  /** Met à jour le scoreboard avec les données de la ligne
 * @param {Object} row - Données de la ligne
 */
function updateScoreboard(row) {
    // Mettre à jour le quart-temps
    const quarter = row[COLUMNS.QUARTER] || "Q1";
    document.getElementById('quarter').textContent = quarter;
    
   

    // Mettre à jour le temps avec transformation du format
    let time = row[COLUMNS.TIME] || "12:00";

    // Transformer le format mm'ss'' en mm:ss
time = time.replace(/(\d+)'(\d+)''/, '$1:$2');

// Dans certains cas, le format peut être uniquement mm' ou mm'ss'
time = time.replace(/(\d+)'(\d*)$/, function(match, minutes, seconds) {
    // Si les secondes ne sont pas spécifiées, mettre 00
    return `${minutes}:${seconds || '00'}`;
});

// S'assurer que les secondes ont toujours 2 chiffres
const parts = time.split(':');
if (parts.length === 2) {
    const minutes = parts[0];
    const seconds = parts[1].padStart(2, '0'); // Ajouter un 0 si nécessaire
    time = `${minutes}:${seconds}`;
}

document.getElementById('timer').textContent = time;


    
    // Debug : afficher les clés disponibles dans la première ligne
    if (currentRowIndex === 0) {
        console.log('=== DIAGNOSTIC DES COLONNES ===');
        console.log('Colonnes disponibles dans les données:', Object.keys(row));
        console.log('Recherche de:', COLUMNS.SCORE_TEAM_A, 'et', COLUMNS.SCORE_TEAM_B);
        console.log('Exemple de données pour A1:', {
            Points: row['A1-Points'],
            '3-Points': row['A1-3-Points'],
            'FG%': row['A1-FG%'],
            Rebounds: row['A1-Rebounds']
        });
        console.log('Données complètes de la première ligne:', row);
    }
    
    // Mettre à jour le score de l'équipe A - chercher dans plusieurs colonnes possibles
    const scoreA = row[COLUMNS.SCORE_TEAM_A] || 
                   row['Score cumulé Equipe A'] || 
                   row['scoreboard-ScoreA'] || 
                   row['Score Equipe A'] || 
                   row['ScoreA'] || 
                   0;
    document.getElementById('team-a-score').textContent = scoreA;
    
    // Mettre à jour le score de l'équipe B - chercher dans plusieurs colonnes possibles
    const scoreB = row[COLUMNS.SCORE_TEAM_B] || 
                   row['Score cumulé Equipe B'] || 
                   row['scoreboard-ScoreB'] || 
                   row['Score Equipe B'] || 
                   row['ScoreB'] || 
                   0;
    document.getElementById('team-b-score').textContent = scoreB;
    
    // Mettre en évidence l'équipe qui mène
    try {
        updateScoreHighlight(scoreA, scoreB);
    } catch (error) {
        console.warn('Mise en évidence des scores non disponible:', error.message);
    }
}

/**
 * Met à jour l'indicateur de possession avec emoji
 * @param {Object} row - Données de la ligne
 */
function updatePossession(row) {
    // Récupérer directement le code d'équipe (A ou B)
    const possession = row['commentaire-Equipe'];
    
    // Log pour débogage - simplifié
    console.log('Mise à jour de la possession pour équipe:', possession);
    
    // Mise à jour de l'indicateur visuel
    updateBallPossessionIndicator(possession);
}

/**
 * Met à jour l'indicateur de possession (ballon de basketball)
 * @param {string} possession - Code de l'équipe (A ou B) qui a la possession
 */
function updateBallPossessionIndicator(possession) {
    const teamABall = document.getElementById('team-a-ball');
    const teamBBall = document.getElementById('team-b-ball');

    // Nettoyage : tout cacher
    if (teamABall) teamABall.style.opacity = '0';
    if (teamBBall) teamBBall.style.opacity = '0';

    // Afficher le ballon approprié
    if (possession === 'A' && teamABall) {
        teamABall.style.opacity = '1';
    } else if (possession === 'B' && teamBBall) {
        teamBBall.style.opacity = '1';
    }
    // Log pour suivi complet
    console.log('[BallIndicator] possession =', possession);
}

/**
 * Met à jour les statistiques des joueurs avec les données de la ligne
 * @param {Object} row - Données de la ligne
 */
function updatePlayerStats(row) {
    // Mettre à jour les statistiques des joueurs selon leur équipe
    updateTeamStats(row, 'a');
    updateTeamStats(row, 'b');
}

/**
 * Met en évidence l'équipe qui mène au score
 * @param {number} scoreA - Score de l'équipe A
 * @param {number} scoreB - Score de l'équipe B
 */
function updateScoreHighlight(scoreA, scoreB) {
    const teamAScore = document.getElementById('team-a-score');
    const teamBScore = document.getElementById('team-b-score');
    
    // Retirer les classes précédentes
    teamAScore.classList.remove('winning-team', 'losing-team');
    teamBScore.classList.remove('winning-team', 'losing-team');
    
    // Appliquer les classes appropriées selon le score
    if (parseFloat(scoreA) > parseFloat(scoreB)) {
        teamAScore.classList.add('winning-team');
        teamBScore.classList.add('losing-team');
    } else if (parseFloat(scoreB) > parseFloat(scoreA)) {
        teamBScore.classList.add('winning-team');
        teamAScore.classList.add('losing-team');
    }
    // Si égalité, aucune classe n'est appliquée
}

/**
 * Met à jour les statistiques d'une équipe spécifique
 * @param {Object} row - Données de la ligne
 * @param {string} team - Identifiant de l'équipe ('a' ou 'b')
 */
function updateTeamStats(row, team) {
    // Identifiants des joueurs de A1 à A5 ou B1 à B5 selon l'équipe
    const teamPrefix = team.toUpperCase();
    console.log(`Début de mise à jour des stats pour l'équipe ${teamPrefix}:`);
    
    // Types de statistiques dans l'ordre où elles apparaissent dans le tableau HTML
    // IMPORTANT: Cet ordre DOIT correspondre EXACTEMENT à l'ordre des colonnes dans index.html
    const statTypes = [
        'Points',      // Colonne 3 (après Team Label et Player Name)
        '3-Points',    // Colonne 4
        'Rebounds',    // Colonne 5
        'Assist',      // Colonne 6
        'Blocks',      // Colonne 7
        'Steals',      // Colonne 8
        'TurnOvers',   // Colonne 9
        'DD',          // Colonne 10
        'TD',          // Colonne 11
        'Total'        // Colonne 12
        // FG% est traité séparément car dans une colonne très éloignée (DI)
    ];
    
    // Stats FG% à traiter séparément
    const fgStatTypes = ['FG%', 'FGM', 'FGA', '3P%', '3PM', '3PA', '2P%', '2PM', '2PA'];
    
    // Pour afficher les clés JSON disponibles pour cette équipe
    const teamKeys = Object.keys(row).filter(key => key.startsWith(teamPrefix));
    console.log(`Clés disponibles pour l'équipe ${teamPrefix}:`, teamKeys.slice(0, 10));
    
    // Pour chaque joueur de l'équipe (1 à 5)
    for (let playerNum = 1; playerNum <= 5; playerNum++) {
        const playerId = `${teamPrefix}${playerNum}`;
        
        // Pour chaque type de statistique
        for (const statType of statTypes) {
            // Construire l'ID HTML et la clé JSON qui correspondent (ex: A1-Points, B3-Rebounds)
            const idStat = `${playerId}-${statType}`;
            
            // Récupérer l'élément par son ID
            const statElement = document.getElementById(idStat);
            
            if (!statElement) {
                // Log uniquement pour les éléments importants manquants
                if (statType === 'Points' || statType === 'Total') {
                    console.warn(`Élément non trouvé: #${idStat}`);
                }
                continue; // Élément non trouvé, passer au suivant
            }
            
            // FG% est traité séparément car dans une colonne très éloignée
            if (statType === 'FG%') {
                continue; // Skip FG% dans cette boucle
            }
            
            // Mettre à jour la cellule avec la valeur du JSON si elle existe
            if (row[idStat] !== undefined) {
                // Récupérer la valeur actuelle (convertir en nombre pour la comparaison)
                let currentValue = parseFloat(row[idStat]);
if (!isNaN(currentValue)) {
    // Affiche 1 décimale si ce n'est pas un entier
    currentValue = Number.isInteger(currentValue) ? currentValue : currentValue.toFixed(1);
} else {
    currentValue = 0;
}
                
                // Récupérer la valeur précédente si elle existe
                const previousValue = previousStatsValues[idStat] || 0;
                
                // Mettre à jour le contenu
                // Traitement spécial pour DD et TD
                if (statType === 'DD' && parseFloat(currentValue) > 0) {
                    statElement.textContent = '✅✅';
                } else if (statType === 'TD' && parseFloat(currentValue) > 0) {
                    statElement.textContent = '✅';
                } else if (statType === 'TurnOvers' && parseFloat(currentValue) > 10) {
                    // Emoji boisson pour les TurnOvers mega-mega-critical
                    statElement.textContent = currentValue + ' 🥤';
                } else {
                    statElement.textContent = currentValue;
                }
                // CSS conditionnel pour TO, DD et TD
               if (["TurnOvers", "DD", "TD"].includes(statType)) {
    if (parseFloat(currentValue) !== 0) {
        statElement.classList.add('active');

        // -------- zone TurnOvers --------
        // Seuils basés sur les centiles : critical > 4.26, mega-critical > 7.4, mega-mega-critical > 10
        if (statType === 'TurnOvers' && parseFloat(currentValue) > 4.26) {
            statElement.classList.add('critical');
            
            // Si encore plus haut que 7.4, c'est mega-critical
            if (parseFloat(currentValue) > 7.4) {
                statElement.classList.add('mega-critical');
                
                // Si encore plus haut que 10, c'est mega-mega-critical
                if (parseFloat(currentValue) > 10) {
                    statElement.classList.add('mega-mega-critical');
                } else {
                    statElement.classList.remove('mega-mega-critical');
                }
            } else {
                statElement.classList.remove('mega-critical');
                statElement.classList.remove('mega-mega-critical');
            }
        } else {
            statElement.classList.remove('critical');
            statElement.classList.remove('mega-critical');
            statElement.classList.remove('mega-mega-critical');
        }

    } else {
        statElement.classList.remove('active');
        statElement.classList.remove('critical');
        statElement.classList.remove('mega-critical');
        statElement.classList.remove('mega-mega-critical');   // on nettoie aussi ici
    }
}
                
                // Si la valeur a augmenté, appliquer l'animation de mise en évidence
                if (currentValue > previousValue) {
                    console.log(`Incrémentation détectée pour ${idStat}: ${previousValue} -> ${currentValue}`);
                    
                    // Supprimer l'animation existante si elle est en cours
                    statElement.classList.remove('stat-updated');
                    
                    // Déclencher un reflow pour réinitialiser l'animation
                    void statElement.offsetWidth;
                    
                    // Ajouter la classe pour l'animation
                    statElement.classList.add('stat-updated');
                    
                    // Supprimer la classe après l'animation
                    setTimeout(() => {
                        statElement.classList.remove('stat-updated');
                    }, 1000); // Même durée que l'animation CSS
                }
                
                // Stocker la valeur actuelle pour la prochaine comparaison
                previousStatsValues[idStat] = currentValue;
                
                // Log uniquement pour les valeurs importantes
                if (statType === 'Points' || statType === 'Total') {
                    console.log(`Mise à jour de #${idStat} avec valeur:`, currentValue);
                }
            } else if (statType === 'Points' || statType === 'Total') {
                console.warn(`Aucune valeur trouvée dans le JSON pour la clé ${idStat}`);
            }
        }
    }
    
    console.log(`Statistiques mises à jour pour l'équipe ${teamPrefix}`);
    
    // Traiter FG% séparément (colonne éloignée dans Excel)
    updateFGStatsForTeam(row, team);
    
    // Appliquer les codes couleur pour les stats
    applyStatColorCoding();
}

/**
 * Met à jour les stats FG% qui sont dans des colonnes éloignées (DI et après)
 */
function updateFGStatsForTeam(row, team) {
    const teamPrefix = team.toUpperCase();
    
    for (let playerNum = 1; playerNum <= 5; playerNum++) {
        const playerId = `${teamPrefix}${playerNum}`;
        const fgElement = document.getElementById(`${playerId}-FG%`);
        
        if (!fgElement) continue;
        
        const fgPercent = row[`${playerId}-FG%`];
        
        // Debug log pour la première ligne
        if (currentRowIndex === 0 && playerNum === 1) {
            console.log(`Recherche FG% pour ${playerId}:`, fgPercent);
            console.log('Clés disponibles contenant FG:', Object.keys(row).filter(k => k.includes('FG')));
        }
        
        if (fgPercent !== undefined && fgPercent !== null && fgPercent !== '') {
            let percentValue = parseFloat(fgPercent);
            
            // Si la valeur est entre 0 et 1, c'est un ratio qu'il faut convertir en pourcentage
            if (percentValue >= 0 && percentValue <= 1) {
                percentValue = percentValue * 100;
            }
            
            fgElement.textContent = !isNaN(percentValue) ? `${percentValue.toFixed(1)}%` : '-';
        } else {
            fgElement.textContent = '-';
        }
    }
}


// Variable globale pour stocker les config de stats-css.json
let statsConfig = null;

/**
 * Charge la configuration des stats depuis stats-css.json
 */
async function loadStatsConfig() {
    try {
        const response = await fetch('stats-css.json');
        if (!response.ok) {
            throw new Error('Impossible de charger stats-css.json');
        }
        statsConfig = await response.json();
        console.log('Configuration des stats chargée:', statsConfig);
    } catch (error) {
        console.error('Erreur lors du chargement de stats-css.json:', error);
        // Valeurs par défaut si le fichier n'est pas trouvé
        statsConfig = {
            thresholds: {
                'PT': { d9: 26.00, overTop1: 28.83 },
                '3PT': { d9: 4.00, overTop1: 4.92 },
                'RB': { d9: 7.00, overTop1: 9.70 },
                'AST': { d9: 9.47, overTop1: 10.60 },
                'BLK': { d9: 2.96, overTop1: 3.60 },
                'STL': { d9: 3.65, overTop1: 4.40 },
                'Score': { d9: 61.37, overTop1: 78.14 }
            }
        };
    }
}

/**
 * Applique le code couleur pour les stats selon les seuils définis dans stats-css.json
 */
function applyStatColorCoding() {
    if (!statsConfig || !statsConfig.thresholds) {
        console.warn('Configuration des stats non chargée');
        return;
    }
    
    // Mapping entre les noms de colonnes HTML et les clés dans stats-css.json
    const statMapping = {
        'Points': 'PT',
        '3-Points': '3PT',
        'Rebounds': 'RB',
        'Assist': 'AST',
        'Blocks': 'BLK',
        'Steals': 'STL',
        'Total': 'Score'
    };
    
    // Pour chaque type de stat
    Object.keys(statMapping).forEach(statType => {
        const configKey = statMapping[statType];
        const thresholds = statsConfig.thresholds[configKey];
        
        if (!thresholds) {
            console.warn(`Pas de seuils définis pour ${configKey}`);
            return;
        }
        
        // Sélectionner toutes les cellules de ce type de stat
        const cells = document.querySelectorAll(`[id$="-${statType}"]`);
        
        cells.forEach(cell => {
            // Ignorer les cellules TO, DD, TD qui ont leur propre style
            if (cell.classList.contains('turnover') || 
                cell.classList.contains('doubledouble') || 
                cell.classList.contains('tripledouble')) {
                return;
            }
            
            const value = parseFloat(cell.textContent) || 0;
            
            // Retirer les classes précédentes
            cell.classList.remove('stat-d9', 'stat-overTop1');
            
            // Appliquer les nouvelles classes selon les seuils
            if (value >= thresholds.overTop1) {
                cell.classList.add('stat-overTop1');
            } else if (value >= thresholds.d9) {
                cell.classList.add('stat-d9');
            }
        });
    });
}

/**
 * Cherche le joueur ayant le plus gros score ET qui est dans l'équipe qui mène
 * En cas d'égalité au score entre les équipes, le joueur avec le plus gros score individuel est MVP
 * puis ajoute / retire le tag « MVP ».
 */
function computeAndMarkMVP() {
    // 1. Récupérer le score affiché au tableau
    const scoreA = parseFloat(
        document.getElementById('team-a-score').textContent.replace(',', '.')
    ) || 0;
    const scoreB = parseFloat(
        document.getElementById('team-b-score').textContent.replace(',', '.')
    ) || 0;

    // 2. Déterminer l'équipe qui mène ou s'il y a égalité
    let leadingTeam = null;
    let isTied = false;
    
    if (scoreA > scoreB) {
        leadingTeam = 'a';
    } else if (scoreB > scoreA) {
        leadingTeam = 'b';
    } else {
        // En cas d'égalité, on cherchera le meilleur joueur global
        isTied = true;
    }

    // 3. Parcourir les lignes des joueurs et trouver le meilleur score
    let bestRow = null;
    let bestScore = -Infinity;

    // Sélectionner soit les joueurs de l'équipe qui mène, soit tous les joueurs en cas d'égalité
    const rowSelector = isTied ? '.player-row' : `.team-${leadingTeam}.player-row`;
    const rows = document.querySelectorAll(`#stats-table ${rowSelector}`);
    
    rows.forEach(tr => {
        const totalCell = tr.querySelector('td:last-child');
        const score = parseFloat(totalCell.textContent.replace(',', '.')) || 0;
        if (score > bestScore) {
            bestScore = score;
            bestRow = tr;
        }
    });

    // 4. Retirer l'ancien tag MVP (s'il existe)
    document.querySelectorAll('#stats-table .mvp-tag').forEach(tag => tag.remove());

    // 5. Ajouter le tag sur la nouvelle ligne MVP
    if (bestRow) {
        const nameCell = bestRow.querySelector('.player-name');
        const tag = document.createElement('span');
        tag.className = 'mvp-tag';
        tag.textContent = 'MVP';
        nameCell.appendChild(tag);
        
        // Log pour débogage
        const playerName = nameCell.textContent.replace('MVP', '').trim();
        const playerTeam = bestRow.classList.contains('team-a') ? 'A' : 'B';
        console.log(`MVP attribué à ${playerName} (Équipe ${playerTeam}) avec score: ${bestScore}`);
        
        if (isTied) {
            console.log('MVP attribué au meilleur joueur global en raison d\'une égalité au score');
        }
    }
}

/**
 * Démarre la lecture automatique du match
 */
function startPlayback() {
    const commentsBox = document.getElementById('comments');
    
    // Vérifier si on est au début du match (index 0) ou en cours de match
    if (currentRowIndex === 0) {
        // Début du match - attendre 1,5 secondes exactement pour laisser le temps au message d'entre-deux d'être vu
        setTimeout(() => {
            _startPlaybackReal();
        }, 1500); // Attendre 1,5 secondes comme demandé par l'utilisateur
    } else {
        // Reprise du match - afficher un message de reprise
        if (commentsBox) {
            const quarter = jsonData[currentRowIndex][COLUMNS.QUARTER] || 'Q1';
            const time = jsonData[currentRowIndex][COLUMNS.TIME] || '12:00';
            commentsBox.innerHTML = `<p class="generated-comment">Reprise du match !</p>`;
        }
        setTimeout(() => {
            _startPlaybackReal();
        }, 800); // Délai plus court pour la reprise
    }
}

// Déplace l'ancienne logique de startPlayback ici
function _startPlaybackReal() {
    try {
        if (jsonData.length === 0) {
            throw new Error('Aucune donnée JSON disponible. Veuillez charger un fichier JSON valide.');
        }
        
        if (isPlaying) {
            return; // Déjà en cours de lecture
        }
        
        isPlaying = true;
        
        // Mettre à jour l'état des boutons
        updateControlButtonsState(true);
        
        // Calculer l'intervalle en fonction de la vitesse
        const interval = Math.floor(1000 / playbackSpeed);
        
        // Configurer le timer pour avancer automatiquement
        playbackTimer = setInterval(function() {
            // Avancer à la prochaine ligne
            currentRowIndex++;
            
            // Vérifier si on atteint la fin du match
            if (currentRowIndex >= jsonData.length) {
                pausePlayback();
                return;
            }
            
            // Mettre à jour l'affichage
            updateDisplay(currentRowIndex);
        }, interval);
    } catch (error) {
        console.error('Erreur lors du démarrage de la lecture:', error.message);
        alert(error.message);
        isPlaying = false;
        updateControlButtonsState(true);
    }
}

/**
 * Met en pause la lecture automatique
 */
function pausePlayback() {
    try {
        if (playbackTimer) {
            clearInterval(playbackTimer);
            playbackTimer = null;
        }
        
        isPlaying = false;
        updateControlButtonsState(true);
    } catch (error) {
        console.error('Erreur lors de la mise en pause:', error.message);
    }
}

/**
 * Réinitialise la lecture à la première ligne
 */
function resetPlayback() {
    try {
        // Arrêter la lecture si elle est en cours
        pausePlayback();
        
        // Revenir à la première ligne
        currentRowIndex = 0;
        
        // Mettre à jour l'affichage
        if (jsonData.length > 0) {
            updateDisplay(currentRowIndex);
        }
        
        updateControlButtonsState(true);
    } catch (error) {
        console.error('Erreur lors de la réinitialisation:', error.message);
    }
}

/**
 * Sélectionne automatiquement les équipes en fonction des noms extraits du fichier Excel
 * @param {string} teamAName - Nom de l'équipe A (domicile)
 * @param {string} teamBName - Nom de l'équipe B (visiteur)
 */
function selectTeamsByNames(teamAName, teamBName) {
    console.log(`Tentative de sélection automatique des équipes: ${teamAName} vs ${teamBName}`);
    
    // Vérifier que les données d'équipes sont chargées
    if (!window.teamsData || !Array.isArray(window.teamsData.teams)) {
        console.warn('Données d\'équipes non disponibles pour la sélection automatique');
        return;
    }
    
    const teams = window.teamsData.teams;
    let teamAIndex = -1;
    let teamBIndex = -1;
    
    // Fonction pour calculer la similarité entre deux chaînes (simple)
    function similarity(s1, s2) {
        s1 = s1.toLowerCase().trim();
        s2 = s2.toLowerCase().trim();
        
        // Correspondance exacte
        if (s1 === s2) return 1.0;
        
        // Vérifier si une chaîne contient l'autre
        if (s1.includes(s2) || s2.includes(s1)) return 0.8;
        
        // Vérifier les mots communs
        const words1 = s1.split(/\s+/);
        const words2 = s2.split(/\s+/);
        
        let commonWords = 0;
        for (const w1 of words1) {
            if (w1.length < 3) continue; // Ignorer les mots courts
            for (const w2 of words2) {
                if (w1 === w2) commonWords++;
            }
        }
        
        if (commonWords > 0) {
            return 0.5 + (0.3 * commonWords / Math.max(words1.length, words2.length));
        }
        
        return 0;
    }
    
    // Rechercher les équipes avec la meilleure correspondance
    let bestMatchA = 0;
    let bestMatchB = 0;
    
    teams.forEach((team, index) => {
        const simA = similarity(team.name, teamAName);
        const simB = similarity(team.name, teamBName);
        
        if (simA > bestMatchA) {
            bestMatchA = simA;
            teamAIndex = index;
        }
        
        if (simB > bestMatchB) {
            bestMatchB = simB;
            teamBIndex = index;
        }
    });
    
    // Sélectionner les équipes si une correspondance a été trouvée
    const teamASelect = document.getElementById('team-a-select');
    const teamBSelect = document.getElementById('team-b-select');
    
    if (teamASelect && teamAIndex >= 0 && bestMatchA > 0.3) {
        console.log(`Équipe A sélectionnée: ${teams[teamAIndex].name} (similarité: ${bestMatchA.toFixed(2)})`);
        teamASelect.value = teamAIndex;
        // Déclencher l'événement change pour mettre à jour l'interface
        const event = new Event('change');
        teamASelect.dispatchEvent(event);
    } else {
        console.warn(`Aucune correspondance trouvée pour l'équipe A: ${teamAName}`);
    }
    
    if (teamBSelect && teamBIndex >= 0 && bestMatchB > 0.3) {
        console.log(`Équipe B sélectionnée: ${teams[teamBIndex].name} (similarité: ${bestMatchB.toFixed(2)})`);
        teamBSelect.value = teamBIndex;
        // Déclencher l'événement change pour mettre à jour l'interface
        const event = new Event('change');
        teamBSelect.dispatchEvent(event);
    } else {
        console.warn(`Aucune correspondance trouvée pour l'équipe B: ${teamBName}`);
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    // Charger la configuration des stats
    await loadStatsConfig();
    
    // Écouteur d'événement pour le chargement du fichier Excel
    const excelUpload = document.getElementById('excel-upload');
    if (excelUpload) {
        excelUpload.addEventListener('change', handleFileUpload);
    }
    
    // Écouteurs pour les boutons de contrôle
    setupPlaybackControls();
});

// La fonction handleExcelUpload a été déplacée vers la page excel-converter.html

window.JsonProcessor = {
    handleFileUpload,
    startPlayback,
    pausePlayback,
    resetPlayback,
    updateDisplay,
    updateScoreHighlight,
    computeAndMarkMVP
};
