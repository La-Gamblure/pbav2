/**
 * Main.js - Gestion des équipes et des joueurs pour le lecteur PBA
 */

// Variables globales
let teamNames = []; // Liste des noms d'équipes
let teamLogos = []; // Liste des logos d'équipes
let teamPlayers = []; // Liste des joueurs par équipe
let teamsData = {}; // Données complètes des équipes

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    // Chargement des données des équipes depuis le fichier JSON
    loadTeamsData();
    
    // Écouteurs d'événements pour les sélecteurs d'équipes
    document.getElementById('team-a-select').addEventListener('change', updateTeamA);
    document.getElementById('team-b-select').addEventListener('change', updateTeamB);
    
    // Réinitialiser l'affichage au démarrage
    initializeDisplay();
});

/**
 * Applique les couleurs d'équipe au scoreboard et aux tableaux de stats
 * @param {string} team - 'A' ou 'B' pour identifier l'équipe
 * @param {number} teamIndex - Index de l'équipe dans teamsData
 */
function applyTeamColors(team, teamIndex) {
    // Vérifier que les données d'équipe sont chargées
    if (!teamsData || !teamsData.teams || teamIndex < 0 || teamIndex >= teamsData.teams.length) {
        console.warn('Données d\'équipe non disponibles pour', team, teamIndex);
        return;
    }
    
    // Récupérer toutes les couleurs de l'équipe
    const primaryColor = teamsData.teams[teamIndex].primaryColor;
    const secondaryColor = teamsData.teams[teamIndex].secondaryColor;
    const tertiaryColor = teamsData.teams[teamIndex].tertiaryColor || '#000000'; // Valeur par défaut si non définie
    
    // Définir les variables CSS pour les couleurs (bg et primary identiques)
    document.documentElement.style.setProperty(`--team-${team.toLowerCase()}-primary`, primaryColor);
    document.documentElement.style.setProperty(`--team-${team.toLowerCase()}-bg`, primaryColor); // Même valeur que primary
    document.documentElement.style.setProperty(`--team-${team.toLowerCase()}-secondary`, secondaryColor);
    document.documentElement.style.setProperty(`--team-${team.toLowerCase()}-tertiary`, tertiaryColor);
    document.documentElement.style.setProperty(`--team-${team.toLowerCase()}-text`, secondaryColor); // Texte = couleur secondaire

    // Mettre à jour les bandeaux latéraux du scoreboard
    if (team.toLowerCase() === 'a') {
        const scoreboardBefore = document.querySelector('.scoreboard::before');
        if (scoreboardBefore) {
            scoreboardBefore.style.backgroundColor = primaryColor;
            scoreboardBefore.style.borderRightColor = secondaryColor;
        }
    } else {
        const scoreboardAfter = document.querySelector('.scoreboard::after');
        if (scoreboardAfter) {
            scoreboardAfter.style.backgroundColor = primaryColor;
            scoreboardAfter.style.borderLeftColor = secondaryColor;
        }
    }

    // Mettre à jour les team-labels
    const teamLabels = document.querySelectorAll(`.team-${team.toLowerCase()} .team-label`);
    teamLabels.forEach(label => {
        label.style.backgroundColor = primaryColor;
        label.style.borderColor = secondaryColor;
        label.style.color = secondaryColor;
    });

    // Mettre à jour les cellules avec ID spécifiques
    const teamPrefix = team.toUpperCase();
    const idCells = document.querySelectorAll(`td[id^="${teamPrefix}"]`);
    idCells.forEach(cell => {
        cell.style.backgroundColor = primaryColor;
        cell.style.color = secondaryColor;
    });

    // Mettre à jour les lignes et cellules directement
    const teamRows = document.querySelectorAll(`.team-${team.toLowerCase()}`);
    
    // Appliquer les styles de base pour toutes les équipes
    teamRows.forEach(row => {
        if (row.tagName === 'TR') {
            // Pour les lignes, appliquer le style à chaque cellule enfant
            Array.from(row.children).forEach(cell => {
                if (!cell.classList.contains('team-label')) {
                    cell.style.backgroundColor = primaryColor;
                    cell.style.color = secondaryColor;
                }
            });
        } else {
            // Pour les autres éléments avec classe team-a/team-b
            row.style.backgroundColor = primaryColor;
            row.style.color = secondaryColor;
        }
    });
    
    // Log des couleurs appliquées pour débogage
    console.log(`Couleurs appliquées pour l'équipe ${team} (${teamsData.teams[teamIndex].name}):`, {
        index: teamIndex,
        primary: primaryColor,
        secondary: secondaryColor,
        tertiary: tertiaryColor
    });
}

