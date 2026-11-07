# Matte OS · Språkverkstad 3.0 — oberoende audit, design, release och rollback

**Datum:** 2026-11-07 · **Baslinje:** Språkverkstad 2.0.1, `main` `19f030407962370a36edaa4f81f378ea4cfb9e60` · **Underlag:** issue #19 (handoff), egen inspektion av kod, innehåll och publicerad sida.

Handoffen behandlades som underlag, inte facit. Nedan skiljs **VERIFIERAT** (kontrollerat i kod, test eller källa), **HÄRLETT** (logisk följd av det verifierade) och **ANTAGET** (rimlig designhypotes som inte är prövad på elever).

---

## 1. Audit av 2.0.1 – vad som faktiskt var fel

### 1.1 Allvarliga fel som ChatGPT:s audit missade

| # | Fel | Bevis | Följd |
|---|---|---|---|
| A1 | **Rätt svar stod alltid först.** Alla 40 läsfrågor och alla 24 luckuppgifter hade `answer: 0`, och alternativen visades i den ordningen. | `lara/stories.js`, räknat med skript: `{0: 40}` respektive `{0: 24}`. | Den som alltid valde det översta alternativet fick 100 % rätt utan att läsa. Poängen och "Tränad" var meningslösa. |
| A2 | **Kortlektionerna hade samma mönster.** 29 av 37 flervalsfrågor i `content.js` hade rätt svar i mitten. | Räknat: `{0: 3, 1: 29, 2: 5}`. | Gissningen "mitten" gav 78 %. |
| A3 | **Samma frågor på alla tre nivåer.** Nivåerna var tre omskrivningar av samma text med samma frågor och samma facit. | `questions` delas i `stories.js`; endast en extra fråga per nivå. | Nivå 2 och 3 efter nivå 1 mätte minne av facit, inte förmåga. Ingen transfer gick att mäta. |
| A4 | **Detektivduellen återanvände frågor vars facit båda redan hade sett** i steg 2. | `together()` i `sprak.js` läste `questions(b,n)`. | Tävlingen belönade minne, inte förståelse. |
| A5 | **Parläget utgick från att årskurs = person** ("Elev åk 8", "Elev åk 9"). | `sprak.js` 2.0.1. | Fungerade inte för två elever i samma årskurs, och band identitet till profil. |
| A6 | **De engelska temana var översättningar av de svenska** (skärmbild/screenshot, bibliotek/library). | Titlar och handling i `stories.js`. | "8 teman" var i praktiken 4 handlingar. Eleven läste samma berättelse två gånger. |
| A7 | **Säkerhetskopian tog inte med Språkverkstadens framsteg.** | `exportFile()` exporterade bara `matteos.larande.v1`. | Byte av enhet raderade språkframstegen tyst. |
| A8 | **Orimliga distraktorer.** Exempel: "Att aldrig använda mobilen", "biljett", "målning". | `stories.js`. | Uppgifterna gick att lösa utan texten. |
| A9 | **Fel etikett i steg 2.** Knapptexten jämfördes med `b.questions.length` i stället för listans längd på nivå 2–3. | `quiz()` i 2.0.1. | Kosmetiskt, men ett tecken på att flödet inte var testat per nivå. |

### 1.2 Det ChatGPT:s audit fick rätt (bekräftat)

- Texterna var 100–260 ord: VERIFIERAT.
- Ingen synk mellan två mobiler: VERIFIERAT.
- Talsyntes är inte ett hörförståelsetest: VERIFIERAT.
- QA-testet mätte struktur, inte förståelse: VERIFIERAT.
- "Klar" sattes direkt till "tränad", utan att skilja klar från förstådd: VERIFIERAT.

### 1.3 Klassning av 2.0-texterna

