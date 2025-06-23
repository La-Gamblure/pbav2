/**
 * PBA Excel Processor
 * Avec extraction des noms d'équipes et fallback robuste sur la feuille
 */

/**
 * Charge un workbook ExcelJS à partir d'un File, Blob ou Workbook.
 * @param {Workbook|File|Blob|String} input
 * @returns {Promise<Workbook>}
 */
async function loadWorkbook(input) {
  // ExcelJS doit être chargé via un script dans le HTML
  const ExcelJS = window.ExcelJS;
  if (!ExcelJS) throw new Error("ExcelJS n'est pas chargé dans la page !");
  if (input instanceof ExcelJS.Workbook) return input;

  const workbook = new ExcelJS.Workbook();
  if (input instanceof File || input instanceof Blob) {
    const arrayBuffer = await input.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer);
    return workbook;
  } else {
    throw new Error("Format d'entrée non pris en charge (doit être File, Blob ou Workbook)");
  }
}

/**
 * Extrait les noms des équipes à partir d'un workbook Excel
 * @param {Workbook} workbook - Le workbook Excel
 * @returns {Object} Objet contenant les noms des équipes A et B
 */
function extractTeamNames(workbook) {
  try {
    // Sélection de la feuille
    let worksheet = workbook.getWorksheet(1)
      || workbook.getWorksheet('Sheet1')
      || (Array.isArray(workbook.worksheets) && workbook.worksheets[0]);

    if (!worksheet) {
      throw new Error('Aucune feuille trouvée pour extraire les noms d\'équipes');
    }

    // Extraire les noms d'équipes des cellules A1 et B1
    const teamA = worksheet.getCell('A1').value || "Équipe A";
    const teamB = worksheet.getCell('B1').value || "Équipe B";

    console.log('Noms d\'équipes extraits:', teamA, 'vs', teamB);
    return { teamA, teamB };
  } catch (err) {
    console.error('Erreur lors de l\'extraction des noms d\'équipes:', err);
    // Valeurs par défaut en cas d'erreur
    return { teamA: "Équipe A", teamB: "Équipe B" };
  }
}

/**
 * Transforme un fichier Excel selon les spécifications PBA
 * @param {Workbook|File|Blob|String} input
 * @param {Object} options
 * @returns {Promise<Workbook>}
 */
