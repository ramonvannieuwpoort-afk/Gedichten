// Gedichten – Apps Script
// Versie 18: kaartjes bij de briefjes (kaart, extra, stickers), reacties, bonnen inwisselen en de bewaardoos.
// Versie 17: samen lezen (wie heeft welk deel gelezen, lievelingsregels). Eerder: meerdere reeksen, reeksen met gedeelde voortgang, inspringen bewaard, alles in één keer ophalen (sneller), plus briefjes, vaste nummers, reacties en favorieten.

const SHEET_NAME = 'Aantekeningen';

// Het tabblad met de gedichten (gid=0, het eerste tabblad).
const POEMS_SHEET_GID = 0;

// Kolommen in het tabblad Aantekeningen (1 = A).
const NOTE_COL = {
  gedicht: 1,      // A  titel van het gedicht (leesbaar voor jullie)
  passage: 2,      // B
  aantekening: 3,  // C
  datum: 4,        // D
  persoon: 5,      // E
  id: 6,           // F  vast nummer van de aantekening
  gedichtId: 7,    // G  vast nummer van het gedicht
  antwoordOp: 8    // H  ID van de aantekening waarop dit een reactie is
};
const NOTE_COLUMNS = 8;
const NOTE_HEADERS = ['Gedicht', 'Passage', 'Aantekening', 'Datum', 'Persoon', 'ID', 'GedichtID', 'AntwoordOp'];


// ---------- Ophalen (GET) ----------

function doGet(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    const readActions = ['poems', 'allnotes', 'poemcheck', 'briefjes', 'reeksstand'];

    // Lezen kan alleen met de juiste toegangscode.
    if (readActions.includes(params.action)) {
      const callback = String(params.callback || '');
      if (!/^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(callback)) {
        return textResponse('Ongeldige callback.');
      }
      if (!isValidToken(params.token)) {
        return jsonpResponse(callback, { success: false, error: 'Ongeldige toegangscode.' });
      }
      try {
        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        if (params.action === 'poems' && params.ook === 'alles') {
          // Gedichten, aantekeningen en briefjes in één antwoord: scheelt twee keer wachten.
          // (Een oudere site vraagt zonder 'ook' en krijgt gewoon alleen de gedichten.)
          const poems = getPoems(spreadsheet);
          const notes = getAllNotes(spreadsheet);
          const briefjes = getBriefjes(spreadsheet);
          return jsonpResponse(callback, { success: true, poems: poems.poems, notes: notes.notes, briefjes: briefjes.briefjes, nu: briefjes.nu, reeksStand: getReeksStand(), reeksLezen: getReeksLezen() });
        }
        if (params.action === 'reeksstand') return jsonpResponse(callback, { success: true, reeksStand: getReeksStand(), reeksLezen: getReeksLezen() });
        if (params.action === 'poems') return jsonpResponse(callback, getPoems(spreadsheet));
        if (params.action === 'briefjes') return jsonpResponse(callback, getBriefjes(spreadsheet));
        if (params.action === 'allnotes') return jsonpResponse(callback, getAllNotes(spreadsheet));
        return jsonpResponse(callback, checkPoem(spreadsheet, params));
      } catch (error) {
        return jsonpResponse(callback, { success: false, error: error.message });
      }
    }

    // Zonder actie: verbindingstest.
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) {
      return textResponse('FOUT: Geen actieve spreadsheet gevonden.');
    }
    const secretToken = PropertiesService.getScriptProperties().getProperty('SECRET_TOKEN');
    const namen = spreadsheet.getSheets().map(sheet => '[' + sheet.getName() + ']');
    let resultaat =
      'Spreadsheet: ' + spreadsheet.getName() +
      '\nSpreadsheet-ID: ' + spreadsheet.getId() +
      '\nGevonden tabbladen: ' + namen.join(', ');
    if (!secretToken) {
      resultaat += '\nFOUT: SECRET_TOKEN ontbreekt.';
    } else if (!spreadsheet.getSheetByName(SHEET_NAME)) {
      resultaat += '\nFOUT: Tabblad ' + SHEET_NAME + ' niet gevonden.';
    } else {
      resultaat += '\nVERBINDING OK - Spreadsheet, toegangscode en tabblad gevonden.';
    }
    return textResponse(resultaat);

  } catch (error) {
    return textResponse('FOUT: ' + error.message);
  }
}