// Fonction pour charger les données des équipes depuis teams.json
function loadTeamsData() {
    console.log('===== Début du chargement des données des équipes =====');
    console.log('Appel de loadTeamsData à', new Date().toLocaleTimeString());
    
    // Nettoyer les tableaux existants avant de charger de nouvelles données
    teamNames = [];
    teamLogos = [];
    teamPlayers = [];
    
    // Forcer le rechargement complet sans utiliser le cache
    fetch('teams.json', {
        method: 'GET',
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Réponse HTTP non valide: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data || !Array.isArray(data.teams)) {
                throw new Error('Format JSON invalide: les équipes sont absentes ou mal formatées');
            }
            
            // Stocker les données pour un accès global
            teamsData = data;
            window.teamsData = data; // Rendu disponible globalement
            
            const teamASelect = document.getElementById('team-a-select');
            const teamBSelect = document.getElementById('team-b-select');
            
            // Vérifier que les sélecteurs existent
            if (!teamASelect || !teamBSelect) {
                console.error('Sélecteurs d\'équipe introuvables dans le DOM');
                return;
            }
            
            // Vider les sélecteurs
            teamASelect.innerHTML = '<option value="">Équipe domicile</option>';
            teamBSelect.innerHTML = '<option value="">Équipe visiteur</option>';
            
            // Imprimer le nombre total d'équipes chargées
            console.log(`Nombre total d'équipes dans le JSON: ${data.teams.length}`);
            
            // Traiter les données des équipes
            data.teams.forEach((team, index) => {
                console.log(`Vérification de l'équipe [${index}]: ${team.name || 'Nom manquant'}, logo: ${team.logo || 'Logo manquant'}, joueurs: ${(Array.isArray(team.players) ? team.players.length : 'non')}`);
                
                // Vérifier que les données nécessaires sont présentes
                if (!team.name || !team.logo || !Array.isArray(team.players)) {
                    console.warn(`Données manquantes pour l'équipe à l'index ${index}`);
                    return; // Sauter cette équipe
                }
                
                // Ajouter aux tableaux pour un accès facile
                teamNames.push(team.name);
                teamLogos.push(team.logo);
                teamPlayers.push(team.players);
                
                // Ajouter aux sélecteurs
                const optionA = document.createElement('option');
                optionA.value = index; // Index comme valeur
                optionA.textContent = team.name;
                teamASelect.appendChild(optionA);
                
                const optionB = document.createElement('option');
                optionB.value = index;
                optionB.textContent = team.name;
                teamBSelect.appendChild(optionB);
            });
            
            console.log(`Chargement de ${teamNames.length} équipes terminé avec succès`); 
            
            // Vérifier le contenu des menus déroulants
            console.log(`Menu équipe A: ${teamASelect.options.length} options`);
            console.log(`Menu équipe B: ${teamBSelect.options.length} options`);
            
            // Lister toutes les options dans les menus déroulants
            console.log('Options du menu équipe A:');
            Array.from(teamASelect.options).forEach((option, idx) => console.log(`  ${idx}: ${option.value} - ${option.textContent}`));
            
            console.log('Options du menu équipe B:');
            Array.from(teamBSelect.options).forEach((option, idx) => console.log(`  ${idx}: ${option.value} - ${option.textContent}`));
            
            // Présélectionner les équipes par défaut si aucune n'est sélectionnée
            if (teamASelect.value === "" && teamNames.length > 0) {
                teamASelect.value = "0";
                updateTeamA();
            }
            
            if (teamBSelect.value === "" && teamNames.length > 1) {
                teamBSelect.value = "1";
                updateTeamB();
            }
        })
        .catch(error => {
            console.error('Erreur lors du chargement des équipes:', error);
            // Utiliser des données par défaut en cas d'erreur
            useFallbackTeamData();
        });
}