| 2.0-tema | Beslut | Skäl / ersättning |
|---|---|---|
| sv `skarmbild` – Skärmbilden i gruppchatten | **REWRITE** | Bra tema (missförstånd), men grunt och med facit alltid först. Ersatt av *Det som inte sades* (nivå 3, 529 ord, opålitlig berättare). |
| sv `bibliotek` – Boken som redan var tillbaka | **REWRITE** | Idén "avsiktligt torr text" behålls. Ersatt av *Regler för lån av skoldator* (sökläsning, villkor, tillämpning). |
| sv `mobilregel` – Skolans nya mobilregel | **REWRITE** | Argumentation behålls. Ersatt av *Låt skoldagen börja klockan nio* (tes, motargument, källkritik, intertext med faktatext). |
| sv `grupparbete` | **REMOVE** | Överlappar skarmbild-temat; inget unikt lärandemål. |
| en `screenshot`, `library`, `homework`, `trophy` | **REMOVE** | Översättningar eller parallellversioner av de svenska temana. Ersatta av sex egna engelska texter. |

Gamla 2.0-länkar (`#/verkstad/sv/skarmbild/2`) visar nu "Texten har ersatts" och länkar vidare. **2.0-framstegen (`matteos.sprak.v2`) raderas inte.** Biblioteket visar hur många nivåer som finns sparade.

---

## 2. Research – vad appen ska träna och vad den inte kan bedöma

| Källa | Status | Slutsats för designen |
|---|---|---|
| Lgr22 svenska 7–9 (Skolverket) | **VERIFIERAT** (sidan laddad 2026-11-07) | Centralt innehåll: *strategier för att förstå, tolka och analysera texter*; sakprosa som är *beskrivande, förklarande, utredande, instruerande och argumenterande*; *formulera och bemöta argument*; *pröva källors tillförlitlighet*. Detta styr genrevalet (berättelse, faktatext, regeltext, nyhet/källkritik, debattartikel). |
| Lgr22 engelska 7–9 | **VERIFIERAT** | *Strategier för att uppfatta detaljer och förstå sammanhang*; anpassa läsning efter syfte; *strategier för att bidra till och underlätta samtal*. Styr parsamtal, omformuleringsstöd och engelska instruktioner. |
| Nationellt prov svenska/SVA åk 9 | **VERIFIERAT** (sidan uppdaterad 29 okt 2026) | Läsförståelse med flerval **och egna formuleringar** onsdag 17 mars 2027. Skrivning fredag 19 mars 2027. Muntligt v. 45–49 2026 i grupp. Därför finns öppna frågor med kriterier, inte bara flerval. |
| Nationellt prov engelska åk 9 – delar | **VERIFIERAT** | Muntligt i **par** kring ett givet ämne. Hörförståelse bygger på riktiga inspelningar. Därför: parsamtal, och lyssna-läge med mänsklig uppläsare som märks som just det. **Talsyntes kallas inte hörförståelsetest.** Datum stod inte på sidan. |
| EEF Toolkit: läsförståelsestrategier, samarbetsinlärning, feedback, muntligt språk | **EJ VERIFIERAT i denna session** – EEF svarade HTTP 403 | Enligt EEF Toolkit som jag känner det: läsförståelsestrategier ca +6 månader; feedback ca +6; muntligt språk ca +6; strukturerat samarbete ca +5 och bara med tydliga roller och individuellt ansvar; tävling mellan individer kan slå fel. **Kontrollera siffrorna på EEF:s webbplats.** Designen bygger på principerna, inte på siffrorna. |

**Det appen INTE kan bedöma:**
- muntlig kvalitet
- kvaliteten i fria skriftliga svar
- verklig hörförståelse av inspelat material
- om eleven förstått, utan att ha tagit en ledtråd ur en annan källa
- läslust

Öppna svar självbedöms eller kamratbedöms mot kriterier och märks så. De ger aldrig automatiskt facit.

---

## 3. Design 3.0 – egna beslut

### 3.1 Varför inte bygga ut sjustegsmallen

Den fasta ritualen (läs → frågor → ord → luckor → återberätta → duell) gav samma upplägg för en regeltext som för en novell, och tre nivåer av samma text. Jag valde i stället följande:

- **Fristående texter per nivå**, två per nivå och språk. Den andra texten på en nivå blir ett riktigt transferprov.
- **Uppgifter som utgår från texten och genren.** Faktatexten frågar om syfte och försiktiga formuleringar, debattartikeln om tes, struktur och svaga argument, regeltexten om sökläsning och tillämpning, berättelserna om perspektiv och opålitlig berättare.
- **Tre lägen för samma innehåll:** *Själv*, *Två på en mobil* och *Lyssna-läge*.

### 3.2 Uppgiftstyper

| Typ | Vad eleven gör | Hur det rättas |
|---|---|---|
| `choice` | Väljer bland 3–4 alternativ | Automatiskt. Alternativen blandas deterministiskt per uppgift. Rätt svar står först i källfilen men aldrig fast på skärmen. |
| `evidence` | Trycker på **meningen i texten** som bevisar ett påstående | Automatiskt mot en eller flera godkända meningar. |
| `order` | Trycker på händelser eller textdelar i rätt ordning | Automatiskt. Startar aldrig i rätt ordning. |
| `cloze` | **Skriver** ett ord i en *ny* mening (inte kopierad ur texten) | Godtar flera rätta svar, ger specifik återkoppling på nästan-rätt (t.ex. fel böjning) och visar ordalternativ först som ledtråd. |
| `open` | Svarar skriftligt eller muntligt | **Aldrig automatiskt.** Självbedömning mot tre kriterier, exempelsvar på begäran. Texten sparas inte. |

### 3.3 Stödtrappa (komma igång)

Läsmål före läsning → texten med numrerade stycken och ordhjälp (öppen på nivå 1) → uppgift → *ledtråd* (strategi för färdigheten) → *visa var i texten* (stycke markeras) → svar med förklaring och textbevis → **ny text på samma nivå utan stöd**. Den som tar ledtråd får "rätt med stöd", inte "rätt själv".

### 3.4 Två personer – båda måste tänka

- **Två på en mobil:** spelare 1 svarar och låser svaret. Därefter visas en överlämningsskärm där svar och alternativ är dolda, och spelare 2 svarar. Facit visas först när båda har låst. Den som börjar växlar mellan uppgifterna. Den som hade rätt förklarar med textbeviset, och den andra säger förklaringen med egna ord.
- **Poäng:** 2 för rätt själv, 1 för rätt med ledtråd. Öppna uppgifter ger 1 poäng per kriterium som kamraten kryssar i, märkt *kamratbedömning*. **Ingen tidspress.**
- **Två mobiler:** utmaningskoden (t.ex. `SV-SOMN · v1`) visar att båda har samma text och version. Frågor och bokstäver A–D kommer i identisk ordning oavsett årskursprofil, vilket är testat. **Ingen påstådd synk:** eleverna säger sina bokstäver högt.
- **Parresultat sparas inte som individuell nivå,** eftersom mobilen inte kan veta vem som tänkte vad. Bara deltagandet räknas.

### 3.5 Progression – klar ≠ förstådd ≠ befäst

- Endast **första individuella försöket** på varje uppgift sparas som belägg. Omgörning ökar bara en räknare.
- Per färdighet och språk:
  - *Inte övat än*
  - *Behöver öva mer*
  - *Klarar med stöd*
  - *Klarat själv i en text – pröva en ny text*
  - *Klarar själv i två texter*
  - ***Befäst*** – klarat själv i en ny text minst två dagar efter första lyckade
- Rekommendationen pekar på en **ny** text på samma nivå när en text är klarad med minst 70 % självständigt, och på nästa nivå först när båda texterna på nivån är klarade.

### 3.6 Integritet och drift

