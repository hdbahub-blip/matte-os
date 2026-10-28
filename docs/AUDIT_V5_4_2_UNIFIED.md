# Matte OS v5.4.4 + Matte Prov v1.2.3 — independent cross-site audit

Datum: 2026-10-27
Resultat: **ACCEPT_BOUNDED_CORE / HOLD_PHYSICAL_MOBILE_ACCEPTANCE**.

## Systemgräns (user requirement)
**Matte OS** är den enda dagliga undervisnings- och träningsappen. Den använder samma profil, progression, formelsamling och lokal säkerhetskopia för huvudlektioner, tabeller, individuell tabellträning, blandad tabellutmaning och duell.

**Matte Prov** är den enda fristående webbplatsen för formella diagnoser och kapitelprov utan hjälpmedel. Huvudsidans provknappar leder nu till denna separata provmiljö, med rätt årskurs och kapitel valda i adressen. Det gamla inbyggda testläget lämnas kvar i koden för kompatibilitet men exponeras inte via de vanliga testknapparna.

Legacy `/matte-os/tabell/` visar en kort vidarebefordran till `/matte-os/#/tabell/home`. Ingen elev ska behöva använda en separat tabelladress för daglig träning.

## Fastställda avvikelser och korrigeringar

1. **Splittrad träning / extra navigation.** Tidigare `/tabell/` hade egen HTML, eget sidhuvud och egen navigation. Nu är Tabellarenan en intern Matte OS-vy under `#/tabell/*`; den delar profil, progress och backup. Designen kapslas i Shadow DOM för att inte ändra formler, lektioner och andra Matte OS-vyer.
2. **Instabila SPA-klickreferenser i extern browser-QA.** Tabellval och träningsstart är nu vanliga `href="#/tabell/..."`-länkar. Detta gör dem direktlänkbara och mindre beroende av event delegation. Browser-QA före ändringen fick stale element-ID; hela efterföljande browsergenomspelningen återstår.
3. **Fel enhet i takuppgift (P0 för begriplighet).** Frågan använder 8 m och 5 m, medan två figurvarianter skrev cm. Explicit `unit: 'm'` har lagts in i innehållet, och provfigurerna väljer enheten från uppgiftens `given`-data när de finns.
4. **Fel geometrityp (P0).** Två uppgifter om korsande linjer/vertikal-/sidovinklar använde figurtexten `parallella` i lärappen. Nu skiljs `single: true` från parallella linjer; figurerna och deras alternativa text skiljer dem åt.
5. **Vinkelpositioner i provfigurer.** Korsande linjer genereras med vinkelgeometri grundad i `acute`; parallella linjers regionetiketter 1–8 har flyttats till rätt korsningar.
6. **Fel dimensionerad kvadrat i prov.** Tidigare kvadratbilden var bredare än hög. Nu är den 150 × 150 i skärmkoordinater och visar båda lika sidor.
7. **Provbild visade cm i cm/m-skillnad.** Provets Pythagorasfigur tar nu längdenhet från explicita given-värden, inte en gissande bokstavssökning i frågetexten.
8. **Prov- och lärappens offline-cache störde varandra (P0 drift).** Service workers rensar nu bara sin egen cache-namnrymd. Huvudappens worker tillåts inte behandla prov- eller legacy-tabellnavigering som huvudappens `index.html`. Tabellarenans resurser ligger i huvudappens PWA-scope.
9. **Två olika provmiljöer i användargränssnittet.** Vanliga testknappar i Matte OS öppnar nu Matte Prov med `?g=grade…&ch=…`, i stället för att skapa ett konkurrerande testläge i lärappen.

## Kvantitativ datakontroll av källkoden
Direkt utvärdering av `js/content8.js`, `js/content9.js`, `js/math.js`, `js/visuals.js`, `prov/js/exam-core.js` och `prov/js/exam-visuals.js`:

- 63 undervisningsmoment (36 åk 8, 27 åk 9).
- 403 uppgifter totalt: 63 guidade + 340 fristående övningsuppgifter.
- 63 kompletta formelkort med betydelse, användning, exempel, vanlig fälla och regler/former.
- 297 numeriska uppgifter med oberoende uttrycksberäkning jämförda mot lagrat facit.
- 288 undervisningsfigurer renderades utan `NaN` eller `undefined`.
- 404 specialiserade felsvars-/missuppfattningsfällor i uppgiftsbankens metadata.
- 360 diagnostik-/provurval från 2 årskurser × 3 kapitel × 2 lägen × 30 seeds; 4 290 uttagna frågor; samtliga 360 uppfyllde full momenttäckning och dubblettfrihet.
- 130 geometriövningar, 70 provfigurer, inga upptäckta formel- eller numeriska facitläckor vid automatisk textextraktion.
- Alla 403 uppgifters kanoniska svar accepterades av deterministisk kontrollfunktion.
- Nio relevanta JS-moduler kompilerade syntaktiskt efter ändringarna.