function getPoems(spreadsheet) {
  ensureIds(spreadsheet);
  const sheet = getPoemsSheet(spreadsheet);
  const headers = readHeaders(sheet);
  const col = names => headers.findIndex(h => names.includes(h));
  const idCol = col(['id']);
  const titelCol = col(['titel', 'title']);
  const dichterCol = col(['dichter', 'auteur', 'author']);
  const gedichtCol = col(['gedicht', 'tekst', 'poem']);
  const doorCol = col(['toegevoegd door']);
  const opCol = col(['toegevoegd op']);
  const favCol = col(['favoriet']);
  const lastRow = sheet.getLastRow();

  if (gedichtCol === -1 || lastRow < 2) {
    return { success: true, poems: [] };
  }

  const cell = (row, index) => index === -1 ? '' : asText(row[index]);
  const poems = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues()
    .map(row => ({
      id: cell(row, idCol),
      titel: cell(row, titelCol),
      dichter: cell(row, dichterCol),
      gedicht: cell(row, gedichtCol),
      toegevoegdDoor: cell(row, doorCol),
      toegevoegdOp: cell(row, opCol),
      favoriet: isYes(favCol === -1 ? '' : row[favCol])
    }))
    .filter(poem => poem.gedicht.trim());

  return { success: true, poems: poems };
}


function getAllNotes(spreadsheet) {
  ensureIds(spreadsheet);
  const sheet = getNotesSheet(spreadsheet);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return { success: true, notes: [] };
  }
  const notes = sheet.getRange(2, 1, lastRow - 1, NOTE_COLUMNS).getValues()
    .map(row => ({
      id: asText(row[NOTE_COL.id - 1]),
      gedichtId: asText(row[NOTE_COL.gedichtId - 1]),
      antwoordOp: asText(row[NOTE_COL.antwoordOp - 1]),
      gedicht: asText(row[NOTE_COL.gedicht - 1]),
      passage: asText(row[NOTE_COL.passage - 1]),
      aantekening: asText(row[NOTE_COL.aantekening - 1]),
      datum: asText(row[NOTE_COL.datum - 1]),
      persoon: asText(row[NOTE_COL.persoon - 1])
    }))
    .filter(note => note.id && note.aantekening);
  return { success: true, notes: notes };
}


// Wordt door de site gebruikt om te controleren of een nieuw gedicht is aangekomen.
function checkPoem(spreadsheet, params) {
  const sheet = getPoemsSheet(spreadsheet);
  const exists = poemTitleExists(sheet, readHeaders(sheet), String(params.titel || ''));
  return { success: true, exists: exists };
}


// ---------- Opslaan (POST) ----------

function doPost(e) {
  try {
    if (!e || !e.parameter) {
      throw new Error('Geen gegevens ontvangen.');
    }

    const data = e.parameter;
    const action = String(data.action || 'create').trim();
    const persoon = String(data.persoon || '').trim();

    if (!isValidToken(data.token)) {
      throw new Error('Ongeldige toegangscode.');
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) {
      throw new Error('Geen actieve spreadsheet gevonden.');
    }

    // Briefjes: ophangen, verplaatsen, lezen, afpellen.
    if (action.indexOf('briefje_') === 0) {
      return withLock(() => briefjeAction(spreadsheet, data, action, persoon));
    }

    // Reeks (bijv. Song of Myself): waar jullie zijn, gedeeld tussen alle apparaten.
    if (action === 'reeks_stand') {
      return withLock(() => setReeksStand(data));
    }
    if (action === 'reeks_lees') {
      return withLock(() => setReeksLezen(data));
    }

    // Favorieten zijn van jullie samen: daar is geen naam voor nodig.
    if (action === 'favorite') {
      return withLock(() => setFavorite(spreadsheet, data));
    }

    if (persoon !== 'Sanne' && persoon !== 'Ramon') {
      throw new Error('Ongeldige naam. Kies Sanne of Ramon.');
    }

    if (action === 'addpoem') return withLock(() => addPoem(spreadsheet, data, persoon));
    if (action === 'create') return withLock(() => createNote(spreadsheet, data, persoon));
    if (action === 'update' || action === 'delete') {
      return withLock(() => changeOrDeleteNote(spreadsheet, data, action, persoon));
    }

    throw new Error('Onbekende actie.');

  } catch (error) {
    console.error(error);
    return jsonResponse({ success: false, error: error.message });
  }
}


function createNote(spreadsheet, data, persoon) {
  ensureIds(spreadsheet);
  const sheet = getNotesSheet(spreadsheet);
  const gedichtId = String(data.gedichtId || '').trim();
  const aantekening = String(data.aantekening || '').trim();
  const antwoordOp = String(data.antwoordOp || '').trim();
  let gedicht = String(data.gedicht || '').trim();
  let passage = String(data.passage || '').trim();

  if (!aantekening) throw new Error('Schrijf eerst een aantekening.');
  if (aantekening.length > 3000) throw new Error('Maximaal 3000 tekens toegestaan.');

  if (antwoordOp) {
    // Een reactie hoort altijd bij dezelfde passage als de oorspronkelijke aantekening.
    const parent = findNoteRow(sheet, antwoordOp);
    if (!parent) throw new Error('De aantekening waarop je reageert bestaat niet meer.');
    if (asText(parent.values[NOTE_COL.antwoordOp - 1])) {
      throw new Error('Je kunt alleen op een aantekening reageren, niet op een reactie.');
    }
    gedicht = asText(parent.values[NOTE_COL.gedicht - 1]);
    passage = asText(parent.values[NOTE_COL.passage - 1]);
    const parentGedichtId = asText(parent.values[NOTE_COL.gedichtId - 1]);
    appendNote(sheet, gedicht, passage, aantekening, persoon, parentGedichtId, antwoordOp);
  } else {
    if (!gedichtId || !passage) throw new Error('Niet alle velden zijn ingevuld.');
    appendNote(sheet, gedicht, passage, aantekening, persoon, gedichtId, '');
  }

  return jsonResponse({ success: true, message: 'Aantekening opgeslagen.' });
}