// Utiliser des données d'équipes par défaut en cas d'erreur
function useFallbackTeamData() {
    console.warn('Utilisation des données d\'équipes par défaut');
    
    // Réinitialiser les données
    teamNames = [];
    teamLogos = [];
    teamPlayers = [];
    
    // Définir des équipes par défaut
    const defaultTeams = [
        {
            name: "Gaus Spurs",
            logo: "gaus-spurs-logo.png",
            players: ["ElBoully", "SangoRiley", "Pic", "Simoul", "Ellie"]
        },
        {
            name: "Ocean Demons",
            logo: "ocean-demons-logo.png",
            players: ["BuzzerBeater", "PetiteJuju", "ShaadowStorme", "Locksyn", "Wayk00"]
        }
    ];
    
    const teamASelect = document.getElementById('team-a-select');
    const teamBSelect = document.getElementById('team-b-select');
    
    // Vider les sélecteurs
    teamASelect.innerHTML = '<option value="">Équipe domicile</option>';
    teamBSelect.innerHTML = '<option value="">Équipe visiteur</option>';
    
    // Ajouter les équipes par défaut
    defaultTeams.forEach((team, index) => {
        teamNames.push(team.name);
        teamLogos.push(team.logo);
        teamPlayers.push(team.players);
        
        // Ajouter aux sélecteurs
        const optionA = document.createElement('option');
        optionA.value = index; // Index comme valeur
        optionA.textContent = team.name;
        teamASelect.appendChild(optionA);
        
        const optionB = document.createElement('option');
        optionB.value = index;
        optionB.textContent = team.name;
        teamBSelect.appendChild(optionB);
    });
    
    // Présélectionner les équipes par défaut
    teamASelect.value = "0";
    teamBSelect.value = "1";
    
    // Mettre à jour l'affichage
    updateTeamA();
    updateTeamB();
}

// Mise à jour de l'équipe A (domicile)
function updateTeamA() {
    const teamASelect = document.getElementById('team-a-select');
    const selectedTeamIndex = parseInt(teamASelect.value);
        
    if (selectedTeamIndex >= 0 && selectedTeamIndex < teamNames.length) {
        // Appliquer les couleurs de l'équipe sélectionnée pour l'équipe A
        applyTeamColors('A', selectedTeamIndex);
        
        // Mise à jour du logo
        const teamALogo = document.getElementById('team-a-logo');
        teamALogo.src = `teams-logo/${teamLogos[selectedTeamIndex]}`;
        teamALogo.alt = `${teamNames[selectedTeamIndex]} Logo`;
            
        // Mise à jour des cellules d'étiquette d'équipe
        const teamALabels = document.querySelectorAll('.team-a .team-label');
        teamALabels.forEach(label => {
            // Vérifier si le label a déjà une image logo
            let existingLogo = label.querySelector('img');
            if (!existingLogo) {
                // Créer une nouvelle image si aucune n'existe
                existingLogo = document.createElement('img');
                existingLogo.classList.add('team-logo-small');
                label.innerHTML = ''; // Supprimer le texte existant
                label.appendChild(existingLogo);
            }
            
            // Mettre à jour l'image logo
            existingLogo.src = `teams-logo/${teamLogos[selectedTeamIndex]}`;
            existingLogo.alt = teamNames[selectedTeamIndex];
            existingLogo.title = teamNames[selectedTeamIndex];
        });
        
        // Récupérer les lignes de l'équipe A
        const teamARows = document.querySelectorAll('.team-a');
        const players = teamPlayers[selectedTeamIndex] || [];
        console.log('Nombre de lignes équipe A:', teamARows.length);
        
        // Assurons-nous que nous avons 5 joueurs, en ajoutant des vides si nécessaire
        const paddedPlayers = [...players];
        while (paddedPlayers.length < 5) {
            paddedPlayers.push('Joueur ' + (paddedPlayers.length + 1));
        }
        
        // On s'assure de récupérer toutes les cellules de noms de joueurs
        const playerNameCells = document.querySelectorAll('.team-a .player-name');
        console.log('Nombre de cellules de noms pour équipe A:', playerNameCells.length);
        
        // Pour chaque cellule de nom de joueur
        for (let i = 0; i < playerNameCells.length; i++) {
            // Assigner le bon joueur en fonction de la position
            if (i < paddedPlayers.length) {
                playerNameCells[i].textContent = paddedPlayers[i];
                console.log(`Joueur A${i+1} mis à jour:`, paddedPlayers[i]);
            } else {
                playerNameCells[i].textContent = `Joueur ${i+1}`;
                console.log(`Joueur A${i+1} par défaut:`, playerNameCells[i].textContent);
            }
        }
    } else {
        console.warn('Index d\'équipe A invalide ou non sélectionné:', teamIndex);
    }
}

