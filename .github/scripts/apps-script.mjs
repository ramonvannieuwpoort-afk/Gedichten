// Synchroniseert de Apps Script-projecten met de map apps-script/.
//   node apps-script.mjs ophalen   -> haalt de huidige code uit Google naar de repo
//   node apps-script.mjs uitrollen -> zet de code uit de repo in Google en werkt de web-app bij
// Welke projecten: apps-script/projecten.json (gekoppeld via de deployment-ID uit de web-app-URL).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = path.resolve("apps-script");
const LIJST = path.join(ROOT, "projecten.json");
const projecten = JSON.parse(fs.readFileSync(LIJST, "utf8"));
const actie = process.argv[2];
const sha = (process.env.GITHUB_SHA || "").slice(0, 7);

function clasp(args, cwd) {
  return execFileSync("clasp", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}
function claspJson(args, cwd) {
  const uit = clasp(["--json", ...args], cwd);
  const a = uit.indexOf("["), b = uit.lastIndexOf("]");
  if (a === -1 || b === -1) throw new Error("Onverwachte uitvoer van clasp: " + uit.slice(0, 300));
  return JSON.parse(uit.slice(a, b + 1));
}
function schrijfConfig(dir, scriptId) {
  fs.mkdirSync(path.join(dir, "src"), { recursive: true });
  fs.writeFileSync(path.join(dir, ".clasp.json"), JSON.stringify({
    scriptId, rootDir: "src", scriptExtensions: [".gs"], htmlExtensions: [".html"], jsonExtensions: [".json"]
  }, null, 2) + "\n");
}
function bestanden(dir) {
  const uit = [];
  (function loop(d) {
    for (const n of fs.readdirSync(d).sort()) {
      const p = path.join(d, n);
      if (fs.statSync(p).isDirectory()) loop(p); else uit.push(p);
    }
  })(dir);
  return uit;
}
function hashVan(srcDir) {
  const h = crypto.createHash("sha256");
  for (const f of bestanden(srcDir)) { h.update(path.relative(srcDir, f) + "\0"); h.update(fs.readFileSync(f)); h.update("\0"); }
  return h.digest("hex");
}
// Haalt de code die nu in Google staat op in een tijdelijke map en geeft de hash terug.
function hashOpGoogle(scriptId) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "as-"));
  schrijfConfig(tmp, scriptId);
  clasp(["pull"], tmp);
  const h = hashVan(path.join(tmp, "src"));
  fs.rmSync(tmp, { recursive: true, force: true });
  return h;
}
function zoekScriptIds() {
  const zoek = projecten.filter(p => !p.scriptId);
  if (!zoek.length) return;
  console.log("Script-ID's zoeken via de deployment-ID's…");
  const scripts = claspJson(["list"], os.tmpdir());
  console.log(`  ${scripts.length} losse scripts gevonden in Google Drive.`);
  for (const s of scripts) {
    if (zoek.every(p => p.scriptId)) break;
    let deps = [];
    try { deps = claspJson(["list-deployments", s.id], os.tmpdir()); }
    catch (e) { console.log(`  "${s.name}": implementaties opvragen mislukt: ${String(e.stderr || e.message).split("\n")[0]}`); continue; }
    for (const p of zoek) if (!p.scriptId && deps.some(d => d.deploymentId === p.deploymentId)) {
      p.scriptId = s.id;
      console.log(`  ${p.map}: gevonden in "${s.name}" (${s.id})`);
    }
  }
  for (const p of zoek) if (!p.scriptId) console.log(`::warning::Geen Apps Script-project gevonden voor ${p.map} (deployment ${p.deploymentId}).`);
  fs.writeFileSync(LIJST, JSON.stringify(projecten, null, 2) + "\n");
}

// De repo is openbaar: geheime waarden (zoals de toegangscode) mogen nooit in de code staan.
const GEHEIMEN = (process.env.GEHEIMEN || "").split(/[\n,]/).map(s => s.trim()).filter(s => s.length >= 3);
function lektGeheim(srcDir) {
  return bestanden(srcDir).filter(f => { const t = fs.readFileSync(f, "utf8"); return GEHEIMEN.some(g => t.includes(g)); });
}

let fouten = 0;
if (actie === "ophalen") {
  if (!GEHEIMEN.length) { console.log("::error::Het geheim TOEGANGSCODES ontbreekt. Zonder die controle haal ik niets op, want de repo is openbaar. Zie apps-script/LEESMIJ.md."); process.exit(1); }
  zoekScriptIds();
  for (const p of projecten.filter(p => p.scriptId)) {
    const dir = path.join(ROOT, p.map);
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "as-"));
    schrijfConfig(tmp, p.scriptId);
    clasp(["pull"], tmp);
    const lek = lektGeheim(path.join(tmp, "src"));
    if (lek.length) {
      console.log(`::error::${p.map}: de toegangscode staat letterlijk in ${lek.map(f => path.basename(f)).join(", ")}. Niet opgehaald. Zet de code in de Scripteigenschappen (zie LEESMIJ) en probeer opnieuw.`);
      fs.rmSync(tmp, { recursive: true, force: true }); fouten++; continue;
    }
    fs.rmSync(tmp, { recursive: true, force: true });
    fs.rmSync(path.join(dir, "src"), { recursive: true, force: true });
    schrijfConfig(dir, p.scriptId);
    clasp(["pull"], dir);
    fs.writeFileSync(path.join(dir, "synchash.txt"), hashVan(path.join(dir, "src")) + "\n");
    console.log(`Opgehaald: ${p.map} (${bestanden(path.join(dir, "src")).length} bestanden)`);
  }
} else if (actie === "uitrollen") {
  const gewijzigd = (process.env.GEWIJZIGD || "ALLES").split(/\s+/).filter(Boolean);
  for (const p of projecten) {
    const dir = path.join(ROOT, p.map);
    const raakt = gewijzigd.includes("ALLES") || gewijzigd.some(f => f.startsWith(`apps-script/${p.map}/src/`));
    if (!raakt) continue;
    if (!p.scriptId || !fs.existsSync(path.join(dir, ".clasp.json"))) {
      console.log(`::error::${p.map} is nog niet opgehaald. Draai eerst de actie "ophalen".`); fouten++; continue;
    }
    const lek = lektGeheim(path.join(dir, "src"));
    if (lek.length) { console.log(`::error::${p.map}: er staat een toegangscode in de code. Niet uitgerold.`); fouten++; continue; }
    const vorige = fs.existsSync(path.join(dir, "synchash.txt")) ? fs.readFileSync(path.join(dir, "synchash.txt"), "utf8").trim() : "";
    const nu = hashOpGoogle(p.scriptId);
    if (vorige && nu !== vorige) {
      console.log(`::error::${p.map}: de code in de Apps Script-editor is veranderd sinds de laatste synchronisatie. Uitrollen gestopt zodat er niets verloren gaat. Draai eerst "ophalen" en voeg de wijzigingen samen.`);
      fouten++; continue;
    }
    clasp(["push", "-f"], dir);
    clasp(["update-deployment", p.deploymentId, "-d", `Via GitHub ${sha}`.trim()], dir);
    fs.writeFileSync(path.join(dir, "synchash.txt"), hashOpGoogle(p.scriptId) + "\n");
    console.log(`Uitgerold: ${p.map} -> deployment bijgewerkt naar een nieuwe versie`);
  }
} else {
  console.error("Gebruik: node apps-script.mjs ophalen|uitrollen"); process.exit(2);
}
process.exit(fouten ? 1 : 0);
