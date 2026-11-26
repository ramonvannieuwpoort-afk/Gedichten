// Recepten – Apps Script
// Versie 1.2: recepten verwijderen en terughalen.
// Versie 1.1: erbij-recepten (jus, saus, bijgerecht koppelen aan een hoofdgerecht).
// Versie 1.0: recepten (met versies en geschiedenis), weekmenu, boodschappen (Lidl en AH),
// voorraad in de kast (met logboek en automatisch aanvullen), cijfers en "onderweg".
//
// Eenmalig: zet bij Projectinstellingen → Scripteigenschappen de eigenschap SECRET_TOKEN
// (dezelfde toegangscode als bij de gedichten) en voer daarna de functie installeer() uit.

const VERSIE = '1.2';

// Elk tabblad met zijn kolommen. De kolomnamen in rij 1 zijn precies deze woorden.
const TABELLEN = {
  Recepten: ['id', 'titel', 'personen', 'tijd', 'tags', 'bron', 'letop', 'toegevoegdDoor', 'toegevoegdOp', 'versie', 'gewijzigdOp', 'gewijzigdDoor', 'erbij'],
  Ingredienten: ['receptId', 'volgorde', 'groep', 'hoeveelheid', 'eenheid', 'naam', 'notitie', 'schalen', 'productId', 'afdeling', 'winkel'],
  Stappen: ['receptId', 'nr', 'tekst', 'timer', 'letop'],
  Weekmenu: ['id', 'datum', 'receptId', 'kok', 'personen', 'gekookt', 'opLijst', 'erbij'],
  Boodschappen: ['id', 'naam', 'hoeveelheid', 'eenheid', 'winkel', 'afdeling', 'receptId', 'productId', 'toegevoegdDoor', 'toegevoegdOp', 'status', 'gekochtDoor', 'gekochtOp'],
  Producten: ['id', 'naam', 'synoniemen', 'soort', 'verpakking', 'inhoud', 'eenheid', 'winkel', 'afdeling', 'minimum', 'aantal', 'niveau', 'laatstGeteld'],
  Voorraadlog: ['datum', 'persoon', 'productId', 'product', 'wijziging', 'reden', 'nieuw'],
  Cijfers: ['receptId', 'persoon', 'cijfer', 'datum', 'samen'],
  Geschiedenis: ['receptId', 'versie', 'gewijzigdDoor', 'datum', 'oud']
};
const PERSONEN = ['Sanne', 'Ramon'];
const NIVEAUS = ['vol', 'half', 'bijna op', 'op'];


// ---------- Lezen (GET, als JSONP) ----------

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (!p.action) return tekst(verbindingstest());
  const callback = String(p.callback || '');
  if (!/^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(callback)) return tekst('Ongeldige callback.');
  try {
    if (!geldigeCode(p.token)) return jsonp(callback, { success: false, error: 'Ongeldige toegangscode.' });
    if (p.action === 'alles') return jsonp(callback, alles());
    if (p.action === 'geschiedenis') return jsonp(callback, geschiedenisVan(String(p.id || '')));
    return jsonp(callback, { success: false, error: 'Onbekende actie.' });
  } catch (err) {
    return jsonp(callback, { success: false, error: err.message });
  }
}

function alles() {
  const props = PropertiesService.getScriptProperties();
  let onderweg = null;
  try { onderweg = JSON.parse(props.getProperty('ONDERWEG') || 'null'); } catch (e) {}
  return {
    success: true,
    versie: VERSIE,
    nu: Date.now(),
    recepten: lees('Recepten'),
    ingredienten: lees('Ingredienten'),
    stappen: lees('Stappen'),
    weekmenu: lees('Weekmenu'),
    boodschappen: lees('Boodschappen').filter(b => b.status !== 'weg'),
    producten: lees('Producten'),
    cijfers: lees('Cijfers'),
    onderweg: onderweg
  };
}

function geschiedenisVan(id) {
  const lijst = lees('Geschiedenis').filter(g => g.receptId === id)
    .map(g => ({ versie: Number(g.versie), gewijzigdDoor: g.gewijzigdDoor, datum: g.datum }))
    .sort((a, b) => b.versie - a.versie);
  return { success: true, geschiedenis: lijst };
}


// ---------- Opslaan (POST) ----------

