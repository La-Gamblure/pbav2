/**
 * Utilitaire pour calculer les indices et noms de colonnes Excel
 */

// Fonction pour obtenir le nom de colonne Excel à partir d'un index (1-based)
function getExcelColumnName(columnIndex) {
    let columnName = '';
    let num = columnIndex;
    
    while (num > 0) {
        num--; // Adjust for 0-based calculation
        columnName = String.fromCharCode(65 + (num % 26)) + columnName;
        num = Math.floor(num / 26);
    }
    
    return columnName;
}

// Fonction pour obtenir l'index à partir d'un nom de colonne Excel
function getColumnIndex(columnName) {
    let index = 0;
    for (let i = 0; i < columnName.length; i++) {
        index = index * 26 + (columnName.charCodeAt(i) - 64);
    }
    return index;
}

// Test pour vérifier le mapping FG%
console.log('=== Vérification du mapping des colonnes FG% ===');
console.log('DI =', getColumnIndex('DI'), '(devrait être 113)');

// Afficher le mapping complet
const players = ['A1', 'A2', 'A3', 'A4', 'A5', 'B1', 'B2', 'B3', 'B4', 'B5'];
let currentColumn = 113; // DI

console.log('\nMapping FG% pour chaque joueur:');
players.forEach(player => {
    console.log(`${player}-FG% → Colonne ${currentColumn} (${getExcelColumnName(currentColumn)})`);
    currentColumn++;
});

console.log('\n=== Mapping complet des stats pour A1 ===');
const statsMapping = {
    'Points': 'I',
    '3-Points': 'J', 
    'Rebounds': 'K',
    'Assist': 'L',
    'Blocks': 'M',
    'Steals': 'N',
    'TurnOvers': 'O',
    'DD': 'P',
    'TD': 'Q',
    'Total': 'R',
    'FG%': 'DI'
};

for (const [stat, col] of Object.entries(statsMapping)) {
    console.log(`A1-${stat} → Colonne ${col} (index ${getColumnIndex(col)})`);
}