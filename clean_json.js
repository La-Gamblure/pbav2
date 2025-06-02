/**
 * Script pour nettoyer le fichier JSON en supprimant les entrées vides
 * Ce script utilise le module pba_excel_processor.js modifié
 */

// Importer les modules nécessaires
const fs = require('fs');
const path = require('path');

// Charger le module PBA Excel Processor
const PBAExcelProcessor = require('./pba_excel_processor.js');

// Fonction principale
async function cleanJson() {
  try {
    console.log('Lecture du fichier JSON existant...');
    const jsonFile = path.join(__dirname, 'Data-PBA (2).json');
    
    // Lire le fichier JSON pour obtenir les données
    const jsonData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    console.log(`Fichier JSON lu avec succès. Il contient ${jsonData.length} entrées.`);
    
    // Filtrer les entrées pour ne garder que celles qui ont du contenu significatif
    const filteredData = jsonData.filter(entry => {
      // Vérifier si au moins une propriété significative a une valeur
      const significantKeys = ['scoreboard-QT', 'scoreboard-Temps', 'commentaire-Situation', 'commentaire-Joueur'];
      
      for (const key of significantKeys) {
        if (entry[key] && entry[key] !== '') {
          return true; // Garder cette entrée
        }
      }
      
      // Vérifier également les statistiques des joueurs
      for (const key in entry) {
        if (
          (key.startsWith('A') || key.startsWith('B')) && 
          entry[key] !== undefined && 
          entry[key] !== null && 
          entry[key] !== ''
        ) {
          return true; // Garder cette entrée
        }
      }
      
      return false; // Entrée vide, filtrer
    });
    
    console.log(`Après filtrage, il reste ${filteredData.length} entrées.`);
    
    // Écrire le fichier JSON nettoyé
    const outputFile = path.join(__dirname, 'Data-PBA-clean.json');
    fs.writeFileSync(outputFile, JSON.stringify(filteredData, null, 2));
    
    console.log(`Fichier JSON nettoyé écrit avec succès: ${outputFile}`);
  } catch (error) {
    console.error('Erreur lors du nettoyage du fichier JSON:', error);
  }
}

// Exécuter la fonction principale
cleanJson();