function appendNote(sheet, gedicht, passage, aantekening, persoon, gedichtId, antwoordOp) {
  const row = new Array(NOTE_COLUMNS).fill('');
  row[NOTE_COL.gedicht - 1] = gedicht;
  row[NOTE_COL.passage - 1] = passage;
  row[NOTE_COL.aantekening - 1] = aantekening;
  row[NOTE_COL.datum - 1] = new Date();
  row[NOTE_COL.persoon - 1] = persoon;
  row[NOTE_COL.id - 1] = newId('a');
  row[NOTE_COL.gedichtId - 1] = gedichtId;
  row[NOTE_COL.antwoordOp - 1] = antwoordOp;
  const range = sheet.getRange(sheet.getLastRow() + 1, 1, 1, NOTE_COLUMNS);
  // Tekstkolommen als platte tekst, zodat iets dat met = begint geen formule wordt.
  sheet.getRange(range.getRow(), NOTE_COL.passage, 1, 2).setNumberFormat('@');
  range.setValues([row]);
}


function changeOrDeleteNote(spreadsheet, data, action, persoon) {
  ensureIds(spreadsheet);
  const sheet = getNotesSheet(spreadsheet);
  const found = findNoteRow(sheet, String(data.id || '').trim());

  if (!found) {
    throw new Error('Deze aantekening bestaat niet meer.');
  }
  if (asText(found.values[NOTE_COL.persoon - 1]).trim() !== persoon) {
    throw new Error('Je kunt alleen je eigen aantekeningen aanpassen.');
  }

  if (action === 'delete') {
    // Verwijder ook de reacties op deze aantekening (van onder naar boven).
    const noteId = asText(found.values[NOTE_COL.id - 1]);
    const lastRow = sheet.getLastRow();
    const ids = sheet.getRange(2, 1, lastRow - 1, NOTE_COLUMNS).getValues();
    const rowsToDelete = [found.row];
    ids.forEach((row, index) => {
      if (asText(row[NOTE_COL.antwoordOp - 1]) === noteId) rowsToDelete.push(index + 2);
    });
    rowsToDelete.sort((a, b) => b - a).forEach(r => sheet.deleteRow(r));
    return jsonResponse({ success: true, message: 'Aantekening verwijderd.' });
  }

  const aantekening = String(data.aantekening || '').trim();
  if (!aantekening) throw new Error('De aantekening mag niet leeg zijn.');
  if (aantekening.length > 3000) throw new Error('Maximaal 3000 tekens toegestaan.');

  sheet.getRange(found.row, NOTE_COL.aantekening).setNumberFormat('@').setValue(aantekening);
  sheet.getRange(found.row, NOTE_COL.datum).setValue(new Date());
  return jsonResponse({ success: true, message: 'Aantekening gewijzigd.' });
}


function findNoteRow(sheet, id) {
  if (!id) return null;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  const rows = sheet.getRange(2, 1, lastRow - 1, NOTE_COLUMNS).getValues();
  const index = rows.findIndex(row => asText(row[NOTE_COL.id - 1]) === id);
  return index === -1 ? null : { row: index + 2, values: rows[index] };
}


// ---------- Gedichten ----------