Automatiska kontroller **bevisar inte** att alla figurer är visuellt och pedagogiskt perfekta. De kompletteras av riktade semantiska regressionskontroller i `tests/figure-consistency.js`.

## Live / drift
- Huvudapp: https://mohamed321966-wq.github.io/matte-os/ — build **5.4.4**
- Integrerad Tabellarena: https://mohamed321966-wq.github.io/matte-os/#/tabell/home
- Separat provsida: https://mohamed321966-wq.github.io/matte-os/prov/ — build **1.2.3**
- Rollback-gren före ingreppen: `rollback-before-unified-matte-os-full-audit-20261027` från commit `dcf67e922f919a71b82e5754ea6a68d1c6f80080`.

## Korrigering under final acceptance (v5.4.3)
En sista simulerad genomspelning upptäckte ett verkligt Shadow DOM-fel: duellens inställning sökte `dueltable` på `document`, men efter integrationen ligger den inne i komponenten. Detta är rättat till `shadow.getElementById('dueltable')`.

Ny reproducerbar regressionssvit: `tests/tabell-integration.js`, körs med `node tests/tabell-integration.js`.
En isolerad genomspelning direkt mot källkoden passerade **51/51 kontroller**, inklusive:
- alla 100 n×k-svar för tabell 1–10;
- direktlänk `#/tabell/practice/7`, 10 uppgifter och svar/återkoppling/resultat;
- 20 frågor utan direkt facit i blandat läge;
- duellstart, första buzzer, övertag vid felsvar, poäng och resultat efter 10 rundor;
- ingen duellpoäng i elevens tabellprogress;
- sparade pass i Matte OS-backup.

Extern livebrowser bekräftade efter integration att direktlänkad 7:an-träning faktiskt öppnas i Matte OS med frågeräknare 1/10 och matematiskt korrekt text; den kunde däremot inte mata in ett svar eftersom webbläsarautomationen återkommande rapporterade *stale element IDs*. Detta är fortsatt en separat oavslutad UI-acceptansgrind.

## Verifieringsgränser / acceptance gate
1. Browser-QA bekräftade att hela tabellkortvyn och 7:ans tio uträkningar nu finns inuti huvudappens URL och navigation. Klickverktyget tappade därefter elementreferenser i tidigare körningar. Efter ombyggnad till native interna länkar krävs en ny full live-klickrunda.
2. Hela provflödet till inlämning/återkoppling på båda årskurserna har kodkontroller men ännu inte oberoende realbrowsergenomspelats efter denna release.
3. Faktisk Safari/iPhone, mjukt tangentbord, tabellarena-duell på en fysisk telefon och offline-återinträde är inte fysiskt testade.
4. Alla individuella diagram har inte okulärgranskats mot originalböckernas figurer. Visuell revideringskontroll kräver skärmbilder/fysisk elevanvändning och i känsliga fall pedagog.
5. Fullständig läroplan mot höstterminens dokument bygger på tidigare verifierad 91-punkts source→skill-matris (84 COMPLETE, 7 PARTIAL, 0 MISSING); ingen ny skollärargranskning har genomförts i denna revision.
6. Formell provtid lämnas avsiktligt obestämd; tidigare påhittad 45-minuterstid togs bort.

## Nästa acceptance
Använd en fysisk iPhone för en hel Åk 8/9-mattegenomgång, ett 10-frågors tabellpass, ett blandtest och en 10-rundors touchduell. Genomför därefter separat geometri-diagnos i Matte Prov. Kontrollera svar, övergångar, symboler, lokalt sparande och offline. Först då kan FINAL PRODUCT ACCEPTED diskuteras.


## Oberoende efterkontroll 2026-10-28
Följande kontroller gjordes mot aktuell `main` efter release och separat från de tidigare redovisade kontrollerna:

- Matte OS Tabellarenan kördes igenom med simulerat Shadow DOM/lokal elevstate: **52/52 godkända kontroller**; alla 10 tabelluppslagningar, en fullständig 10-frågors 7:an-runda, ett 20-frågors blandprov utan direkt feedback, en 10-rundors duell med övertag efter fel, rätt poäng, separat elevprogress och backup.
- Matte Prov **v1.2.2** öppnades i verklig extern browser med `?g=grade8&ch=f8-geo`: direktval Åk 8/Geometri PASS, Diagnos **15 frågor** PASS, inga ledtrådar/formler/timer/direkt rättning PASS, frågetext och `0,6 km² → ? ha`-figur renderades utan upptäckt klippning, navigering 1/15 → 2/15 PASS.
- Vid en ytterligare PWA-kontroll visade det sig att huvudarbetarens fetch-handler bara undantog **navigering** till prov/legacy, inte andra resursanrop. Den är nu hårdare isolerad: **alla** requests under `/prov/` och legacy `/tabell/` lämnas till deras egna nät-/service-worker-flöden. Versionens `sw.js`-innehåll ändrades; buildmarkören är fortsatt Matte OS 5.4.3.
- Revisionsrapporten är en verifierad **teknisk och pedagogisk strukturgranskning**, inte en garanti att samtliga 288 individuella undervisningsfigurer eller samtliga elevtexter har granskats okulärt på riktig iPhone.

Slutstatus oförändrad: **ACCEPT_BOUNDED_CORE / HOLD_PHYSICAL_MOBILE_ACCEPTANCE**.


## Självständig post-release precision revision 2026-10-28 — v5.4.4 / v1.2.3

Denna extra revisionsomgång efter v5.4.3 fokuserade på kvarvarande geometrisk semantik, tydlig lär-/provseparation och användbarhet på dagliga träningsytan.

**Korrigerat**
- En triangel med markerad 90°-vinkel ritas nu faktiskt som en rätvinklig triangel på rätt hörn, inte bara med en 90°-etikett på en sned triangel. Figuren för en likbent triangel har en centralt placerad toppunkt.
- Provsidans två parallella linjer och transversal ritas med samma lutningslogik och rätt regionsnumrering 1–8 som undervisningsbilden. Tidigare var diagonalen lutad åt motsatt håll och vinkel 2 kunde därför ritas som den spetsiga vinkeln trots att den gavs som 115°.
- Vinklar runt en punkt med givna 90° och 110° byggs från explicita vinkelriktningar; den okända sista sektorn lämnas med frågetecken.
- Åk 8/Åk 9-val via direktlänk till Matte Prov skriver inte över ett senare manuellt profilval vid omladdning.
- Multiplikationsarenan kan även öppnas direkt från Matte OS:s flik **Träna**; inte enbart från startsidan.
- Om den integrerade arenan inte kan monteras visas en säker återgång till Matte OS i stället för en tom vy.

**Reproducerade QA-körningar med aktuella källmoduler**
- `tests/qa.js`: **9 410/9 410** godkända matematik-/innehållskontroller; 63 moment, 403 uppgifter och 91-punktsmatris **84 COMPLETE / 7 PARTIAL / 0 MISSING**.
- `tests/figure-consistency.js`: **603/603** godkända semantiska figur-/enhets-/matematikregressioner; 288 undervisnings-SVG, 403 uppgifter och 297 oberoende numeriska beräkningar.
- `tests/tabell-integration.js`: **52/52** godkända simulerade Shadow DOM-flöden för tabellval, träning, blandning, duell, rättning och elevprogress.
- Ytterligare generering av 360 diagnos-/kapitelprov omfattade 4 290 valda frågor med full momenttäckning och utan dubbletter.
- Samtliga ändrade JavaScript-moduler syntaxkontrollerades. Revisionskörningarna utfördes med aktuella GitHub-filer i en isolerad JavaScript-runtime med moduladapter; de är inte samma sak som fysisk Safari-E2E.

**Kvarstår uttryckligen:** En komplett visuellt observerad mobilgenomspelning, en faktisk iPhone/Safari/PWA/offline-kontroll, mänsklig granskning av alla individuella matematikfigurer i skilda uppgiftssammanhang samt direkt observation av de två elevernas begriplighet. Extern webbläsarautomation har tidigare tappat klickreferenser i Shadow DOM; detta är inte samma sak som ett bekräftat elevklickfel och kräver separat fysisk kontroll. Påståenden om att hela läsåret är täckt skulle också vara fel — källmatrisen gäller HT-26.

**Beslut:** ACCEPT_BOUNDED_TECHNICAL_AND_CURRICULUM_CORE / HOLD_FINAL_REAL_DEVICE_ACCEPTANCE.
