# Matte OS — FULLSPEC pedagogisk och teknisk audit v5.4.8
**Datum:** 2026-10-29 · **Gren:** `feature/plain-paper-math-lessons-audit-20261029`

## Uppdrag, användarfeedback och acceptans
Aktuell användarfeedback (2026-10-28): elever tycker appen och sidorna är snygga, men begreppen, formlerna, förslagen och exemplen är för komplicerade och överstimulerande. Manuell penna-och-papper-förklaring av omkrets och area fungerade bättre. Önskade exempel: `10² = 10 × 10 = 100` och `(0,1)² = 0,1 × 0,1 = 0,01`, förklarade med ettorna, två nollor respektive två decimaler. Målet är förståelse, inte en enklare betygsnivå eller mindre provkrav.

**Kriterium:** Varje undervisningsmoment ska börja med vanliga ord, ett enda konkret exempel, två eller tre begripliga steg och klart svar. Mer avancerade fackbegrepp och formler ska vara valfria. De ursprungliga arbetsuppgifterna, nivåerna, proven, Tabellarenan och elevdata ska bevaras. Översiktsaffischer kan vara rikare eftersom de är för repetition, inte första förklaring.

## Källor och källhierarki
1. Användarens uttryckliga, färska observationsfeedback och visuellt godkända papper-och-penna-demonstration.
2. GitHub main per 2026-10-28 före grenen: `105a6499e07aa30078eeefb471983b59c824e518` (Matte OS 5.4.7; Matte Prov 1.2.4). Källfiler: `js/app.js`, `js/content8.js`, `js/content9.js`, `js/engine.js`, `js/math.js`, `js/core.js`, `sw.js`, `affischer/*`.
3. Senaste projektets Drive-handoff och skol-/bokmaterial i studiesystemets mappar. Lektionsämnen hämtas från befintliga content8/content9 och skolans plan; nyskrivna genomräknade enkla exempel är inte ordagranna kopior av läroboken.

## Audit: fynd före åtgärd
| ID | Allvar | Före | Risk | Beslut |
|---|---|---|---|---|
| P01 | Hög | `viewLesson` del 1 visade lång `idea`, diagram, `anchor` och `cue` direkt | Kräver simultan tolkning av språk, symboler och regler | Ny enkel ordning, övrigt i frivilligt `details` |
| P02 | Hög | `viewLesson` del 2 avslöjade ett steg per knapptryck och visade formel/regel före uträkning | Splittrad arbetsminneskedja | Visa genomräknade steg på en gång, flytta formel till frivillig fördjupning |
| P03 | Hög | `formulaCard` visade formeln i kortets rubrik och `formulaBody` hade när/villkor/symboler/former/regler/fälla innan fokus på exempel | Symbol-först hindrar grundförståelse | Kort språk i rubrik, konkret mini-exempel först, avancerat under fällbar sektion |
| P04 | Medel | Guidad uträkning visade begreppen Givet/Sök + metodvalsfrågor på bred vy | Tekniskt språk och flera samtidiga interaktioner | `Vi vet` och `Vi söker`; metodval frivilligt |
| P05 | Medel | Ledtråd 2 visade fullständig formel | Ännu större kognitiv belastning när eleven fastnat | Enkla ord först; full formel frivillig |
| P06 | Medel | Fel-svar-rutan kunde börja med teknisk felbeskrivning | Avbryter elevens försök | Fråga efter första lilla steget; detaljerad felhjälp efter fler försök |
| P07 | Hög | Allt användar-/elevnära innehåll användes som om det var lika självklart | Låg begriplighet trots numeriskt korrekt innehåll | 63 granskbara enklare introduktioner med exempel |
| P08 | Medel | `10²` och `(0,1)²` saknade konkret sida-vid-sida-förklaring | Risk för fel generalisering om nollor/komma | Två kolumner: ettor/nollor respektive decimalplatser |
| P09 | Medel | Geometrisk area/omkrets bygger på abstrakt formel utan tillräcklig uppdelning | Begreppsförväxling | Visuella rektanglar: markerad kant vs rutor inne i figuren |
| P10 | Låg | Professionellt formgivna affischer är informationsrika | Bra repetition men olämpliga som första lektionssida | Låt affischerna finnas kvar men tydliggör repetitionssyfte |

## Implementerad arkitektur
- `js/teach-simple.js`: **separat presentationslager** med ett avgränsat exempel och 2–3 korta steg för varje av de 63 originalmomenten, utan att ändra basdata eller facit.
- `js/app.js`: `paperSteps`, förenklad `viewLesson` steg 0 och 1, enklare formelvisning, valfri fackteori, kortare stöd och vänligare återkoppling.
- `css/app.css`: mobil-först, lugna ytor, större text, stegkort, två egna diagram, responsiv jämförelse av positiva/decimala potenser.
- `index.html`, `js/core.js`, `sw.js`: version 5.4.8 med korrekt scriptordning och offline-cache för det nya scriptet. `js/tabell-arena.js` stylesheet-query versionsjusterad.
- **Bevarat:** `content8`, `content9`, provets separata katalog, svarskontroll, alla övningsfrågor, rekommendation, proven, profilnyckel `matteos.v5`, Tabellarenans träning och affischernas respektive färgtema.