function addPoem(spreadsheet, data, persoon) {
  const titel = String(data.titel || '').trim();
  const dichter = String(data.dichter || '').trim();
  // Alleen lege regels aan het begin en witruimte aan het eind weg: inspringen aan het begin blijft bewaard.
  const gedicht = String(data.gedicht || '').replace(/\r\n?/g, '\n').replace(/^(?:[ \t]*\n)+/, '').replace(/\s+$/, '');

  if (!titel || !gedicht) throw new Error('Titel en gedicht zijn verplicht.');
  if (titel.length > 200 || dichter.length > 200 || gedicht.length > 20000) {
    throw new Error('Het gedicht is te lang.');
  }

  const sheet = getPoemsSheet(spreadsheet);
  const headers = readHeaders(sheet);

  if (poemTitleExists(sheet, headers, titel)) {
    throw new Error('Er bestaat al een gedicht met deze titel.');
  }

  const titelCol = findOrCreateColumn(sheet, headers, ['titel', 'title'], 'Titel');
  const dichterCol = findOrCreateColumn(sheet, headers, ['dichter', 'auteur', 'author'], 'Dichter');
  const gedichtCol = findOrCreateColumn(sheet, headers, ['gedicht', 'tekst', 'poem'], 'Gedicht');
  const doorCol = findOrCreateColumn(sheet, headers, ['toegevoegd door'], 'Toegevoegd door');
  const opCol = findOrCreateColumn(sheet, headers, ['toegevoegd op'], 'Toegevoegd op');
  const idCol = findOrCreateColumn(sheet, headers, ['id'], 'ID');

  const row = new Array(headers.length).fill('');
  row[titelCol] = titel;
  row[dichterCol] = dichter;
  row[gedichtCol] = gedicht;
  row[doorCol] = persoon;
  row[opCol] = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd-MM-yyyy HH:mm');
  row[idCol] = newId('g');

  const range = sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length);
  range.setNumberFormat('@');
  range.setValues([row]);

  return jsonResponse({ success: true, message: 'Gedicht toegevoegd.' });
}


function setFavorite(spreadsheet, data) {
  ensureIds(spreadsheet);
  const sheet = getPoemsSheet(spreadsheet);
  const headers = readHeaders(sheet);
  const idCol = headers.indexOf('id');
  const favCol = findOrCreateColumn(sheet, headers, ['favoriet'], 'Favoriet');
  const gedichtId = String(data.gedichtId || '').trim();
  const lastRow = sheet.getLastRow();
  if (!gedichtId || idCol === -1 || lastRow < 2) throw new Error('Gedicht niet gevonden.');

  const ids = sheet.getRange(2, idCol + 1, lastRow - 1, 1).getValues();
  const index = ids.findIndex(row => asText(row[0]) === gedichtId);
  if (index === -1) throw new Error('Gedicht niet gevonden.');

  sheet.getRange(index + 2, favCol + 1).setValue(data.waarde === 'ja' ? 'ja' : '');
  return jsonResponse({ success: true, message: 'Favoriet bijgewerkt.' });
}


// ---------- Vaste nummers (ID's) ----------

// Geeft gedichten en aantekeningen zonder ID automatisch een vast nummer,
// en koppelt oude aantekeningen via de titel aan het juiste gedicht.
// Draait bij elke aanroep, maar schrijft alleen als er iets ontbreekt.
function ensureIds(spreadsheet) {
  const poemsSheet = getPoemsSheet(spreadsheet);
  const notesSheet = getNotesSheet(spreadsheet);

  // Gedichten
  const headers = readHeaders(poemsSheet);
  const titelCol = headers.findIndex(h => h === 'titel' || h === 'title');
  const gedichtCol = headers.findIndex(h => ['gedicht', 'tekst', 'poem'].includes(h));
  let idCol = headers.indexOf('id');
  const poemLastRow = poemsSheet.getLastRow();
  const titleToId = {};

  if (poemLastRow >= 2 && gedichtCol !== -1) {
    const rows = poemsSheet.getRange(2, 1, poemLastRow - 1, headers.length).getValues();
    const ids = rows.map(row => idCol === -1 ? '' : asText(row[idCol]));
    let changed = false;
    rows.forEach((row, i) => {
      if (!ids[i] && asText(row[gedichtCol]).trim()) {
        ids[i] = newId('g');
        changed = true;
      }
      if (titelCol !== -1 && ids[i]) titleToId[asText(row[titelCol]).trim().toLowerCase()] = ids[i];
    });
    if (changed) {
      withLock(() => {
        if (idCol === -1) idCol = findOrCreateColumn(poemsSheet, headers, ['id'], 'ID');
        const range = poemsSheet.getRange(2, idCol + 1, ids.length, 1);
        range.setNumberFormat('@');
        range.setValues(ids.map(id => [id]));
      });
    }
  }

  // Aantekeningen
  const firstRow = notesSheet.getRange(1, 1, 1, NOTE_COLUMNS).getValues()[0];
  if (firstRow.slice(5).some(h => !asText(h))) {
    notesSheet.getRange(1, 6, 1, 3).setValues([NOTE_HEADERS.slice(5)]);
  }
  const noteLastRow = notesSheet.getLastRow();
  if (noteLastRow < 2) return;

  const notes = notesSheet.getRange(2, 1, noteLastRow - 1, NOTE_COLUMNS).getValues();
  let notesChanged = false;
  const extra = notes.map(row => {
    let id = asText(row[NOTE_COL.id - 1]);
    let gedichtId = asText(row[NOTE_COL.gedichtId - 1]);
    const antwoordOp = asText(row[NOTE_COL.antwoordOp - 1]);
    if (!id && asText(row[NOTE_COL.aantekening - 1])) {
      id = newId('a');
      notesChanged = true;
    }
    if (!gedichtId) {
      const match = titleToId[asText(row[NOTE_COL.gedicht - 1]).trim().toLowerCase()];
      if (match) {
        gedichtId = match;
        notesChanged = true;
      }
    }
    return [id, gedichtId, antwoordOp];
  });
  if (notesChanged) {
    withLock(() => {
      const range = notesSheet.getRange(2, NOTE_COL.id, extra.length, 3);
      range.setNumberFormat('@');
      range.setValues(extra);
    });
  }
}


