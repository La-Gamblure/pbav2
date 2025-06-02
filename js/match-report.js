
// Ce module construit dynamiquement un rapport HTML détaillé à partir des données du match
// Le rapport inclut toutes les stats demandées et un graphique multi-joueurs avec Chart.js

// Fonction principale à appeler à la fin du match
defineMatchReport = function(matchData, players, teams) {
    // matchData: tableau d'actions (baglines)
    // players: liste des joueurs (id, nom, équipe)
    // teams: infos équipes (nom, couleur, logo)
    // Retourne une string HTML complète

    // 1. Initialisation des structures de stats
    const playerStats = {};
    players.forEach(p => {
        playerStats[p.id] = {
            nom: p.nom,
            equipe: p.equipe,
            stats: {
                total: initStats(),
                Q1: initStats(),
                Q2: initStats(),
                Q3: initStats(),
                Q4: initStats()
            },
            evolution: [] // pour le graphique
        };
    });

    // 2. Parcours des actions pour remplir les stats
    matchData.forEach((evt, idx) => {
        const q = evt['scoreboard-QT'] || 'Q1';
        const joueurId = evt['commentaire-Joueur-Id'];
        if (!playerStats[joueurId]) return;
        const pstat = playerStats[joueurId];
        // Shoots
        if (evt['commentaire-Situation'] === 'Shoot') {
            const is3pt = (evt['Test 2-3 PT']||'').toUpperCase().includes('3PT');
            pstat.stats[q].shots_attempted++;
            pstat.stats.total.shots_attempted++;
            if (evt['commentaire-Succes'] === 'Succès') {
                if (is3pt) {
                    pstat.stats[q].shots_3pt_made++;
                    pstat.stats[q].shots_3pt_attempted++;
                    pstat.stats.total.shots_3pt_made++;
                    pstat.stats.total.shots_3pt_attempted++;
                } else {
                    pstat.stats[q].shots_2pt_made++;
                    pstat.stats[q].shots_2pt_attempted++;
                    pstat.stats.total.shots_2pt_made++;
                    pstat.stats.total.shots_2pt_attempted++;
                }
                pstat.stats[q].shots_made++;
                pstat.stats.total.shots_made++;
            } else {
                if (is3pt) {
                    pstat.stats[q].shots_3pt_attempted++;
                    pstat.stats.total.shots_3pt_attempted++;
                } else {
                    pstat.stats[q].shots_2pt_attempted++;
                    pstat.stats.total.shots_2pt_attempted++;
                }
            }
        }
        // Fantasy stats (rebonds, assists, blocks, steals)
        // On suppose que les totaux sont dans evt['A1-Total'], evt['A1-Rebounds'], etc.
        // Ces stats sont mises à jour à chaque ligne, donc on prend le max à la fin du match
        // Pour le graphique d'évolution fantasy
        pstat.evolution.push({
            step: idx,
            fantasy: parseFloat(evt[pstat.equipe+'1-Total']) || 0
        });
    });

    // 3. Génération du HTML
    let html = '<html><head><title>Rapport de match</title><script src="https://cdn.jsdelivr.net/npm/chart.js"></script>';
    html += '<style>body{font-family:sans-serif;}table{border-collapse:collapse;}th,td{padding:0.4em 0.8em;}th{background:#eee;}tr:nth-child(even){background:#f9f9f9;}h2{margin-top:2em;}canvas{max-width:100%;}</style>';
    html += '</head><body>';
    html += '<h1>Rapport de match détaillé</h1>';
    html += '<h2>Stats par joueur</h2>';
    html += '<table border="1"><tr><th>Joueur</th><th>Équipe</th><th>2pts (R/T/% succès)</th><th>3pts (R/T/% succès)</th><th>Total (R/T/% succès)</th></tr>';
    players.forEach(p => {
        const s = playerStats[p.id].stats.total;
        html += `<tr><td>${p.nom}</td><td>${teams[p.equipe]?.nom||p.equipe}</td>`;
        html += `<td>${s.shots_2pt_made}/${s.shots_2pt_attempted} (${percent(s.shots_2pt_made,s.shots_2pt_attempted)})</td>`;
        html += `<td>${s.shots_3pt_made}/${s.shots_3pt_attempted} (${percent(s.shots_3pt_made,s.shots_3pt_attempted)})</td>`;
        html += `<td>${s.shots_made}/${s.shots_attempted} (${percent(s.shots_made,s.shots_attempted)})</td></tr>`;
    });
    html += '</table>';
    // TODO: Ajouter stats fantasy, stats par quart, etc.
    html += '<h2>Évolution du score fantasy</h2>';
    html += '<canvas id="chart"></canvas>';
    html += '<script>(' + chartScript.toString() + ')(window.playerStats)</script>';
    html += '</body></html>';
    return html;
};

function initStats() {
    return {
        shots_2pt_made: 0,
        shots_2pt_attempted: 0,
        shots_3pt_made: 0,
        shots_3pt_attempted: 0,
        shots_made: 0,
        shots_attempted: 0
    };
}

function percent(made, attempted) {
    if (!attempted) return '0%';
    return Math.round(100*made/attempted) + '%';
}

// Script pour Chart.js (généré dynamiquement)
function chartScript(playerStats) {
    const ctx = document.getElementById('chart').getContext('2d');
    const labels = [];
    const datasets = [];
    // Générer les labels (étapes)
    const maxSteps = Math.max(...Object.values(playerStats).map(ps=>ps.evolution.length));
    for(let i=0;i<maxSteps;i++) labels.push('Action '+(i+1));
    // Générer les datasets (une ligne par joueur)
    Object.values(playerStats).forEach(ps => {
        datasets.push({
            label: ps.nom,
            data: ps.evolution.map(e=>e.fantasy),
            fill: false,
            borderColor: randomColor(),
            tension: 0.2
        });
    });
    new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: { responsive:true, plugins:{legend:{display:true}} }
    });
    function randomColor() {
        return 'hsl('+(Math.random()*360|0)+',70%,55%)';
    }
}

// Export global
window.defineMatchReport = defineMatchReport;
