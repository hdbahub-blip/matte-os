# Lekfullt lager + Plugga smart – 2026-11-25

## Varför
Tonåringar stannar i appar som svarar direkt, känns personliga och aldrig skäms på dem. Vi lånar det som fungerar (Instagram-stories, Duolingo-feedback, Spotify-färg) men lämnar bort det som skadar: inga skuldkänslo-streaks, ingen förlust när man vilar, inga topplistor mot klasskompisar, inget firande på prov.

## Vad
* **Startsidan**: ämnesrutor i starka färger med mjuk entré och "tryck"-känsla. Under dem en rad story-bubblor (som Instagram) och en **Idag-ring** (0–10 frågor, nollställs varje dag, inget straff).
* **Rätt svar i övning**: konfetti-burst från knappen, kort vibration (om telefonen stöder det) och combo-toast vid 3/5/8/12 i rad. **Aldrig i provläge.**
* **Fastnat?** bredvid Ledtråd: ett ark med fyra steg (Vad frågas? → Vad vet du? → Rita/testa → Rimligt?). Inget facit.
* **Plugga smart** (`smart/`): tio korta studieteknik-stories (fastnat, testa dig själv, fokus, sprid ut, blanda, förklara, läs uppgiften, misstag, inför prov, belöna dig). Tryck höger/vänster, svep, piltangenter, Esc. Varje story slutar med något att göra direkt. Fokus-storyn har en 10/15/25-minuters timer.

## Data
`matteos.play.v1` = `{day, n, seen}`: datum, antal besvarade övningsfrågor idag och vilka stories som visats. Inga svar, namn eller frågetexter. Inte i Study Cloud.

## Tillgänglighet
Vit text på story-färger ≥ 4,5:1 (testat), 44 px mål, fokus flyttas in/ut ur arket, Esc stänger, `prefers-reduced-motion` stänger av konfetti, toasts och animationer, mörkt läge på storysidan.

## Tester
`tests/play-e2e.js` (186 kontroller i Chromium: innehållslängd och kontrast, 320/390/1280, combo och ring, prov räknas inte, riktig övning skickar `mo:answer`, Fastnat-ark, story-navigering, sett-markering, timer, reducerad rörelse, mörkt läge, manipulerad lagring).

## Ej verifierat
Ingen riktig tonåring har testat. Vibration testas inte (headless). WebKit/Firefox endast via CI-jobbens befintliga omfattning. Svenska/Engelska-sidorna (`lara/`) har inte fått bubblorna ännu.

## Återställning
Revertera commiten. Allt är additivt: en `dispatchEvent`-rad i `js/app.js`, två nya `<script>`/`<link>` i `index.html`, ny katalog `smart/`.