function newId(prefix) {
  return prefix + Utilities.getUuid().replace(/-/g, '').slice(0, 11);
}


// ---------- Briefjes (post-its) ----------

const BRIEFJES_SHEET = 'Briefjes';
const BRIEFJE_FIELDS = ['id', 'persoon', 'voor', 'tekst', 'tekening', 'kleur', 'grootte', 'x', 'y', 'draai', 'plaatsing', 'envelop', 'blijft', 'verschijnt', 'gemaakt', 'gelezenOp', 'gelezenDoor', 'antwoordOp', 'status', 'afgepeld', 'kaart', 'extra', 'stickers', 'reacties', 'ingewisseld', 'ingewisseldDoor', 'bewaard'];
const BRIEFJE_HEADERS = ['ID', 'Persoon', 'Voor', 'Tekst', 'Tekening', 'Kleur', 'Grootte', 'X', 'Y', 'Draai', 'Plaatsing', 'Envelop', 'Blijft', 'Verschijnt', 'Gemaakt', 'GelezenOp', 'GelezenDoor', 'AntwoordOp', 'Status', 'Afgepeld', 'Kaart', 'Extra', 'Stickers', 'Reacties', 'Ingewisseld', 'IngewisseldDoor', 'Bewaard'];
const BRIEFJE_COL = {};
BRIEFJE_FIELDS.forEach((field, i) => { BRIEFJE_COL[field] = i + 1; });
const BRIEFJE_NUMBERS = ['x', 'y', 'draai', 'verschijnt', 'gemaakt', 'gelezenOp', 'afgepeld', 'ingewisseld'];
const BRIEFJE_STICKERS = /^([a-z]{2,8}:\d(\.\d+)?,\d(\.\d+)?,-?\d{1,2})(;[a-z]{2,8}:\d(\.\d+)?,\d(\.\d+)?,-?\d{1,2}){0,11}$/;
const BRIEFJE_REACTIES = ['hart', 'lach', 'ster', 'kus'];

// Het tabblad Briefjes wordt de eerste keer vanzelf aangemaakt.
function getBriefjesSheet(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(BRIEFJES_SHEET);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(BRIEFJES_SHEET);
    sheet.getRange(1, 1, 1, BRIEFJE_HEADERS.length).setValues([BRIEFJE_HEADERS]);
  } else if (sheet.getLastColumn() < BRIEFJE_HEADERS.length) {
    // Nieuwe kolommen (kaartjes, reacties, ...) achteraan toevoegen.
    sheet.getRange(1, 1, 1, BRIEFJE_HEADERS.length).setValues([BRIEFJE_HEADERS]);
  }
  return sheet;
}

function rowToBriefje(row) {
  const b = {};
  BRIEFJE_FIELDS.forEach((field, i) => {
    const value = row[i];
    if (BRIEFJE_NUMBERS.includes(field)) b[field] = value === '' || value === null ? 0 : Number(value) || 0;
    else b[field] = value === null || value === undefined ? '' : String(value);
  });
  b.envelop = b.envelop === 'ja';
  b.bewaard = b.bewaard === 'ja';
  return b;
}

function getBriefjes(spreadsheet) {
  const sheet = getBriefjesSheet(spreadsheet);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: true, briefjes: [], nu: Date.now() };
  const first = Math.max(2, lastRow - 399);
  const rows = sheet.getRange(first, 1, lastRow - first + 1, BRIEFJE_FIELDS.length).getValues();
  const briefjes = rows.map(rowToBriefje).filter(b => b.id);
  // Bewaarde briefjes (de bewaardoos) altijd meesturen, ook als ze ouder zijn.
  if (first > 2) {
    const bewaard = sheet.getRange(2, BRIEFJE_COL.bewaard, first - 2, 1).getValues();
    const oud = [];
    bewaard.forEach((r, i) => { if (String(r[0]) === 'ja') oud.push(i + 2); });
    const kies = oud.slice(-200);
    if (kies.length) {
      const blok = sheet.getRange(kies[0], 1, first - kies[0], BRIEFJE_FIELDS.length).getValues();
      const extra = kies.map(rij => rowToBriefje(blok[rij - kies[0]])).filter(x => x.id);
      briefjes.unshift.apply(briefjes, extra);
    }
  }
  return { success: true, briefjes: briefjes, nu: Date.now() };
}

