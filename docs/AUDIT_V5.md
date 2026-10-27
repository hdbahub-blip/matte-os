# Matte OS v5 – oberoende granskning och ombyggnad

Datum: 2026-10-27 · Omfång: åk 8 och åk 9, HT-26 (v. 34–51) · Rollback: gren `rollback-v4.0.0-before-v5` (= v4 commit `547af44`)

## 1. Vad jag hittade i v4 (allvarlighetsgrad)

| # | Fel | Grad |
|---|-----|------|
| 1 | Hela appen var **en 287 kB HTML-fil** med tre lager av påbyggda patchar (v2 → v3 → v4) som överskrev varandra i CSS och JS. Ingen modul gick att testa isolerat. | P0 (arkitektur) |
| 2 | "Vad vet jag / vad söker jag" **gissades fram med regex ur frågetexten**. Det är just den mekanismen som gav "42 · 71 m"-buggen – felklassen fanns kvar, bara det kända fallet var lappat. | P0 (matematik) |
| 3 | Innehållet var tunt: **147 uppgifter, 1–2 ledtrådar per uppgift, samma generiska felmeddelande** ("Kontrollera vilket steg som ändrade värdet") på nästan alla. Ingen missuppfattnings­återkoppling. | P0 (pedagogik) |
| 4 | Ingen progression A→F: nästan alla uppgifter var "samma som exemplet med nya siffror". Baklänges-uppgifter och igenkänningsuppgifter saknades för de flesta moment. | P1 |
| 5 | Uttrycksuppgifter (algebra) jämfördes som text – `2(x+3)` och `2x+6` kunde inte bedömas som ekvivalenta på ett styrt sätt; faktorisering kunde inte skilja `2(4x−6)` från `4(2x−3)`. | P1 |
| 6 | Startsidans huvudknapp ("Fortsätt här") låg **under den flytande bottenmenyn** på iPhone (390×664) – den viktigaste knappen syntes inte utan scroll. | P1 (mobil) |
| 7 | Lektionsvyn: förklaringstexten var satt i ~32 px fetstil, bilden hamnade under skärmkanten, tillbaka-länken klipptes av headern. | P1 |
| 8 | Bilder var ofta generiska ("? + ? + ?") och inte kopplade till uppgiftens data; flera moment saknade egen bild. | P1 |
| 9 | Ingen riktig provanalys per missuppfattning, ingen hantering av restprovsdatum som påverkar rekommendationen. | P2 |

## 2. Designbeslut

- **Explicit data i stället för textanalys.** Varje uppgift har nu `given` och `find` skrivna för hand. Det finns ingen parser som kan hitta på enheter – buggklassen är borttagen, inte lappad.
- **Varje facit har en oberoende beräkning** (`calc`) som testet räknar om. Avrundning anges i frågan och kontrolleras.
- **Modulär statisk app** utan byggsteg: `math.js` (formelrendering + svarskontroll), `visuals.js` (45 diagramtyper), `content9.js`/`content8.js` (innehåll), `engine.js` (lagring, nivåer, rekommendation, sök), `app.js` (gränssnitt). Inga externa beroenden, ingen molntjänst.
- **Skolplanen styr**: rekommendationen väljer kapitel efter (1) restprov med datum inom 14 dagar, (2) kapitelprov inom 3 veckor, (3) det som undervisas nu. Inom kapitlet: första moment i skolans ordning som eleven inte klarar själv.
- **Stöd som tonar ut**: Fatta → Se exempel (steg för steg med "tänk först") → Prova med stöd (Vet/Söker → välj uträkning → räkna) → Gör själv (3 st, A → B → C/baklänges) → blandträning → provläge utan ledtrådar.
- **Ledtrådar i tre nivåer, en i taget**: Sortera (vet/söker) → Känn igen + regel → Starta så här → Lösning.

## 3. Vad som togs bort
Dashboards med flera likvärdiga knappar, generiska "Kontrollera vilket steg…"-meddelanden, XP/poäng, bottenmeny inne i uppgifter, stora serifrubriker i lärinnehåll, v3/v4-förhandsfiler.

