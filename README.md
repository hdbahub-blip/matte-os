# Matte OS

Matte för åk 8 och åk 9 – en sak i taget. Statisk, offline-först PWA utan externa beroenden.

Live: https://hdbahub-blip.github.io/matte-os/

## Struktur
| Fil | Innehåll |
|---|---|
| `index.html` | skal |
| `css/app.css` | design (åk 9 vinröd, åk 8 marinblå + vinröd) |
| `js/math.js` | formelrendering + svarskontroll (tal, bråk, enheter, algebra-ekvivalens, grundpotensform) |
| `js/visuals.js` | 45 diagramtyper (SVG), styrs av uppgiftens data |
| `js/core.js` | skolplan HT-26, kapitel, restprov |
| `js/content9.js`, `js/content8.js` | 63 moment (Åk 9: 27, Åk 8: 36): förklaring, formelkort, exempel, guidad uppgift, övningar A–F, fällor |
| `js/engine.js` | lokal lagring, nivåer, rekommendation, sök, säkerhetskopia |
| `js/app.js` | gränssnitt |
| `sw.js` | service worker (offline, versionerad cache) |

## Tester
```
node tests/qa.js                         # matematik/innehåll – måste vara 0 fel
python3 -m http.server 8765 &            # lokal server
node tests/e2e.js http://localhost:8765/ # mobil end-to-end (kräver playwright)
```

## Ny version
Höj `VERSION` i `sw.js` och `?v=` i `index.html`/`sw.js` så hämtar installerade appar den nya versionen.

## Integritet
Ingen elevdata finns i källkoden. Framsteg, namn och restprovsdatum sparas lokalt. Study Cloud är frivillig per användare: inloggade elevkonton säkerhetskopierar grad-isolerad progression och inlämnade svar i en Supabase-databas med RLS; en mentor kan bara läsa efter aktiv privat elevkoppling. Oinloggade elever lagrar endast lokalt.

Granskningsrapport: `docs/AUDIT_V5.md`.

## Matte OS · Lärande (utbyggnad 5.5.5)

Gemensam undervisning i svenska, engelska och studieteknik, med individuella elevframsteg och frivillig ordduell/samarbete. Starta via kortet på hemsidan eller [öppna lärandedelen](./lara/). Matematik, Tabellarenan, Cup och Matte Prov har egna befintliga flöden.

Lärandedelen har 30 korta originallektioner, 24 duellkort och 8 frivilliga startkollsfrågor. Den är stödmaterial, inte ett komplett läromedel för hela årskurs 8–9 eller en officiell bedömning. Inga elevtexter eller ljudinspelningar sparas. Framsteg sparas per profil på enheten; använd säkerhetskopia vid enhetsbyte.

Tester: `node tests/larande-qa.js` och `node tests/larande-live-e2e.js http://127.0.0.1:8765/`. Se även [drift och rollback](docs/LEARNING_HUB_V1_RELEASE.md).

### Study Cloud – synk mellan elev och mentor (2026-11-11)

Apparna `/study/`, `/studera/` och Marble Green `/foralder/` finns publicerade. Databasmigreringen `study/supabase/0001_study_cloud_secure.sql` är installerad i det separata Matte OS-Supabaseprojektet. RLS-test (elev, mentor, utomstående, återkallelse, dold facit, engångsinbjudan) genomfördes med syntetiska användare i rollback-transaktioner. PR #32 passerade CI och GitHub Pages.

**Innan ni kan registrera riktiga konton:** Supabases *inbyggda* SMTP har begränsad leverans till projektteamets adresser och cirka två e-postmeddelanden per timme. Självregistrering till familjemedlemmars vanliga adresser kräver konfigurerad egen SMTP eller annan verifierad inloggningsmetod. På det befintliga Free-projektet kan kontoägaren alternativt manuellt skapa exakt tre bekräftade e-post-/lösenordskonton via **Authentication → Users → Add user → Create new user**, utan utskick. Skapa inte Supabase-teamkonton åt barn; de är inte samma sak som begränsade elevkonton i appen. Varje person loggar sedan in på `/study/` och väljer sin egen fasta roll, och kopplar elevprofilen via mentors engångskod.

**Verifieringsgräns:** Officiell CI och simulerade mobiler har passerat, men ingen riktig familjeinloggning, verklig SMTP-leverans eller elevmobilssynk har ännu accepterats. Före slutligt familjegodkännande: registrera kontona, lämna in en ofarlig testuppgift per elev, kontrollera privat mentorsvy, testa offline→online samt frivillig återställning. Använd inte externa provsvar som första test.

#### iPhone och tidigare lokala data

På iPhone/iPadOS har varje separat installerad Home Screen-webbapp isolerad lagring; den delar inte automatiskt elevens gamla localStorage med Safari eller med en annan separat installation. Använd därför **en enda installerad Matte OS-huvudapp**, som har scope `./`, och navigera därifrån till matte, språk, prov och `/study/`. En registrerad och kopplad profil kan därefter synkronisera data inom den installationen. Om eleven redan har använt separata installerade Språk-/Prov-appar eller Safari: **exportera säkerhetskopior från respektive befintlig app innan de stängs/raderas**. Återställ i den nya huvudappen, öppna varje modul och synkronisera. Verifiera varje årskurs och modul på mentorsvyn innan äldre installationer tas bort. Detta är en hård enhetsgräns på iOS, inte ett fel som kan lösas genom att läsa andra appars privata lagring.