function findBriefjeRow(sheet, id) {
  if (!id) return null;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  const index = ids.findIndex(row => String(row[0]) === id);
  return index === -1 ? null : index + 2;
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function briefjeAction(spreadsheet, data, action, persoon) {
  const sheet = getBriefjesSheet(spreadsheet);
  const id = String(data.id || '').trim();

  if (action === 'briefje_create') {
    if (persoon !== 'Sanne' && persoon !== 'Ramon') throw new Error('Kies Sanne of Ramon.');
    const tekst = String(data.tekst || '').trim();
    const tekening = String(data.tekening || '').trim();
    const kaart = /^[a-z0-9-]{2,24}$/.test(String(data.kaart || '')) ? String(data.kaart) : '';
    if (!tekst && !tekening && !kaart) throw new Error('Het briefje is leeg.');
    const stickers = String(data.stickers || '').trim();
    if (stickers && (stickers.length > 600 || !BRIEFJE_STICKERS.test(stickers))) throw new Error('De stickers kloppen niet.');
    if (tekst.length > 1200) throw new Error('Het briefje is te lang.');
    if (tekening.length > 45000 || !/^[0-9c|,; ]*$/.test(tekening)) throw new Error('De tekening klopt niet.');
    const newIdOk = /^b[a-z0-9]{6,24}$/.test(id);
    const briefjeId = newIdOk ? id : newId('b');
    if (findBriefjeRow(sheet, briefjeId)) return jsonResponse({ success: true, id: briefjeId, message: 'Bestond al.' });
    const antwoordOp = String(data.antwoordOp || '').trim();
    if (antwoordOp && !findBriefjeRow(sheet, antwoordOp)) throw new Error('Het briefje waarop je antwoordt bestaat niet meer.');
    const values = {
      id: briefjeId,
      persoon: persoon,
      voor: ['Sanne', 'Ramon', 'Ons'].includes(data.voor) ? data.voor : 'Ons',
      tekst: tekst,
      tekening: tekening,
      kleur: ['geel', 'roze', 'mint', 'blauw', 'lila'].includes(data.kleur) ? data.kleur : 'geel',
      grootte: ['S', 'M', 'L'].includes(data.grootte) ? data.grootte : 'M',
      x: clampNumber(data.x, 0, 1, 0.8),
      y: clampNumber(data.y, 0, 1.5, 0.35),
      draai: clampNumber(data.draai, -15, 15, 0),
      plaatsing: data.plaatsing === 'overal' ? 'overal' : 'naast',
      envelop: data.envelop === 'ja' ? 'ja' : '',
      blijft: ['gelezen', 'vandaag', 'altijd'].includes(data.blijft) ? data.blijft : 'altijd',
      verschijnt: clampNumber(data.verschijnt, 0, 8.64e15, 0),
      gemaakt: Date.now(),
      gelezenOp: '',
      gelezenDoor: '',
      antwoordOp: antwoordOp,
      status: 'actief',
      afgepeld: '',
      kaart: kaart,
      extra: kaart ? String(data.extra || '').trim().slice(0, 80) : '',
      stickers: stickers,
      reacties: '',
      ingewisseld: '',
      ingewisseldDoor: '',
      bewaard: ''
    };
    const row = BRIEFJE_FIELDS.map(field => values[field]);
    const range = sheet.getRange(sheet.getLastRow() + 1, 1, 1, BRIEFJE_FIELDS.length);
    range.setNumberFormat('@');
    range.setValues([row.map(v => String(v))]);
    return jsonResponse({ success: true, id: briefjeId });
  }

  const rowNumber = findBriefjeRow(sheet, id);
  if (!rowNumber) throw new Error('Dit briefje bestaat niet meer.');
  const set = (field, value) => sheet.getRange(rowNumber, BRIEFJE_COL[field]).setNumberFormat('@').setValue(String(value));

  if (action === 'briefje_move') {
    set('x', clampNumber(data.x, 0, 1, 0.8));
    set('y', clampNumber(data.y, 0, 1.5, 0.35));
    if (data.draai !== undefined) set('draai', clampNumber(data.draai, -15, 15, 0));
    if (data.plaatsing === 'naast' || data.plaatsing === 'overal') set('plaatsing', data.plaatsing);
  } else if (action === 'briefje_read') {
    set('gelezenOp', Date.now());
    set('gelezenDoor', ['Sanne', 'Ramon'].includes(data.door) ? data.door : '');
  } else if (action === 'briefje_unread') {
    set('gelezenOp', '');
    set('gelezenDoor', '');
  } else if (action === 'briefje_peel') {
    set('status', 'prikbord');
    set('afgepeld', Date.now());
  } else if (action === 'briefje_restore') {
    set('status', 'actief');
    set('afgepeld', '');
    set('blijft', 'altijd');
    set('verschijnt', 0);
  } else if (action === 'briefje_react') {
    // Eén reactie per persoon; dezelfde nog eens = weghalen.
    const wie = ['Sanne', 'Ramon'].includes(persoon) ? persoon : '';
    if (!wie) throw new Error('Kies Sanne of Ramon.');
    const reactie = BRIEFJE_REACTIES.includes(data.reactie) ? data.reactie : '';
    const huidig = {};
    String(sheet.getRange(rowNumber, BRIEFJE_COL.reacties).getValue() || '').split(';').forEach(p => {
      const m = p.match(/^(Sanne|Ramon)=([a-z]{2,8})$/);
      if (m) huidig[m[1]] = m[2];
    });
    if (reactie) huidig[wie] = reactie; else delete huidig[wie];
    set('reacties', Object.keys(huidig).map(k => k + '=' + huidig[k]).join(';'));
  } else if (action === 'briefje_redeem') {
    if (!sheet.getRange(rowNumber, BRIEFJE_COL.kaart).getValue()) throw new Error('Dit is geen bon.');
    if (data.terug === 'ja') {
      set('ingewisseld', '');
      set('ingewisseldDoor', '');
    } else {
      if (Number(sheet.getRange(rowNumber, BRIEFJE_COL.ingewisseld).getValue())) throw new Error('Deze bon is al ingewisseld.');
      set('ingewisseld', Date.now());
      set('ingewisseldDoor', ['Sanne', 'Ramon'].includes(data.door) ? data.door : '');
    }
  } else if (action === 'briefje_keep') {
    set('bewaard', data.bewaard === 'ja' ? 'ja' : '');
  } else if (action === 'briefje_delete') {
    // Verwijder ook de antwoorden op dit briefje.
    const lastRow = sheet.getLastRow();
    const rows = sheet.getRange(2, 1, lastRow - 1, BRIEFJE_FIELDS.length).getValues();
    const toDelete = [rowNumber];
    rows.forEach((row, i) => { if (String(row[BRIEFJE_COL.antwoordOp - 1]) === id) toDelete.push(i + 2); });
    toDelete.sort((a, b) => b - a).forEach(r => sheet.deleteRow(r));
  } else {
    throw new Error('Onbekende actie.');
  }
  return jsonResponse({ success: true, id: id });
}


// ---------- Hulpfuncties ----------

let lockHeld = false;
function withLock(fn) {
  if (lockHeld) return fn();
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  lockHeld = true;
  try {
    const result = fn();
    SpreadsheetApp.flush();
    return result;
  } finally {
    lockHeld = false;
    lock.releaseLock();
  }
}

function isValidToken(token) {
  const secretToken = PropertiesService.getScriptProperties().getProperty('SECRET_TOKEN');
  return !!secretToken && String(token || '').trim() === secretToken;
}

function isYes(value) {
  return value === true || ['ja', 'j', 'yes', 'true', 'x', '1', '♥'].includes(String(value || '').trim().toLowerCase());
}

function asText(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'dd-MM-yyyy HH:mm');
  }
  return value === null || value === undefined ? '' : String(value);
}