function doPost(e) {
  try {
    const d = (e && e.parameter) || {};
    if (!geldigeCode(d.token)) throw new Error('Ongeldige toegangscode.');
    const actie = String(d.action || '');
    const persoon = PERSONEN.includes(d.persoon) ? d.persoon : '';
    const acties = {
      recept_opslaan: () => receptOpslaan(JSON.parse(d.recept || '{}'), persoon, d.basisVersie),
      recept_terugzetten: () => receptTerugzetten(String(d.id || ''), Number(d.versie), persoon),
      recept_weg: () => receptWeg(String(d.id || ''), persoon),
      recept_herstel: () => receptHerstel(String(d.id || ''), persoon),
      weekmenu_zet: () => weekmenuZet(d),
      weekmenu_weg: () => verwijderRijen('Weekmenu', r => r.id === d.id),
      weekmenu_status: () => werkBij('Weekmenu', r => r.id === d.id, pick(d, ['gekookt', 'opLijst'])),
      weekmenu_erbij: () => werkBij('Weekmenu', r => r.id === d.id, { erbij: erbijLijst(d.erbij, true) }),
      recept_erbij: () => werkBij('Recepten', r => r.id === d.id, { erbij: erbijLijst(d.erbij, false) }),
      lijst_toevoegen: () => lijstToevoegen(JSON.parse(d.items || '[]'), persoon),
      lijst_zet: () => lijstZet(d, persoon),
      lijst_klaar: () => lijstKlaar(String(d.winkel || ''), JSON.parse(d.inKast || '[]'), persoon),
      voorraad: () => voorraadWijzig(JSON.parse(d.wijzigingen || '[]'), String(d.reden || 'aangepast'), persoon),
      product_opslaan: () => productOpslaan(JSON.parse(d.product || '{}'), persoon),
      cijfer: () => cijferGeven(d, persoon),
      onderweg: () => onderwegZet(String(d.winkel || ''), persoon)
    };
    if (!acties[actie]) throw new Error('Onbekende actie.');
    const uit = metSlot(acties[actie]);
    return json(Object.assign({ success: true }, uit || {}));
  } catch (err) {
    console.error(err);
    return json({ success: false, error: err.message });
  }
}


// ---------- Recepten ----------

function receptOpslaan(r, persoon, basisVersie) {
  const titel = String(r.titel || '').trim();
  if (!titel) throw new Error('Een recept heeft een titel nodig.');
  if (!Array.isArray(r.ingredienten) || !r.ingredienten.length) throw new Error('Minstens één ingrediënt.');
  if (!Array.isArray(r.stappen) || !r.stappen.length) throw new Error('Minstens één stap.');
  const id = /^r[a-z0-9]{6,24}$/.test(String(r.id || '')) ? String(r.id) : nieuwId('r');
  const recepten = lees('Recepten');
  const bestaand = recepten.find(x => x.id === id);
  const nu = nuTekst();
  let versie = 1;
  if (bestaand) {
    const huidig = Number(bestaand.versie) || 1;
    if (String(basisVersie) !== String(huidig)) {
      throw new Error('Conflict: dit recept is intussen aangepast (versie ' + huidig + ').');
    }
    bewaarInGeschiedenis(id, bestaand, persoon);
    versie = huidig + 1;
  }
  const rij = {
    id: id, titel: titel,
    personen: String(Math.max(1, Math.min(20, Number(r.personen) || 2))),
    tijd: String(Math.max(0, Number(r.tijd) || 0)),
    tags: String(r.tags || ''), bron: String(r.bron || ''), letop: String(r.letop || ''),
    toegevoegdDoor: bestaand ? bestaand.toegevoegdDoor : persoon,
    toegevoegdOp: bestaand ? bestaand.toegevoegdOp : nu,
    versie: String(versie), gewijzigdOp: nu, gewijzigdDoor: persoon,
    // Gekoppelde erbij-recepten blijven staan als de app ze niet meestuurt.
    erbij: r.erbij !== undefined ? erbijLijst(r.erbij, false) : (bestaand ? bestaand.erbij : '')
  };
  if (bestaand) werkBij('Recepten', x => x.id === id, rij);
  else voegToe('Recepten', [rij]);
  vervangDelen(id, r.ingredienten, r.stappen);
  return { id: id, versie: versie };
}

function vervangDelen(id, ingredienten, stappen) {
  const ingr = ingredienten.map((i, n) => ({
    receptId: id, volgorde: String(n + 1), groep: String(i.groep || ''),
    hoeveelheid: i.hoeveelheid === '' || i.hoeveelheid === null || i.hoeveelheid === undefined ? '' : String(Number(i.hoeveelheid) || 0),
    eenheid: String(i.eenheid || ''), naam: String(i.naam || '').trim(), notitie: String(i.notitie || ''),
    schalen: i.schalen === 'nee' ? 'nee' : 'ja', productId: String(i.productId || ''),
    afdeling: String(i.afdeling || ''), winkel: String(i.winkel || '')
  })).filter(i => i.naam);
  const st = stappen.map((s, n) => ({
    receptId: id, nr: String(n + 1), tekst: String(s.tekst || '').trim(),
    timer: s.timer ? String(Number(s.timer) || '') : '', letop: String(s.letop || '')
  })).filter(s => s.tekst);
  schrijfAlles('Ingredienten', lees('Ingredienten').filter(i => i.receptId !== id).concat(ingr));
  schrijfAlles('Stappen', lees('Stappen').filter(s => s.receptId !== id).concat(st));
}

function bewaarInGeschiedenis(id, recept, persoon) {
  const oud = {
    recept: recept,
    ingredienten: lees('Ingredienten').filter(i => i.receptId === id),
    stappen: lees('Stappen').filter(s => s.receptId === id)
  };
  voegToe('Geschiedenis', [{ receptId: id, versie: String(recept.versie || 1), gewijzigdDoor: persoon, datum: nuTekst(), oud: JSON.stringify(oud) }]);
}