async function transformExcel(input, options = {}) {
  try {
    const workbook = await loadWorkbook(input);

    // Sélection de la feuille : par index, nom, ou première instance
    let worksheet = workbook.getWorksheet(1)
      || workbook.getWorksheet('Sheet1')
      || (Array.isArray(workbook.worksheets) && workbook.worksheets[0]);

    if (!worksheet) {
      const names = Array.isArray(workbook.worksheets)
        ? workbook.worksheets.map(ws => ws.name)
        : [];
      throw new Error('Aucune feuille trouvée. Feuilles disponibles : ' + names.join(', '));
    }

    console.log('Feuilles disponibles :', workbook.worksheets.map(ws => ws.name));
    console.log('Feuille utilisée :', worksheet.name);

    // Extraire les noms d'équipes avant de nettoyer A1 et B1
    const teamNames = extractTeamNames(workbook);

    // 1) Nettoyer A1:B1 après avoir extrait les noms d'équipes
    worksheet.getCell('A1').value = null;
    worksheet.getCell('B1').value = null;

    // 2) Déplacer A2:G2 → A1:G1
    for (let i = 1; i <= 7; i++) {
      const col = String.fromCharCode(64 + i);
      const v = worksheet.getCell(`${col}2`).value;
      worksheet.getCell(`${col}1`).value = v;
      worksheet.getCell(`${col}2`).value = null;
    }

    // 3) Insérer ligne de début
    ['Q1','12:00','0','Debut du match','','',''].forEach((v, i) => {
      const col = String.fromCharCode(65 + i);
      worksheet.getCell(`${col}2`).value = v;
    });

    // 4) Remplacer "{rien}"
    worksheet.eachRow({ includeEmpty: true }, row => row.eachCell({ includeEmpty: true }, cell => {
      if (cell.value === '{rien}') cell.value = '';
    }));

    // 5) Gérer DF2
    const df = worksheet.getCell('DF2');
    if (df && df.value === 0) df.value = '';

    // 6) Analyser et mapper les colonnes existantes
    console.log('Analyse des colonnes du fichier Excel...');
    
    // Récupérer la première ligne pour analyser les colonnes existantes
    const firstRow = worksheet.getRow(1);
    const existingHeaders = [];
    firstRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      existingHeaders[colNumber - 1] = cell.value || '';
    });
    
    console.log('Colonnes existantes:', existingHeaders.slice(0, 20));
    
    // Définir les colonnes de base (non-stats)
    // Colonnes A-H dans Excel (indices 0-7)
    const baseHeaders = [
      'scoreboard-QT',           // A
      'scoreboard-Temps',        // B
      'scoreboard-Etape',        // C
      'commentaire-Situation',   // D
      'commentaire-Joueur',      // E
      'commentaire-Equipe',      // F
      'Test 2-3 PT',            // G
      'commentaire-Succes'       // H
    ];
    
    // NE PAS ajouter de colonnes de score artificiellement
    // Les colonnes de score doivent être présentes dans le fichier Excel original
    console.log('Recherche des colonnes de score dans le fichier Excel...');
    let hasScoreColumns = false;
    
    // Chercher si des colonnes de score existent déjà
    existingHeaders.forEach((header, idx) => {
      if (header && (header.includes('Score') || header.includes('score'))) {
        console.log(`Colonne de score trouvée: "${header}" à l'index ${idx}`);
        hasScoreColumns = true;
      }
    });
    
    if (!hasScoreColumns) {
      console.log('ATTENTION: Aucune colonne de score trouvée dans le fichier Excel');
      console.log('Les scores ne seront pas affichés dans le scoreboard');
    }
    
    // Définir l'ordre des stats pour chaque joueur
    const statTypes = [
      'Points', '3-Points', 'Rebounds', 'Assist', 'Blocks', 'Steals', 'TurnOvers', 'DD', 'TD', 'Total'
    ];
    
    // Les colonnes FG% sont très loin (DI et après), on les traite séparément
    // Pour l'instant, on ne les ajoute PAS dans statTypes car elles sont trop éloignées
    console.log('Note: Les colonnes FG% (DI-DR) seront traitées séparément si présentes');
    
    // Créer la liste des joueurs
    const playerIds = [];
    for (let t of ['A', 'B']) {
      for (let i = 1; i <= 5; i++) playerIds.push(`${t}${i}`);
    }

    // Construction de la nouvelle ligne d'en-têtes
    const headers = [...baseHeaders];
    for (const pid of playerIds) {
      for (const stat of statTypes) {
        headers.push(`${pid}-${stat}`);
      }
    }
    
    console.log('Nouvel ordre des colonnes:', headers.slice(0, 20), '...');

    // Remplacer l'en-tête avec le nouveau mapping
    const row1 = worksheet.getRow(1);
    headers.forEach((h, idx) => {
      row1.getCell(idx + 1).value = h;
    });
    
    // Mapping spécial pour les colonnes FG% (DI à DR)
    // DI = colonne 113 (index 112)
    const fgStartColumn = 113; // Colonne DI
    let fgIndex = 0;
    
    // Mapper les colonnes FG% pour chaque joueur
    for (const pid of playerIds) {
      const columnIndex = fgStartColumn + fgIndex;
      const cell = row1.getCell(columnIndex);
      cell.value = `${pid}-FG%`;
      console.log(`Mapping FG%: ${pid}-FG% → colonne ${columnIndex} (${String.fromCharCode(64 + Math.floor((columnIndex - 1) / 26)) + String.fromCharCode(65 + ((columnIndex - 1) % 26))})`);
      fgIndex++;
    }
    
    row1.commit();
    
    console.log('Total de colonnes mappées:', headers.length + ' + 10 colonnes FG%');

    // Stocker les noms d'équipes dans le workbook pour les récupérer plus tard
    workbook.teamNames = teamNames;

    console.log('Transformation terminée sur', worksheet.name);
    return workbook;
  } catch (err) {
    console.error('Erreur transformExcel:', err);
    throw err;
  }
}

/**
 * Normalise une chaîne en identifiant CSS safe (remplace espaces, accents, etc.)
 * @param {string} str
 * @returns {string}
 */