- Ny nyckel `matteos.sprak.v3`, med en profil per årskurs och sanering vid inläsning.
- `matteos.v5`, `matteos.larande.v1` och `matteos.sprak.v2` rörs inte.
- **Inga fria svar, namn eller ljud sparas.** Testerna söker efter elevtexten i lagringen och i säkerhetskopian.
- Säkerhetskopian innehåller nu både kortövningarna och Språkverkstaden (v3 och v2). Gamla säkerhetskopior utan Språkverkstad går fortfarande att importera och raderar inget.
- Inga nätverksanrop, ingen ny tjänst, inget konto.
- Cachen för Lärande går från `matte-os-larande-2.0.1` till `3.0.0`. Matematikens och Prov-delens service workers är orörda.
- Meningsdelningen använder inte lookbehind i reguljära uttryck. Den syntaxen kraschar Safari före iOS 16.4.

### 3.7 Innehåll

12 originaltexter och 109 uppgifter:

| Språk | Nivå 1 · Grund | Nivå 2 · Fördjupning | Nivå 3 · Utmaning |
|---|---|---|---|
| Svenska | *Bussen 07.42* (berättelse, 235 ord) · *Regler för lån av skoldator* (avsiktligt torr regeltext, 188) | *Varför är tonåringar trötta på morgonen?* (faktatext, 349) · *Klippet som fick stan att tro att simhallen stänger* (nyhet/källkritik, 291) | *Låt skoldagen börja klockan nio* (debattartikel, 441, bygger på faktatexten) · *Det som inte sades* (berättelse med opålitlig berättare, 529) |
| Engelska | *The Wrong Bag* (story, 246) · *Riverside Youth Hostel – House Rules* (practical, 203) | *How Noise-Cancelling Headphones Work* (explanation, 332) · *Why I Broke My 412-Day Streak* (opinion, 352) | *The Shark in the Flooded Street* (news/source criticism, 431) · *The Notes in My Locker* (mystery, 454) |

Faktapåståenden är förenklade men korrekta enligt min kunskap:
- dygnsrytm och melatonin under puberteten; 8–10 timmars sömn för 13–18 år
- destruktiv interferens; att aktiv brusreducering fungerar bäst på jämnt lågfrekvent ljud
- Griegs *Arietta* (op. 12 nr 1) är ett verkligt stycke

Personer, orter och citat är påhittade och märkta så i texternas metadata.

**Redaktionell självkritik under arbetet:** min första version hade rätt svar som *unikt längsta alternativ* i 52 av 61 flervalsfrågor (85 %), vilket är en klassisk gissningsgenväg. Distraktorerna skrevs om till rimliga missförstånd av samma längd (nu 15 av 62, ungefär slumpnivå). Testet spärrar mot att mönstret kommer tillbaka.

---

## 4. Kvalitetsgrindar och testmatris

| Test | Vad det bevisar | Var |
|---|---|---|
| `tests/sprak-qa.js` (1 100+ kontroller) | Genrebredd, två texter per nivå, ökande längd, minst fyra uppgiftstyper per text, rimliga förklaringar, textbevis exakt en gång, ingen gissningsgenväg (position ≤ 40 %, längsta alternativ ≤ 35 %, samma bokstav ≤ 40 %), deterministisk ordning, rättning, sanering, progressionslogik, inga nätverksanrop | `unit-and-content` |
| `tests/sprak-e2e.js` (53 kontroller) | Hela soloflödet med riktiga svar, ledtråd = stöd, första försöket gäller, fritext sparas aldrig, profilseparation, identiska frågor på två "mobiler" med olika profil, parläge med låsta svar, lyssna-läge utan synlig text, säkerhetskopia → nollställ → import, offline, tryckytor ≥ 44 px | `browser-mobile` |
| `tests/sprak-upgrade-e2e.js` | 2.0.1 → 3.0 på **samma origin** med syntetiska data: v2-, Lärande- och mattelagring bevarade byte för byte, cachebyte, gamla länkar förklaras, offline | `browser-mobile` |
| `tests/sprak-cross-engine.js` | WebKit (Safaris motor, med iPhone-bredd, användaragent och pek) och Firefox: alla uppgiftstyper, lagring, låst parläge, att inget täcker knapparna (`elementFromPoint`), ingen överbredd eller utzoomning, och identisk ordning mellan motorerna. *Kompromiss:* Playwrights mobila WebKit verkställer inte programmatisk rullning, så WebKit körs med en hög viewport (390 × 3200 px). Rullning och tryckytor på riktig mobilhöjd täcks av `sprak-e2e` i Chromium. | `cross-engine` |
| Alla tidigare sviter | Matematik, affischer, Tabellarenan, Cup, Prov, uppgradering 5.5.0 | alla jobb |