function receptTerugzetten(id, versie, persoon) {
  const g = lees('Geschiedenis').find(x => x.receptId === id && Number(x.versie) === versie);
  if (!g) throw new Error('Deze versie bestaat niet.');
  const oud = JSON.parse(g.oud);
  const huidig = lees('Recepten').find(x => x.id === id);
  const r = Object.assign({}, oud.recept, { id: id, ingredienten: oud.ingredienten, stappen: oud.stappen });
  return receptOpslaan(r, persoon, huidig ? huidig.versie : '');
}


// Verwijderen: het recept gaat (volledig) naar Geschiedenis, zodat het terug kan.
function receptWeg(id, persoon) {
  const r = lees('Recepten').find(x => x.id === id);
  if (!r) throw new Error('Dit recept bestaat niet.');
  const oud = { recept: r, ingredienten: lees('Ingredienten').filter(i => i.receptId === id), stappen: lees('Stappen').filter(s => s.receptId === id) };
  voegToe('Geschiedenis', [{ receptId: id, versie: 'verwijderd', gewijzigdDoor: persoon, datum: nuTekst(), oud: JSON.stringify(oud) }]);
  schrijfAlles('Recepten', lees('Recepten').filter(x => x.id !== id).map(x => {
    if (x.erbij) x.erbij = x.erbij.split(',').filter(y => y !== id).join(',');
    return x;
  }));
  schrijfAlles('Ingredienten', lees('Ingredienten').filter(i => i.receptId !== id));
  schrijfAlles('Stappen', lees('Stappen').filter(s => s.receptId !== id));
  // Nog niet gekookte planningen met dit recept vervallen; als 'erbij' verdwijnt het.
  schrijfAlles('Weekmenu', lees('Weekmenu').filter(w => !(w.receptId === id && !w.gekookt)).map(w => {
    if (w.erbij && w.erbij !== '-') w.erbij = w.erbij.split(',').filter(y => y !== id).join(',');
    return w;
  }));
  return {};
}

function receptHerstel(id, persoon) {
  if (lees('Recepten').some(x => x.id === id)) return {};
  const g = lees('Geschiedenis').filter(x => x.receptId === id && x.versie === 'verwijderd').pop();
  if (!g) throw new Error('Niets om terug te zetten.');
  const oud = JSON.parse(g.oud);
  voegToe('Recepten', [oud.recept]);
  voegToe('Ingredienten', oud.ingredienten);
  voegToe('Stappen', oud.stappen);
  return {};
}

// ---------- Weekmenu ----------

function weekmenuZet(d) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(d.datum || ''))) throw new Error('Ongeldige datum.');
  const rij = {
    id: /^w[a-z0-9]{6,24}$/.test(String(d.id || '')) ? d.id : nieuwId('w'),
    datum: d.datum, receptId: String(d.receptId || ''),
    kok: ['Sanne', 'Ramon', 'Samen'].includes(d.kok) ? d.kok : '',
    personen: String(Math.max(1, Math.min(20, Number(d.personen) || 2))),
    gekookt: '', opLijst: '',
    erbij: d.erbij !== undefined ? erbijLijst(d.erbij, true) : ''
  };
  // Eén gerecht per dag: een bestaande planning op die dag wordt vervangen.
  const rest = lees('Weekmenu').filter(w => w.datum !== rij.datum && w.id !== rij.id);
  schrijfAlles('Weekmenu', rest.concat([rij]));
  return { id: rij.id };
}


// ---------- Boodschappen ----------

function lijstToevoegen(items, persoon) {
  const lijst = lees('Boodschappen');
  const nieuw = [];
  let gewijzigd = false;
  items.forEach(it => {
    const naam = String(it.naam || '').trim();
    if (!naam) return;
    const winkel = it.winkel === 'AH' ? 'AH' : 'Lidl';
    const hoeveelheid = Number(it.hoeveelheid) || 0;
    const eenheid = String(it.eenheid || '');
    const zelfde = b => b.status === 'open' && b.winkel === winkel && b.eenheid === eenheid &&
      (it.productId ? b.productId === it.productId : b.naam.toLowerCase() === naam.toLowerCase());
    const bestaand = lijst.find(zelfde) || nieuw.find(zelfde);
    if (bestaand) {
      bestaand.hoeveelheid = String(rond((Number(bestaand.hoeveelheid) || 0) + hoeveelheid));
      if (it.receptId && bestaand.receptId.split(',').indexOf(it.receptId) === -1) {
        bestaand.receptId = bestaand.receptId ? bestaand.receptId + ',' + it.receptId : it.receptId;
      }
      gewijzigd = true;
      return;
    }
    nieuw.push({
      id: nieuwId('b'), naam: naam, hoeveelheid: hoeveelheid ? String(rond(hoeveelheid)) : '', eenheid: eenheid,
      winkel: winkel, afdeling: String(it.afdeling || 'Overig'), receptId: String(it.receptId || ''),
      productId: String(it.productId || ''), toegevoegdDoor: persoon || String(it.door || ''),
      toegevoegdOp: String(Date.now()), status: 'open', gekochtDoor: '', gekochtOp: ''
    });
  });
  if (gewijzigd) schrijfAlles('Boodschappen', lijst.concat(nieuw));
  else if (nieuw.length) voegToe('Boodschappen', nieuw);
  return { toegevoegd: nieuw.length };
}