function getPoemsSheet(spreadsheet) {
  const sheet = spreadsheet.getSheets().find(s => s.getSheetId() === POEMS_SHEET_GID);
  if (!sheet) throw new Error('Tabblad met gedichten niet gevonden.');
  return sheet;
}

function getNotesSheet(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('Tabblad ' + SHEET_NAME + ' niet gevonden.');
  return sheet;
}

function readHeaders(sheet) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0]
    .map(h => String(h || '').trim().toLowerCase());
}

// Zoekt een kolom op naam (rij 1). Bestaat hij niet, dan wordt hij achteraan aangemaakt.
function findOrCreateColumn(sheet, headers, possibleNames, newName) {
  let index = headers.findIndex(h => possibleNames.includes(h));
  if (index === -1) {
    index = headers.length;
    sheet.getRange(1, index + 1).setValue(newName);
    headers.push(newName.toLowerCase());
  }
  return index;
}

function poemTitleExists(sheet, headers, titel) {
  const titelCol = headers.findIndex(h => h === 'titel' || h === 'title');
  const lastRow = sheet.getLastRow();
  if (titelCol === -1 || lastRow < 2) return false;
  const gezocht = titel.trim().toLowerCase();
  return sheet.getRange(2, titelCol + 1, lastRow - 1, 1).getValues()
    .some(row => String(row[0] || '').trim().toLowerCase() === gezocht);
}