## Kontrollgrindar före release
- C01: Node syntax för befintliga och nya JS-filer.
- C02: **63/63 skill-ID** jämförda exakt med båda innehållskorpusen. Varje av de 63 har enkel förklaring, konkret fråga, 2–3 steg, tydligt svar.
- C03: Matematikkontroller `node tests/qa.js`, figurer `node tests/figure-consistency.js`, Tabellarenan `node tests/tabell-integration.js`.
- C04: Regressionstester `node tests/book-first-regression.js`, `node tests/posters-content.js`, `node tests/paper-lessons.js`.
- C05: Playwright på emulerade iPhone SE, iPhone 13 och desktop: start, 15 representativa lektioner, formelkort, omkrets/area-diagram, steg 1–3, guidad träning, frivilligt formelavsnitt, inga horisontella överflöden, tidigare affischer och prov.
- C06: Offline/PWA och lokal progressionsdata efter siduppdatering.
- C07: Kvalitetskontroll av release-commit och GitHub Pages versionsmarkör. Avstå publicering vid rött test.
- C08: **Fysisk** Safari/iPhone och verkligt elevförståelsetest kan bara slutgodkännas på elevers enheter och efter återkoppling.

## Framför allt: vad de automatiska testerna inte bevisar
Automatiska tester kan verifiera täckning, en del räkningar, DOM-struktur, flöden och sparad data. De bevisar **inte** att alla enskilda nyskrivna exempel uppfattas lätt av eleven, att alla exempel överensstämmer exakt med alla boksidor eller att UI känns lagom lugnt på verklig mobil. Det är ett separat pedagogiskt acceptansprov.

## Prioriterad verklig elevtest
1. **Åk 8:** Öppna Omkrets och Area utan att använda någon formel; låt eleven förklara med egna ord skillnaden mellan `runt` och `inuti`.
2. **Åk 8/9:** Fråga vad `10²` och `(0,1)²` betyder samt varför svaret har två nollor respektive två decimaler. Kontrollera att hon kan göra `10³` och `(0,1)³` efteråt.
3. **Öva utan stöd:** Låt eleven utföra en egen uppgift efter genomgången, kontrollera att rätt enhet anges, att inget förvirrar och att befintlig progression är kvar.

## Rollback
Vid observerat regressionsfel: revert release-commit mot före-uppdatering `105a6499e07aa30078eeefb471983b59c824e518` med GitHub PR, kontrollera Pages-distribution och offline-cache på enheten. **Rensa inte webbplatsdata/localStorage** och undvik att återställa användarprogression manuellt.

## Status
Detta dokument är en metod- och kodbaserad audit; testrun-/deploymentnummer måste fyllas med **verifierat faktisk resultat** när grenen testats. Ingen fysisk elevacceptans ingår i denna fil.

## Verifierad kontrollkörning — 2026-10-29

**Källa:** GitHub Actions [run 40786522508](https://github.com/mohamed321966-wq/matte-os/actions/runs/40786522508), head `55264bd7dc7b0c07ba5942a458095467fec616e6`. Båda jobben `unit-and-content` och `browser-mobile` slutade SUCCESS.

- 63 originalmoment (åk 8: 36, åk 9: 27) har varsin enkel intro och exempel. Nya tests `paper-lessons.js` hade **441/441 kontroller PASS** inklusive struktur, stegantal och länkning till original-ID. Observera att dessa strukturella kontroller inte ensamma bevisar matematiken i varje naturlig språkförklaring.
- Ursprunglig matematisk/verifierad övningskorpus: **9 410/9 410 kontroller PASS**; 63 genomgångna exempel och 403 uppgifter.
- Figur-/enhets- och beräkningskonsistens: **603/603 PASS**.
- Tabellarenan: **52/52 PASS**.
- Tidigare elevflöden: **57/57 PASS** via emulerad iPhone SE, iPhone 13 och desktop.
- Affischer: **396/396 PASS**, även offline.
- Nya papperslika lektioner: **335/335 PASS**: urval över 15 innehållstyper i båda årskurserna, stegvyerna, stängda frivilliga formelsektioner, fokus, responsivitet och lokal lagring efter omladdning.
- **Publicering:** ännu inte verifierad i denna commit. GitHub Pages måste kontrolleras efter merge.

**Återstående begränsning:** Fysisk iOS Safari/PWA samt elevernas egen förståelse och låg stimulansnivå är fortfarande OPEN. Ett fullständigt manuellt rad-för-rad-protokoll för samtliga 63 nyskrivna exempel jämfört med skolans varje bokuppslag ingick inte i denna testkörning. Autokontrollerad korrekthet av originalbank och handgranskade högriskexempel ersätter inte fysisk pedagogisk acceptans.