function lijstZet(d, persoon) {
  const w = {};
  if (d.status === 'open' || d.status === 'gekocht' || d.status === 'weg') {
    w.status = d.status;
    w.gekochtDoor = d.status === 'gekocht' ? persoon : '';
    w.gekochtOp = d.status === 'gekocht' ? String(Date.now()) : '';
  }
  if (d.winkel === 'Lidl' || d.winkel === 'AH') w.winkel = d.winkel;
  if (d.hoeveelheid !== undefined && d.hoeveelheid !== '') w.hoeveelheid = String(Number(d.hoeveelheid) || 0);
  werkBij('Boodschappen', b => b.id === d.id, w);
}

// Klaar met boodschappen: het gekochte gaat van de lijst, en wat aangevinkt is gaat de kast in.
function lijstKlaar(winkel, inKast, persoon) {
  const lijst = lees('Boodschappen');
  const producten = lees('Producten');
  const wijzigingen = [];
  lijst.forEach(b => {
    if (b.winkel !== winkel || b.status !== 'gekocht') return;
    b.status = 'weg';
    if (inKast.indexOf(b.id) !== -1 && b.productId) {
      const p = producten.find(x => x.id === b.productId);
      if (!p) return;
      if (p.soort === 'niveau') wijzigingen.push({ productId: p.id, niveau: 'vol' });
      else {
        const n = (b.eenheid === p.verpakking || !b.eenheid) ? (Number(b.hoeveelheid) || 1) : 1;
        wijzigingen.push({ productId: p.id, delta: n });
      }
    }
  });
  schrijfAlles('Boodschappen', lijst);
  if (wijzigingen.length) voorraadWijzig(wijzigingen, 'gekocht', persoon);
  const props = PropertiesService.getScriptProperties();
  try {
    const o = JSON.parse(props.getProperty('ONDERWEG') || 'null');
    if (o && o.winkel === winkel) props.deleteProperty('ONDERWEG');
  } catch (e) {}
  return { inKast: wijzigingen.length };
}

function onderwegZet(winkel, persoon) {
  const props = PropertiesService.getScriptProperties();
  if (!winkel) { props.deleteProperty('ONDERWEG'); return {}; }
  if (winkel !== 'Lidl' && winkel !== 'AH') throw new Error('Onbekende winkel.');
  props.setProperty('ONDERWEG', JSON.stringify({ persoon: persoon, winkel: winkel, sinds: Date.now() }));
  return {};
}


// ---------- Voorraad ----------

// wijzigingen: [{productId, delta}] of [{productId, aantal}] (tellen) of [{productId, niveau}]
function voorraadWijzig(wijzigingen, reden, persoon) {
  const producten = lees('Producten');
  const log = [];
  wijzigingen.forEach(w => {
    const p = producten.find(x => x.id === w.productId);
    if (!p) return;
    if (p.soort === 'niveau') {
      if (NIVEAUS.indexOf(w.niveau) === -1 || w.niveau === p.niveau) return;
      log.push({ datum: nuTekst(), persoon: persoon, productId: p.id, product: p.naam, wijziging: p.niveau + ' → ' + w.niveau, reden: reden, nieuw: w.niveau });
      p.niveau = w.niveau;
    } else {
      const oud = Number(p.aantal) || 0;
      let nieuw = w.aantal !== undefined ? Number(w.aantal) : oud + Number(w.delta || 0);
      if (!isFinite(nieuw)) return;
      nieuw = Math.max(0, Math.min(999, Math.round(nieuw)));
      if (nieuw === oud) return;
      log.push({ datum: nuTekst(), persoon: persoon, productId: p.id, product: p.naam, wijziging: String(nieuw - oud), reden: reden, nieuw: String(nieuw) });
      p.aantal = String(nieuw);
    }
    if (reden === 'geteld') p.laatstGeteld = nuTekst();
  });
  if (reden === 'geteld') {
    // Ook ongewijzigde producten zijn nu geteld.
    wijzigingen.forEach(w => { const p = producten.find(x => x.id === w.productId); if (p) p.laatstGeteld = nuTekst(); });
  }
  schrijfAlles('Producten', producten);
  if (log.length) voegToe('Voorraadlog', log);
  aanvullen(producten);
  return { gewijzigd: log.length };
}

// Onder het minimum (of bijna op)? Dan komt het op de lijst van de vaste winkel, als het er nog niet op staat.
function aanvullen(producten) {
  producten = producten || lees('Producten');
  const lijst = lees('Boodschappen');
  const items = [];
  let opgeruimd = false;
  producten.forEach(p => {
    let tekort = 0;
    if (p.soort === 'niveau') tekort = (p.niveau === 'bijna op' || p.niveau === 'op') ? 1 : 0;
    else {
      const min = Number(p.minimum) || 0;
      const aantal = Number(p.aantal) || 0;
      tekort = min > 0 && aantal < min ? min - aantal : 0;
    }
    // Automatisch toegevoegd, maar intussen weer genoeg in de kast? Dan van de lijst.
    if (!tekort) {
      lijst.forEach(b => {
        if (b.productId === p.id && b.status === 'open' && b.toegevoegdDoor === 'Voorraad') { b.status = 'weg'; opgeruimd = true; }
      });
      return;
    }
    const staatErOp = lijst.some(b => b.productId === p.id && (b.status === 'open' || b.status === 'gekocht'));
    if (staatErOp) return;
    if (tekort > 0) items.push({ naam: p.naam, hoeveelheid: tekort, eenheid: p.verpakking, winkel: p.winkel, afdeling: p.afdeling, productId: p.id, door: 'Voorraad' });
  });
  if (opgeruimd) schrijfAlles('Boodschappen', lijst);
  if (items.length) lijstToevoegen(items, '');
}