function normalizeCssId(str) {
  return String(str)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // retire accents
    .replace(/[^a-zA-Z0-9_-]/g, '_') // caractères non valides → _
    .replace(/^_+|_+$/g, '') // retire _ en début/fin
    .toLowerCase();
}

/**
 * Convertit un workbook en JSON lignes/dictionnaires
 * @param {Workbook} workbook
 * @returns {Array<Object>}
 */
function workbookToJson(workbook) {
  try {
    // Sélection feuille de même manière
    let worksheet = workbook.getWorksheet(1)
      || workbook.getWorksheet('Sheet1')
      || (Array.isArray(workbook.worksheets) && workbook.worksheets[0]);

    if (!worksheet) {
      throw new Error('Aucune feuille pour la conversion JSON');
    }

    // Extraire en-têtes SANS normalisation (on garde la casse et les tirets)
    // Forcer la lecture jusqu'à la colonne DR (122) pour inclure les FG%
    const headers = [];
    const maxColumns = 122; // Jusqu'à la colonne DR
    
    for (let col = 1; col <= maxColumns; col++) {
      const cell = worksheet.getRow(1).getCell(col);
      let h = String(cell.value || '').trim();
      if (!h) h = `Column${col}`;
      headers[col] = h;
    }
    
    console.log(`Headers extraits (${headers.length} colonnes)`);
    console.log('Colonnes FG%:', headers.slice(112, 123)); // DI à DR

    const data = [];
    // Parcourir lignes à partir de la 2
    for (let r = 2; r <= worksheet.rowCount; r++) {
      const row = worksheet.getRow(r);
      const obj = {};
      let has = false;
      
      // Lire toutes les colonnes jusqu'à maxColumns
      for (let col = 1; col <= maxColumns; col++) {
        const key = headers[col];
        if (!key) continue;
        
        const cell = row.getCell(col);
        let val = cell.value;
        
        if (val && val.richText) val = val.richText.map(t => t.text).join('');
        else if (val && val.formula) val = val.result;
        
        obj[key] = val == null ? '' : val;
        if (obj[key] !== '') has = true;
      }
      
      if (has) data.push(obj);
    }

    console.log('Conversion en JSON terminée,', data.length, 'lignes.');
    return data;
  } catch (err) {
    console.error('Erreur workbookToJson:', err);
    throw err;
  }
}

/**
 * Traite un fichier Excel PBA : transformation + conversion en JSON
 * @param {Workbook|File|Blob|String} input
 * @param {Object} options
 * @returns {Promise<Object>} Objet contenant workbook, jsonData et teamNames
 */
async function processExcel(input, options = {}) {
  const workbook = await transformExcel(input, options);
  let jsonData = workbookToJson(workbook);

  // Ajout automatique de la 701ème étape (copie de la dernière)
  if (Array.isArray(jsonData) && jsonData.length > 0) {
    const lastStep = { ...jsonData[jsonData.length - 1] };
    lastStep["scoreboard-Etape"] = 701;
    lastStep["scoreboard-Temps"] = "0:00";
    lastStep["commentaire-Situation"] = "Fin du Match !";
    
    // Effacer les informations de joueur et d'équipe pour éviter l'auto-passe
    lastStep["commentaire-Joueur"] = "";
    lastStep["commentaire-Equipe"] = "";
    lastStep["commentaire-Succes"] = "";
    
    // Conserver les scores et statistiques finales
    jsonData.push(lastStep);
  }

  // Récupérer les noms d'équipes extraits pendant la transformation
  const teamNames = workbook.teamNames || { teamA: "Équipe A", teamB: "Équipe B" };

  return { workbook, jsonData, teamNames };
}

/**
 * Sauvegarde un workbook ExcelJS côté navigateur (retourne un Blob)
 * @param {Workbook} workbook
 * @returns {Promise<Blob>}
 */
async function saveWorkbook(workbook) {
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}

/**
 * Sauvegarde des données JSON côté navigateur (retourne un Blob)
 * @param {Array|Object} jsonData
 * @returns {Blob}
 */
function saveJson(jsonData) {
  const jsonStr = JSON.stringify(jsonData, null, 2);
  return new Blob([jsonStr], { type: 'application/json' });
}

if (typeof window !== 'undefined') {
  window.PBAExcelProcessor = {
    transformExcel,
    workbookToJson,
    processExcel,
    saveWorkbook,
    saveJson,
    extractTeamNames
  };
}
