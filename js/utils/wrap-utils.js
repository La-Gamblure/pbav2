/* wrap-utils.js
 * Utilitaires pour l'encapsulation des noms de joueurs dans les commentaires
 */

// Fonction importée depuis commentary-generator.js pour éviter la redondance
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Enrobe le nom du joueur dans un <span> avec style selon l'équipe
 * @param {string} name
 * @param {string} teamCode 'A' ou 'B'
 * @returns {string}
 */
function wrapPlayer(name, teamCode) {
  if (!name) return '';
  
  return `<span class="comment-player team-${teamCode}">${name}</span>`;
}

/**
 * Enrobe les noms de joueurs dans un HTML, en évitant les doubles encapsulations
 * @param {string} html - HTML à traiter
 * @param {Array<{name: string, team: string}>} names - Liste de noms à encapsuler avec leur équipe
 * @returns {string} - HTML avec les noms encapsulés
 */
function wrapNamesOnce(html, names) {
  // Filtrer les noms vides et trier par longueur décroissante pour éviter les problèmes de sous-chaînes
  names
    .filter(n => !!n.name)
    .sort((a, b) => b.name.length - a.name.length)
    .forEach(({ name, team }) => {
      // La negative-lookahead (?![^<]*data-wrapped) empêche de matcher à l'intérieur d'un span déjà traité
      const re = new RegExp(`\\b${escapeRegExp(name)}\\b(?![^<]*data-wrapped)`, 'g');
      html = html.replace(re, wrapPlayer(name, team).replace('>', ' data-wrapped="1">'));
    });
  return html;
}

// Exporter les fonctions pour les rendre disponibles ailleurs
window.wrapNamesOnce = wrapNamesOnce;
window.wrapPlayer = wrapPlayer; // Pour compatibilité avec l'existant