function productOpslaan(p, persoon) {
  const naam = String(p.naam || '').trim();
  if (!naam) throw new Error('Een product heeft een naam nodig.');
  const producten = lees('Producten');
  if (!p.id && producten.some(x => x.naam.toLowerCase() === naam.toLowerCase())) throw new Error('Dit product bestaat al.');
  const rij = {
    id: /^p[a-z0-9]{6,24}$/.test(String(p.id || '')) ? p.id : nieuwId('p'),
    naam: naam, synoniemen: String(p.synoniemen || ''),
    soort: p.soort === 'niveau' ? 'niveau' : 'telbaar',
    verpakking: String(p.verpakking || 'stuk'), inhoud: p.inhoud ? String(Number(p.inhoud) || '') : '',
    eenheid: ['g', 'ml', 'st'].includes(p.eenheid) ? p.eenheid : '',
    winkel: p.winkel === 'AH' ? 'AH' : 'Lidl', afdeling: String(p.afdeling || 'Overig'),
    minimum: String(Math.max(0, Number(p.minimum) || 0)),
    aantal: String(Math.max(0, Math.round(Number(p.aantal) || 0))),
    niveau: NIVEAUS.indexOf(p.niveau) !== -1 ? p.niveau : (p.soort === 'niveau' ? 'vol' : ''),
    laatstGeteld: nuTekst()
  };
  const bestaand = producten.find(x => x.id === rij.id);
  if (bestaand) {
    delete rij.aantal; delete rij.niveau; delete rij.laatstGeteld; // voorraad gaat via voorraadWijzig
    Object.assign(bestaand, rij);
  } else {
    producten.push(rij);
    voegToe('Voorraadlog', [{ datum: nuTekst(), persoon: persoon, productId: rij.id, product: rij.naam, wijziging: 'nieuw: ' + (rij.soort === 'niveau' ? rij.niveau : rij.aantal), reden: 'nieuw product', nieuw: rij.soort === 'niveau' ? rij.niveau : rij.aantal }]);
  }
  schrijfAlles('Producten', producten);
  aanvullen(producten);
  return { id: rij.id };
}


// ---------- Cijfers ----------

function cijferGeven(d, persoon) {
  if (!persoon) throw new Error('Kies Sanne of Ramon.');
  const c = Math.round(Number(d.cijfer));
  if (!(c >= 1 && c <= 10)) throw new Error('Een cijfer is 1 t/m 10.');
  voegToe('Cijfers', [{ receptId: String(d.receptId || ''), persoon: persoon, cijfer: String(c), datum: nuTekst(), samen: d.samen === 'ja' ? 'ja' : '' }]);
}


// ---------- Installeren (één keer uitvoeren) ----------

function installeer() {
  Object.keys(TABELLEN).forEach(blad);
  if (lees('Producten').length || lees('Recepten').length) {
    Logger.log('Er staan al gegevens in: installeer() heeft niets toegevoegd.');
    return;
  }
  const P = (naam, soort, verpakking, inhoud, eenheid, winkel, afdeling, minimum, aantal, synoniemen) =>
    ({ id: 'p' + (naam.toLowerCase().replace(/[^a-z]/g, '').slice(0, 14) + '000000').slice(0, Math.max(6, Math.min(14, naam.replace(/[^a-z]/gi, '').length))), naam, synoniemen: synoniemen || '', soort, verpakking, inhoud: inhoud ? String(inhoud) : '', eenheid, winkel, afdeling, minimum: String(minimum), aantal: soort === 'niveau' ? '' : String(aantal), niveau: soort === 'niveau' ? aantal : '', laatstGeteld: nuTekst() });
  const producten = [
    P('Havermelk', 'telbaar', 'pak', 1000, 'ml', 'Lidl', 'Plantaardig', 2, 4, 'haverdrink'),
    P('Amandelmelk', 'telbaar', 'pak', 1000, 'ml', 'Lidl', 'Plantaardig', 1, 1, 'amandeldrink'),
    P('Amandelen (ongebrand)', 'telbaar', 'zak', 200, 'g', 'Lidl', 'Noten & zaden', 1, 1, 'amandelen'),
    P('Tomatenpuree', 'telbaar', 'blikje', 70, 'g', 'Lidl', 'Conserven', 1, 2),
    P('Balsamico glaze', 'telbaar', 'fles', 250, 'ml', 'AH', 'Sauzen & kruiden', 0, 1, 'balsamicoglaze'),
    P('Tomaten in blik', 'telbaar', 'blik', 400, 'g', 'Lidl', 'Conserven', 4, 10, 'bliktomaat,tomatenblokjes,gepelde tomaten'),
    P('Currypasta', 'telbaar', 'pot', 110, 'g', 'AH', 'Wereldkeuken', 1, 1, 'rode currypasta'),
    P('Pils', 'telbaar', 'flesje', 300, 'ml', 'Lidl', 'Dranken', 0, 4, 'bier'),
    P('Augurken', 'telbaar', 'pot', 0, '', 'Lidl', 'Conserven', 0, 1, 'augurk'),
    P('Kokosmelk', 'telbaar', 'blik', 400, 'ml', 'Lidl', 'Wereldkeuken', 1, 0, 'cocosmelk'),
    P('Koffie', 'telbaar', 'pak', 500, 'g', 'Lidl', 'Koffie & thee', 1, 1),
    P('Basmatirijst', 'telbaar', 'zak', 1000, 'g', 'Lidl', 'Pasta & rijst', 1, 0, 'basmati,rijst'),
    P('Olijfolie', 'niveau', 'fles', 0, '', 'Lidl', 'Sauzen & kruiden', 0, 'vol', 'olie'),
    P('Zout', 'niveau', 'pak', 0, '', 'Lidl', 'Sauzen & kruiden', 0, 'vol', 'zeezout'),
    P('Zwarte peper', 'niveau', 'molen', 0, '', 'Lidl', 'Sauzen & kruiden', 0, 'vol', 'peper')
  ];
  schrijfAlles('Producten', producten);
  const pid = naam => producten.find(p => p.naam === naam).id;
  voorbeeldRecepten(pid).forEach(r => receptOpslaan(r, '', ''));
  aanvullen();
  Logger.log('Klaar: tabbladen, ' + producten.length + ' producten en 4 proefrecepten aangemaakt.');
}