---

### 4.1 Fel som WebKit/Firefox-körningarna hittade och som rättades före release
1. **Fokusstöld:** rubriken fick fokus en bildruta efter uppgiftsbytet (för skärmläsare). Om eleven redan hade gått in i skrivfältet flyttades fokus bort mitt i skrivandet, och texten försvann. Nu flyttas fokus aldrig från ett fält som redan är aktivt. Felet återskapades i Chromium före rättelsen och var borta efter.
2. **Meningsknappar i WebKit:** beläggsmeningarna var `<button>`, som WebKit inte bryter som löptext. Nu är de `span role=button` med Enter och mellanslag.
3. **Skrivna svar:** vid Kontrollera och Lås läses värdet direkt från fältet, eftersom autokorrigering och IME i iOS inte alltid skickar varje `input`-händelse.
4. **Fast bottenmeny:** `scroll-padding` håller fokuserade kontroller fria från rubrik och meny (WCAG 2.4.11).

Ett slumpmässigt fel i `cup-security` (2 % gallring av utgångna rum, `NO_ROOM` i stället för `GONE`) finns sedan 5.5.0. Det beror inte på den här releasen och är rapporterat i PR #20.

## 5. VERIFIERAT / EJ VERIFIERAT

- **VERIFIERAT:** allt i testmatrisen ovan, i CI på release-SHA:n (se PR) och lokalt i Chromium. Skolverkets kursplaner och provformat.
- **EJ VERIFIERAT:**
  - riktig iPhone/Safari och Android, utöver emulering
  - VoiceOver och TalkBack
  - EEF-siffrorna (sidorna blockerades i sessionen)
  - **elevernas förståelse, motivation och transfer** – ingen elev har använt 3.0
  - att 70 %-gränsen och tvådagarsregeln är rätt kalibrerade; de är designhypoteser
  - att texternas svårighetsgrad motsvarar tänkta nivåer för just dessa elever

---

## 6. Fem minuter för ägaren: två elever, samma text, ny text utan stöd

1. Öppna `https://hdbahub-blip.github.io/matte-os/lara/#/sv` (eller `#/en`).
2. **Samma mobil:** välj en text på nivå 1, sedan *Två på en mobil*. Läs texten högt, ett stycke var. Svara i tur och ordning – mobilen döljer svaret när den lämnas över. Efter varje facit: den som hade rätt förklarar med textbeviset.
3. **Två mobiler:** båda öppnar samma text (koden överst ska vara densamma), väljer *Själv* och säger sin bokstav högt efter varje fråga innan de trycker *Kontrollera*.
4. **Avsluta med samtalsfrågan** – minst två minuter, byt roll en gång.
5. **Några dagar senare:** var och en gör den *andra* texten på samma nivå **själv**. Biblioteket visar vad var och en klarar själv. Det är den verkliga effektsignalen.

**Observera för pilottest:**
- förstår de instruktionen utan vuxen?
- motiverar de med textbevis?
- tar den starkare över?
- hur många ledtrådar behövs?
- klarar de den nya texten själv?

---

## 7. Rollback

- **Kod:** gör `git revert` av merge-commiten för releasen på `main`. GitHub Pages publicerar 2.0.1 igen. Service workern för Lärande byter tillbaka till 2.0.1-cachen vid nästa besök.
- **Data:** ingen migrering har gjorts.
  - `matteos.sprak.v2` finns kvar och läses av 2.0.1 som förut.
  - `matteos.sprak.v3` ignoreras av 2.0.1 och blir kvar.
  - Inget behöver raderas, och ingen elevdata går förlorad i någon riktning.
- **Matematik, Tabellarenan, Cup och Prov:** orörda. Ingen Supabase-ändring.
