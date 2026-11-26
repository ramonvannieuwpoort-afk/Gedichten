# Apps Script via GitHub

De backends van de apps (Google Apps Script) staan in deze map en worden automatisch met Google gesynchroniseerd door de workflow `.github/workflows/apps-script.yml`.

| Map | App | Deployment |
|---|---|---|
| `gedichten/` | Gedichten + briefjes | zie `projecten.json` |
| `recepten/` | Recepten | zie `projecten.json` |

## Hoe het werkt
- **Ophalen** (Actions → Apps Script → Run workflow → `ophalen`): de huidige code uit Google komt in `apps-script/<map>/src/`.
- **Uitrollen** gebeurt vanzelf zodra er iets verandert in `apps-script/<map>/src/`: de code gaat naar Google en de bestaande web-app-implementatie krijgt een nieuwe versie. De URL blijft hetzelfde.
- **Beveiliging tegen overschrijven:** is er sinds de laatste synchronisatie iets veranderd in de Apps Script-editor, dan stopt het uitrollen. Draai dan eerst `ophalen`.

Vuistregel: pas de code voortaan aan in de repo, niet meer in de Apps Script-editor.

## Eenmalige instelling
1. Zet de Apps Script API aan: https://script.google.com/home/usersettings
2. Maak een Codespace op deze repo en voer daarin uit:
   `npx @google/clasp@3.4.1 login --no-localhost`
   Open de link, geef toestemming en plak de URL waarop je uitkomt (een foutpagina met `localhost` is normaal) terug in de terminal.
3. `jq -c . ~/.clasprc.json` en kopieer de ene regel die verschijnt.
4. In GitHub: Settings → Secrets and variables → Actions → New repository secret, met de naam `CLASPRC_JSON` en als waarde de gekopieerde inhoud.
5. Maak een tweede secret, `TOEGANGSCODES`, met de toegangscode(s) van de apps (meerdere codes scheiden met een komma). De workflow controleert hiermee dat die codes nooit in deze openbare repo terechtkomen.
6. Verwijder de Codespace en draai de workflow met `ophalen`.

## Toegangscode in de Scripteigenschappen
Staat de code letterlijk in het script (bijvoorbeeld `const CODE = "…"`), dan weigert `ophalen`. Oplossing in de Apps Script-editor:
1. Projectinstellingen (tandwiel) → Scripteigenschappen → eigenschap `TOEGANGSCODE` toevoegen met de code.
2. Vervang in de code de letterlijke waarde door `PropertiesService.getScriptProperties().getProperty("TOEGANGSCODE")`.

Deel de inhoud van `.clasprc.json` nooit, ook niet in een chat. Het is de sleutel tot je Apps Script-projecten.