function voorbeeldRecepten(pid) {
  const I = (hoeveelheid, eenheid, naam, extra) => Object.assign({ hoeveelheid: hoeveelheid, eenheid: eenheid, naam: naam, schalen: 'ja' }, extra || {});
  const G = 'Groente & fruit';
  return [
    {
      titel: 'Rode curry met kikkererwten', personen: 2, tijd: 35, tags: 'vega, curry, wereldkeuken',
      letop: 'Laat de kokosmelk zachtjes pruttelen en niet hard koken: dan kan hij schiften (korrelig worden). Currypasta brandt snel aan: blijf roeren.',
      ingredienten: [
        I(1, 'el', 'olijfolie', { productId: pid('Olijfolie'), afdeling: 'Sauzen & kruiden' }),
        I(2, 'el', 'rode currypasta', { productId: pid('Currypasta'), afdeling: 'Wereldkeuken' }),
        I(1, 'st', 'ui', { afdeling: G, notitie: 'gesnipperd' }),
        I(2, 'teen', 'knoflook', { afdeling: G, notitie: 'fijngehakt' }),
        I(400, 'ml', 'kokosmelk', { productId: pid('Kokosmelk'), afdeling: 'Wereldkeuken' }),
        I(1, 'blik', 'kikkererwten', { afdeling: 'Conserven', notitie: 'uitgelekt' }),
        I(200, 'g', 'spinazie', { afdeling: G }),
        I(1, 'st', 'limoen', { afdeling: G }),
        I(150, 'g', 'basmatirijst', { productId: pid('Basmatirijst'), afdeling: 'Pasta & rijst' })
      ],
      stappen: [
        { tekst: 'Snipper de ui en hak de knoflook fijn. Laat de kikkererwten uitlekken.' },
        { tekst: 'Kook de basmatirijst volgens de verpakking.', timer: 12 },
        { tekst: 'Verhit de olie in een hapjespan en bak de ui zacht en glazig.', timer: 4 },
        { tekst: 'Voeg de currypasta en knoflook toe en bak al roerend tot het geurt.', timer: 2, letop: 'Blijf roeren: currypasta brandt snel aan en wordt dan bitter.' },
        { tekst: 'Schenk de kokosmelk erbij, voeg de kikkererwten toe en laat zachtjes pruttelen.', timer: 10, letop: 'Zacht laten pruttelen, niet hard koken: anders kan de kokosmelk schiften.' },
        { tekst: 'Roer de spinazie erdoor tot hij geslonken is. Breng op smaak met limoensap en zout. Serveer met de rijst.' }
      ]
    },
    {
      titel: 'Tomatensoep met basilicum', personen: 4, tijd: 40, tags: 'vega, soep',
      letop: 'Hete soep pureren: vul een blender hooguit half en laat het dopje los, anders spuit hij eruit. Een staafmixer is veiliger.',
      ingredienten: [
        I(1, 'el', 'olijfolie', { productId: pid('Olijfolie'), afdeling: 'Sauzen & kruiden' }),
        I(2, 'st', 'ui', { afdeling: G }),
        I(2, 'teen', 'knoflook', { afdeling: G }),
        I(1, 'el', 'tomatenpuree', { productId: pid('Tomatenpuree'), afdeling: 'Conserven' }),
        I(800, 'g', 'tomaten in blik', { productId: pid('Tomaten in blik'), afdeling: 'Conserven' }),
        I(750, 'ml', 'groentebouillon', { afdeling: 'Sauzen & kruiden', notitie: 'van 1½ blokje' }),
        I(1, 'tl', 'suiker', { afdeling: 'Ontbijt' }),
        I(1, 'bos', 'basilicum', { afdeling: G }),
        I('', 'naar smaak', 'zout en peper', { productId: pid('Zout'), schalen: 'nee', afdeling: 'Sauzen & kruiden' })
      ],
      stappen: [
        { tekst: 'Snipper de uien en hak de knoflook. Fruit ze zacht in de olie.', timer: 5 },
        { tekst: 'Bak de tomatenpuree een minuutje mee.', timer: 1 },
        { tekst: 'Voeg de tomaten, bouillon en suiker toe en laat zachtjes koken.', timer: 20 },
        { tekst: 'Voeg de basilicum toe en pureer de soep glad.', letop: 'Blender hooguit half vullen en dopje los, of gebruik een staafmixer.' },
        { tekst: 'Breng op smaak met zout en peper.' }
      ]
    },
    {
      titel: 'Pasta pomodoro', personen: 2, tijd: 25, tags: 'vega, pasta, snel',
      letop: 'Knoflook op laag vuur: wordt hij bruin, dan wordt de saus bitter.',
      ingredienten: [
        I(200, 'g', 'spaghetti', { afdeling: 'Pasta & rijst' }),
        I(3, 'el', 'olijfolie', { productId: pid('Olijfolie'), afdeling: 'Sauzen & kruiden' }),
        I(2, 'teen', 'knoflook', { afdeling: G, notitie: 'in plakjes' }),
        I(400, 'g', 'tomaten in blik', { productId: pid('Tomaten in blik'), afdeling: 'Conserven' }),
        I(1, 'snufje', 'chilivlokken', { schalen: 'nee', afdeling: 'Sauzen & kruiden' }),
        I(4, 'takje', 'basilicum', { afdeling: G }),
        I(30, 'g', 'Parmezaanse kaas', { afdeling: 'Kaas', notitie: 'of een vegan alternatief' }),
        I('', 'naar smaak', 'zout', { productId: pid('Zout'), schalen: 'nee', afdeling: 'Sauzen & kruiden' })
      ],
      stappen: [
        { tekst: 'Breng ruim water met flink zout aan de kook en kook de spaghetti volgens de verpakking.', timer: 10 },
        { tekst: 'Verwarm de olie zachtjes en bak de knoflook kort.', timer: 2, letop: 'Laag vuur: bruine knoflook maakt de saus bitter. Liever iets te vroeg de tomaten erbij.' },
        { tekst: 'Voeg de tomaten en chilivlokken toe, plet de tomaten en laat inkoken.', timer: 10 },
        { tekst: 'Bewaar een kopje pastawater. Giet de pasta af en meng met de saus en een scheutje pastawater. Basilicum en kaas erover.' }
      ]
    },
    {
      titel: 'Shakshuka', personen: 2, tijd: 30, tags: 'vega, eieren, ontbijt',
      letop: 'Te dunne saus? Dan lopen de eieren weg: eerst goed laten inkoken. Haal de pan van het vuur zodra het eiwit net gestold is, de dooiers garen nog door.',
      ingredienten: [
        I(1, 'el', 'olijfolie', { productId: pid('Olijfolie'), afdeling: 'Sauzen & kruiden' }),
        I(1, 'st', 'ui', { afdeling: G }),
        I(1, 'st', 'rode paprika', { afdeling: G }),
        I(2, 'teen', 'knoflook', { afdeling: G }),
        I(1, 'tl', 'komijn (gemalen)', { afdeling: 'Sauzen & kruiden' }),
        I(1, 'tl', 'paprikapoeder', { afdeling: 'Sauzen & kruiden' }),
        I(400, 'g', 'tomaten in blik', { productId: pid('Tomaten in blik'), afdeling: 'Conserven' }),
        I(4, 'st', 'eieren', { afdeling: 'Zuivel & eieren' }),
        I(2, 'takje', 'peterselie', { afdeling: G }),
        I(1, 'st', 'brood', { afdeling: 'Brood', notitie: 'om te dippen' })
      ],
      stappen: [
        { tekst: 'Snipper de ui, snijd de paprika in reepjes en bak ze zacht in de olie.', timer: 8 },
        { tekst: 'Voeg knoflook, komijn en paprikapoeder toe en bak kort mee.', timer: 1, letop: 'Specerijen kort bakken: ze branden snel.' },
        { tekst: 'Voeg de tomaten toe en laat inkoken tot een dikke saus.', timer: 10, letop: 'Echt laten inkoken: in een dunne saus lopen de eieren weg.' },
        { tekst: 'Maak kuiltjes, breek de eieren erin, deksel erop en laat op laag vuur garen.', timer: 7, letop: 'Van het vuur zodra het eiwit net gestold is: de dooier gaart nog door.' },
        { tekst: 'Strooi de peterselie erover en serveer met brood.' }
      ]
    }
  ];
}