## 4. Vad som lades till
- **Formelsamling** (49 kort): titel + huvudformel hopfällt; utfällt: När? · bild · symbolernas betydelse · formeln åt olika håll (42 moment) eller beslutsregler (7 moment där en "baklängesformel" vore falsk) · exempel · vanlig fälla · länk till genomgång/träning.
- **262 uppgifter** (49 guidade + 213 övningar) + 49 genomgångna exempel. Nivåer: A 49 · B 40 · C 46 · D 29 · F 49.
- **234 missuppfattnings-fällor** med egen återkoppling (t.ex. 169 i Pythagoras → "Du har hittat c², ta roten"; längdfaktor i stället för k² → "Area ändras i två dimensioner"), plus generella detektorer för tecken, kvadrat-i-stället-för-rot, decimaltecken flyttat fel antal steg, fel enhet och avrundning.
- **Algebra­bedömning** via numerisk ekvivalens: `2(x+3)` = `2x+6`; formkrav (faktoriserad/utvecklad) och kontroll av *fullständig* faktorisering.
- **Provläge** utan ledtrådar/metodnamn + analys per moment med de missuppfattningar som uppstod.
- **Restprov** med datum (saknas tills det läggs in – inget hittas på), beredskap och prioritet.
- **Sök med elevens egna ord** ("triangel sida" → Pythagoras, "x båda sidor", "rabatt").
- **Säkerhetskopia** (dela/ladda ner fil) + återställning, även från v4-format. Tyst migrering av v4-framsteg från IndexedDB.
- **Personligt namn lokalt** (sparas bara på enheten, aldrig i koden).
- Teman: åk 9 vinröd, åk 8 marinblå med vinröd accent.

## 5. Matematisk QA – `node tests/qa.js`
49 moment · 262 uppgifter · 6 558 automatiska kontroller, 0 fel. Per uppgift: oberoende beräkning = facit (inkl. avrundning), kanoniskt svar godkänns, punkt/komma/enhet godkänns, ekvivalent bråk godkänns, tre rimliga felsvar underkänns, fel enhet flaggas, varje fälla underkänns och ger *sitt* meddelande, varje diagram renderas utan NaN.
Manuell granskning gjordes dessutom av alla diagram (galleri över ~400 bilder) – fel som hittades och rättades: konjugatregeln visade `2x²` i stället för `(2x)²`, faktoriseringen visade `4(2x + −3)`, skalpilen pekade fel håll vid verklighet → bild, avklippta etiketter.

## 6. Mobil QA – `node tests/e2e.js <url>`
Playwright/Chromium med iPhone 13 (390×664), iPhone SE (320×568) och desktop (1280×860): 713 kontroller, 0 fel. Bl.a. huvudknapp ovanför menyn utan scroll, header i en rad (MATTE OS vänster, sök/profil höger), ingen horisontell overflow på någon skärm, ingen bottenmeny i fokusläge, Kontrollera-knappen synlig med ~360 px synlig höjd (tangentbord), formel inom 2 tryck, alla 49 lektioner genomspelade i UI, offline-start via service worker.

## 7. Kvarstående begränsningar
- Testat i Chromium med iPhone-profiler – **inte på en fysisk iPhone/Safari**. Safari-specifikt (tangentbordets exakta höjd, "Lägg till på hemskärmen", 100dvh) bör provas på riktig telefon.
- Formelrenderaren är egenbyggd (lätt, offline). Den täcker bråk, rötter, potenser, index – inte matriser eller n:te rötter.
- Innehållet är skrivet och maskinkontrollerat men **inte granskat av en lärare** mot exakt läroboken. Sidhänvisningar ur planen finns inte med i appen.
- Restprovsdatum och exakta provdatum är okända och måste läggas in lokalt.
- Inga verkliga elevtester har gjorts; "15–16-åringsperspektivet" är en designbedömning.

## v5.1.0 – restavstämning mot originalplanerna

Utgångsläge v5.0.0: 49 moment / 262 uppgifter. Avstämning mot Drive-originalen visade 3 saknade (mer om kvadratrötter, division med kvadratrötter, andragradsekvationer) och 11 delvis täckta punkter. v5.1.0: 63 moment (Åk 9: 27, Åk 8: 36), 403 uppgifter (guidade + övning), 14 nya diagramtyper (58 totalt), nya svarstyper `roots` (lösningsmängd) och `radical` (exakt k√n). Fullständig matris: `docs/COVERAGE_V5_1.md`. Förmågetaggar (`ab`) och motexempel/motiveringsuppgifter tillagda (R/K) – se `node tests/qa.js`.

Kvarstående gränser: andragradsekvationer begränsade till x²=a, ax²+b=c (pq-formel ej belagd i planen) [FA]; Åk 8-PDF veckoordning 40–46 overifierad visuellt [FA]; ej testat på fysisk iPhone; ingen lärargranskning.