function textResponse(message) {
  return ContentService.createTextOutput(message).setMimeType(ContentService.MimeType.TEXT);
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function jsonpResponse(callback, data) {
  return ContentService
    .createTextOutput(callback + '(' + JSON.stringify(data) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}


// ---------- Reeksen ----------
// De tekst van een reeks staat als bestand op GitHub; hier wordt alleen bewaard waar jullie zijn.
// Dagen zijn dagnummers (dagen sinds 1-1-1970, met het wisseluur van de site meegerekend).
function getReeksStand() {
  const raw = PropertiesService.getScriptProperties().getProperty('REEKS_STAND');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

function setReeksStand(data) {
  // Versie 1.3 van de site stuurt de hele stand als JSON: welke reeks loopt, en per reeks waar jullie zijn.
  if (data.stand !== undefined) {
    const tekst = String(data.stand || '');
    if (tekst.length > 20000) throw new Error('De reeksstand is te groot.');
    let stand;
    try { stand = JSON.parse(tekst); } catch (e) { throw new Error('Ongeldige reeksstand.'); }
    if (!stand || typeof stand !== 'object' || typeof stand.reeksen !== 'object' || Array.isArray(stand.reeksen)) {
      throw new Error('Ongeldige reeksstand.');
    }
    const naamOk = v => v === null || v === undefined || (typeof v === 'string' && /^[a-z0-9-]{1,80}$/.test(v));
    if (!naamOk(stand.actief)) throw new Error('Ongeldige reeks.');
    Object.keys(stand.reeksen).forEach(id => {
      if (!naamOk(id)) throw new Error('Ongeldige reeks.');
      const r = stand.reeksen[id];
      if (!r || typeof r.start !== 'number') throw new Error('Ongeldige reeksstand.');
    });
    stand.gewijzigd = new Date().toISOString();
    PropertiesService.getScriptProperties().setProperty('REEKS_STAND', JSON.stringify(stand));
    return jsonResponse({ success: true, reeksStand: stand });
  }

  // Oudere site (versie 1.2): losse velden voor één reeks.
  const asInt = (v, leeg) => {
    if (v === undefined || v === null || String(v).trim() === '') return leeg;
    const n = Number(v);
    if (!isFinite(n) || Math.abs(n) > 1e6) throw new Error('Ongeldige waarde voor de reeks.');
    return Math.round(n);
  };
  const naam = String(data.reeks || '').trim().slice(0, 80);
  if (!/^[a-z0-9-]+$/.test(naam)) throw new Error('Ongeldige reeks.');
  const stand = {
    reeks: naam,
    aan: String(data.aan) === 'ja',
    start: asInt(data.start, null),
    pauzeVanaf: asInt(data.pauzeVanaf, null),
    pauzeTotaal: asInt(data.pauzeTotaal, 0),
    gewijzigd: new Date().toISOString()
  };
  if (stand.start === null) throw new Error('Geen startdag.');
  PropertiesService.getScriptProperties().setProperty('REEKS_STAND', JSON.stringify(stand));
  return jsonResponse({ success: true, reeksStand: stand });
}

// Wie heeft welk deel gelezen (en welke lievelingsregel). Per reeks een eigen eigenschap,
// en elke wijziging apart, zodat twee telefoons tegelijk elkaar niet overschrijven.
function getReeksLezen() {
  const stand = getReeksStand();
  const props = PropertiesService.getScriptProperties();
  const uit = {};
  if (stand && stand.reeksen) {
    Object.keys(stand.reeksen).forEach(id => {
      const raw = props.getProperty('REEKS_LEZEN_' + id);
      if (raw) { try { uit[id] = JSON.parse(raw); } catch (e) {} }
    });
  }
  return uit;
}

function setReeksLezen(data) {
  const id = String(data.reeks || '');
  if (!/^[a-z0-9-]{1,80}$/.test(id)) throw new Error('Ongeldige reeks.');
  const dag = Number(data.dag);
  if (!Number.isInteger(dag) || dag < 1 || dag > 1000) throw new Error('Ongeldige dag.');
  const wie = String(data.wie || '');
  if (wie !== 'Ramon' && wie !== 'Sanne') throw new Error('Ongeldige naam.');
  const props = PropertiesService.getScriptProperties();
  const sleutel = 'REEKS_LEZEN_' + id;
  let lezen = {};
  try { lezen = JSON.parse(props.getProperty(sleutel) || '{}') || {}; } catch (e) { lezen = {}; }
  const d = String(dag);
  lezen[d] = lezen[d] || {};
  if (String(data.gelezen) === 'ja') {
    const op = Number(data.op);
    if (!Number.isInteger(op) || Math.abs(op) > 1e6) throw new Error('Ongeldige datum.');
    const regelRaw = String(data.regel === undefined ? '' : data.regel).trim();
    const regel = regelRaw === '' ? null : Number(regelRaw);
    if (regel !== null && (!Number.isInteger(regel) || regel < 0 || regel > 5000)) throw new Error('Ongeldige regel.');
    const oud = lezen[d][wie] || {};
    lezen[d][wie] = { op: typeof oud.op === 'number' ? oud.op : op, regel: regel };
  } else {
    delete lezen[d][wie];
    if (!Object.keys(lezen[d]).length) delete lezen[d];
  }
  props.setProperty(sleutel, JSON.stringify(lezen));
  return jsonResponse({ success: true, reeksLezen: lezen });
}