// ---------- Hulpfuncties voor de tabbladen ----------

function ss() { return SpreadsheetApp.getActiveSpreadsheet(); }

const KOPPEN_GECONTROLEERD = {};
function blad(naam) {
  let s = ss().getSheetByName(naam);
  if (!s) {
    s = ss().insertSheet(naam);
    s.getRange(1, 1, 1, TABELLEN[naam].length).setValues([TABELLEN[naam]]).setFontWeight('bold');
    s.setFrozenRows(1);
  } else if (!KOPPEN_GECONTROLEERD[naam]) {
    // Nieuwe kolommen (zoals 'erbij') krijgen vanzelf hun kopje in rij 1.
    const breed = TABELLEN[naam].length;
    const kop = s.getRange(1, 1, 1, breed).getValues()[0];
    if (kop.some((k, i) => String(k) !== TABELLEN[naam][i])) s.getRange(1, 1, 1, breed).setValues([TABELLEN[naam]]).setFontWeight('bold');
  }
  KOPPEN_GECONTROLEERD[naam] = true;
  return s;
}

// Lijst met recept-ID's ("r1,r2"). Bij het weekmenu betekent "-" bewust: vandaag niets erbij.
function erbijLijst(waarde, magLeegTeken) {
  const w = String(waarde || '').trim();
  if (magLeegTeken && w === '-') return '-';
  return w.split(',').map(x => x.trim()).filter(x => /^r[a-z0-9]{6,24}$/.test(x)).slice(0, 6).join(',');
}