// Mise à jour de l'équipe B (visiteur)
function updateTeamB() {
    const selectElement = document.getElementById('team-b-select');
    const teamIndex = parseInt(selectElement.value);
    
    if (!isNaN(teamIndex) && teamIndex >= 0) {
        // Appliquer les couleurs de l'équipe sélectionnée pour l'équipe B
        applyTeamColors('B', teamIndex);
        
        console.log(`Mise à jour de l'équipe B avec l'index ${teamIndex}:`, teamNames[teamIndex]);
        
        // Mettre à jour le logo avec le chemin complet
        const logoPath = `teams-logo/${teamLogos[teamIndex]}`;
        const logoImg = document.getElementById('team-b-logo');
        if (logoImg) {
            logoImg.src = logoPath;
            logoImg.alt = `${teamNames[teamIndex]} Logo`;
            console.log('Logo équipe B mis à jour:', logoPath);
        } else {
            console.error('Élément logo équipe B introuvable dans le DOM');
        }
        
        // Mettre à jour le libellé d'équipe dans le tableau des stats avec le logo
        // Maintenant il n'y a qu'une seule cellule d'étiquette d'équipe pour l'équipe B
        const teamBLabel = document.querySelector('.team-b .team-label');
        if (teamBLabel) {
            // Créer l'image du logo
            const logoPath = `teams-logo/${teamLogos[teamIndex]}`;
            teamBLabel.innerHTML = ''; // Vider la cellule
            const logoImg = document.createElement('img');
            logoImg.src = logoPath;
            logoImg.alt = teamNames[teamIndex];
            logoImg.title = teamNames[teamIndex]; // Ajouter un tooltip
            logoImg.className = 'team-logo-small';
            teamBLabel.appendChild(logoImg);
        }
        
        // Appliquer les couleurs de l'équipe B au scoreboard et à la table de stats
        applyTeamColors('b', teamIndex);
        
        // Mettre à jour les noms des joueurs pour l'équipe B
        const teamBRows = document.querySelectorAll('.team-b');
        const players = teamPlayers[teamIndex];
        
        console.log('Joueurs équipe B:', players);
        console.log('Nombre de lignes équipe B:', teamBRows.length);
        
        // Assurons-nous que nous avons 5 joueurs, en ajoutant des vides si nécessaire
        const paddedPlayers = [...players];
        while (paddedPlayers.length < 5) {
            paddedPlayers.push('Joueur ' + (paddedPlayers.length + 1));
        }
        
        // On s'assure de récupérer toutes les cellules de noms de joueurs
        const playerNameCells = document.querySelectorAll('.team-b .player-name');
        console.log('Nombre de cellules de noms pour équipe B:', playerNameCells.length);
        
        // Pour chaque cellule de nom de joueur
        for (let i = 0; i < playerNameCells.length; i++) {
            // Assigner le bon joueur en fonction de la position
            if (i < paddedPlayers.length) {
                playerNameCells[i].textContent = paddedPlayers[i];
                console.log(`Joueur B${i+1} mis à jour:`, paddedPlayers[i]);
            } else {
                playerNameCells[i].textContent = `Joueur ${i+1}`;
                console.log(`Joueur B${i+1} par défaut:`, playerNameCells[i].textContent);
            }
        }
    } else {
        console.warn('Index d\'équipe B invalide ou non sélectionné:', teamIndex);
    }
}

/**
 * Initialisation de l'affichage
 * Réinitialise tous les éléments d'affichage (scoreboard, commentaires, statistiques)
 */
function initializeDisplay() {
    // Réinitialiser le scoreboard
    document.getElementById('quarter').textContent = 'Q1';
    document.getElementById('timer').textContent = '12:00';
    document.getElementById('team-a-score').textContent = '0';
    document.getElementById('team-b-score').textContent = '0';
    
    // Réinitialiser les commentaires
    const actionElement = document.querySelector('.current-action');
    if (actionElement) {
        actionElement.innerHTML = `
            <span class="action-player">-</span>
            <span class="action-type">Début du match</span>
            <span class="action-result">-</span>
        `;
    }
    
    // Réinitialiser les stats (toutes les cellules à 0 sauf les noms)
    const statCells = document.querySelectorAll('.stats-table tr:not(.stats-row) td:not(.team-label):not(.player-name)');
    statCells.forEach(cell => {
        cell.textContent = '0';
        cell.classList.remove('active'); // Force le style neutre sur TO/DD/TD
    });
}