function lees(naam) {
  const s = blad(naam);
  const velden = TABELLEN[naam];
  const last = s.getLastRow();
  if (last < 2) return [];
  return s.getRange(2, 1, last - 1, velden.length).getValues()
    .map(rij => { const o = {}; velden.forEach((v, i) => { o[v] = alsTekst(rij[i]); }); return o; })
    .filter(o => Object.keys(o).some(k => o[k] !== ''));
}

function naarRij(naam, o) {
  return TABELLEN[naam].map(v => {
    const w = o[v] === undefined || o[v] === null ? '' : String(o[v]);
    return w.charAt(0) === '=' ? "'" + w : w;
  });
}

function voegToe(naam, objs) {
  if (!objs.length) return;
  const s = blad(naam);
  const r = s.getRange(s.getLastRow() + 1, 1, objs.length, TABELLEN[naam].length);
  r.setNumberFormat('@');
  r.setValues(objs.map(o => naarRij(naam, o)));
}

function schrijfAlles(naam, objs) {
  const s = blad(naam);
  const breed = TABELLEN[naam].length;
  const last = s.getLastRow();
  if (last >= 2) s.getRange(2, 1, last - 1, breed).clearContent();
  if (!objs.length) return;
  const r = s.getRange(2, 1, objs.length, breed);
  r.setNumberFormat('@');
  r.setValues(objs.map(o => naarRij(naam, o)));
}

function werkBij(naam, wie, wijzigingen) {
  const rijen = lees(naam);
  const r = rijen.find(wie);
  if (!r) throw new Error('Niet gevonden.');
  Object.assign(r, wijzigingen);
  schrijfAlles(naam, rijen);
}

function verwijderRijen(naam, wie) {
  schrijfAlles(naam, lees(naam).filter(r => !wie(r)));
}

function pick(o, sleutels) {
  const uit = {};
  sleutels.forEach(k => { if (o[k] !== undefined) uit[k] = String(o[k]); });
  return uit;
}

function alsTekst(v) {
  if (v instanceof Date) {
    const uren = v.getHours() + v.getMinutes();
    return Utilities.formatDate(v, Session.getScriptTimeZone(), uren ? 'dd-MM-yyyy HH:mm' : 'yyyy-MM-dd');
  }
  return v === null || v === undefined ? '' : String(v);
}

function nuTekst() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd-MM-yyyy HH:mm'); }
function nieuwId(prefix) { return prefix + Utilities.getUuid().replace(/-/g, '').slice(0, 11); }
function rond(n) { return Math.round(n * 100) / 100; }

let slotVast = false;
function metSlot(fn) {
  if (slotVast) return fn();
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  slotVast = true;
  try { const uit = fn(); SpreadsheetApp.flush(); return uit; }
  finally { slotVast = false; lock.releaseLock(); }
}

function geldigeCode(token) {
  const code = PropertiesService.getScriptProperties().getProperty('SECRET_TOKEN');
  return !!code && String(token || '').trim() === code;
}

function verbindingstest() {
  const code = PropertiesService.getScriptProperties().getProperty('SECRET_TOKEN');
  const namen = ss().getSheets().map(s => s.getName());
  const ontbreekt = Object.keys(TABELLEN).filter(n => namen.indexOf(n) === -1);
  return 'Recepten-script versie ' + VERSIE +
    '\nSpreadsheet: ' + ss().getName() +
    '\nToegangscode: ' + (code ? 'ingesteld' : 'ONTBREEKT (zet SECRET_TOKEN bij de scripteigenschappen)') +
    '\nTabbladen: ' + (ontbreekt.length ? 'ONTBREKEN: ' + ontbreekt.join(', ') + ' (voer installeer() uit)' : 'allemaal aanwezig') +
    (code && !ontbreekt.length ? '\nVERBINDING OK' : '');
}

function tekst(t) { return ContentService.createTextOutput(t).setMimeType(ContentService.MimeType.TEXT); }
function json(d) { return ContentService.createTextOutput(JSON.stringify(d)).setMimeType(ContentService.MimeType.JSON); }
function jsonp(cb, d) { return ContentService.createTextOutput(cb + '(' + JSON.stringify(d) + ');').setMimeType(ContentService.MimeType.JAVASCRIPT); }
