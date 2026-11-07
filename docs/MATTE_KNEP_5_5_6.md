# Matte OS 5.5.6 – Minnesknep och rättade förklaringar (issue #21)

## Vad som ändrades

| Del | Före | Efter |
|---|---|---|
| Ny modul `js/knep.js` | – | 10 minnesknep. Varje knep har ankare, 2–3 skäl till varför det fungerar, när det fungerar/inte fungerar med konkret motexempel, ett vanligt fel med rättning, 2 nya uppgifter (facit dolt tills eleven svarat) och en minnesfråga för en senare dag. |
| Lektionens första steg | Bara förklaring + exempel | Samma förklaring + ett lugnt knepkort där ett knep passar (24 av 63 moment). Inget kort där inget knep passar. |
| `#/knep` (ny vy) | – | Alla knep per område, status per profil, ”Dags att minnas” med minnesfråga **före** knepet. |
| Förstå-fliken | Formelaffisch som utfällbar ruta | Minnesknep som ingång; affischen som diskret länk ”Utskrivbar formelaffisch (valfritt)”. |
| Startsidan | – | En rad ”Minnesknep · N att minnas” visas bara när något är dags. |
| `teach-simple.js` | 10² ”1 × 1 med två nollor”, (0,1)² ”två decimaler”; minusparentes-exemplet räknade parentesen först; ”flytta kommat”; decimaler via räkna-decimaler | Upprepad multiplikation, ”en tiondel av en tiondel”; 10 − (4 − 1) räknas på två sätt så teckenbytet syns; 602 000 = 6,02 · 100 000; decimaler med överslag (1 · 0,3 ≈ 0,3 → 0,36). |
| `content9.js` prefix | ”Varje steg i prefixtrappan = 1000 gånger” (falskt för centi/deci) | Steget är 1000 mellan milli/mikro/nano och kilo/mega/giga, men 10 för centi och deci. |
| `content8/9.js` övrigt | ”1 och 3 nollor”, ”n decimaler”, ”flytta kommat 3 steg” | 10 · 10 · 10; 10⁻² = 1/(10 · 10) = 0,01; 6,3 · 1000. |
| Affischen | ”En etta följd av n nollor”, ”Fyra nollor”, ”två decimaler totalt” | Upprepad multiplikation, överslag; sidnot som länkar till Minnesknep. |

## De tio knepen

| Knep | Moment | Gräns som visas |
|---|---|---|
| Omkrets eller area? (RUNT/INUTI) | f8-perimeter, f8-area, f8-area-more | 2(l + b) gäller bara rektanglar; triangel 3-4-5. |
| Den lilla siffran i 10² och (0,1)² | f8-powers-ten, f8-powers, s9-powers, s9-scientific | Inte ”gånger 2”; negativa exponenter betyder division. |
| (−3)² eller −3² | f8-negative | 2 · 3² = 18, inte 36. |
| Nio gånger ett tal | (endast `#/knep`) | Dra bort talet, inte 9; 8 · 7 kräver två sjuor. |
| Minus framför parentes | f8-parentheses-add, f8-equations-more | Alla termer byter tecken; plus framför ändrar inget. |
| cm, cm² eller cm³? | f8-units, f8-volume-units, f8-large-area | Liter/dl/cl är steg om 10; 1 m² ≠ 100 cm². |
| Förstoring: längd, area, volym | s9-area-scale, s9-volume-scale, s9-similarity | Om bara en sida ändras blir arean × 2, inte × 4. |
| Procent från 10 % eller 1 % | s9-percent-part, s9-percent-problem, s9-percent-share | Dela inte med procentsatsen; 7 % via 1 %. |
| Procent i flera steg | s9-repeated-change, s9-change-factor | Två rabatter på samma originalpris läggs ihop. |
| √ eller x²? | s9-sqrt, s9-sqrt-more, s9-quadratic | x² = 0 har en lösning, x² = −4 ingen. |

Uppgiftsfacit räknas fram ur ett `calc`-uttryck och verifieras av `tests/knep-qa.js`. Testet kontrollerar också att inget synligt knep-text avslöjar facit till sina egna överföringsuppgifter (det hittade två sådana fall under utvecklingen, som rättades).

## Egna upptäckter utöver handoffens exempel

1. **Prefixankaret var sakligt fel**: ”Varje steg = 1000” stämmer inte för centi och deci (steg om 10).
2. **Minusparentes-exemplet visade inte regeln**: 5 − (2 + 1) räknades med parentesen först, så eleven såg aldrig teckenbytet.
3. **Genvägsspråk levde kvar i lektionsstegen** (”två nollor”, ”två decimaler”, ”flytta kommat”) trots att ledtrådarna redan rensats; testet `paper-lessons.js` krävde till och med frasen ”två decimaler”.
4. **Inget ”minnas senare”** fanns i matteappen. Minnesknep skiljer nu på *klarade nya uppgifter själv* (båda första försöken rätt) och *mindes efter N dagar* (rätt minnesfråga minst en dag senare).
5. **Facit läckte via exemplet**: den första versionen av två knep visade svaret på övningsuppgiften i ”vanligt fel”-texten. Ett generellt test förhindrar nu detta.

## Affischens roll – beslut

**Beslut: behåll som frivillig utskrift, ersätt den som primär exponering med Minnesknep.**
Inga filer, gamla länkar (`affischer/?visa=formler&ak=8|9`, `?visa=tabeller`) eller Tabellarenans tabellaffisch har tagits bort.

* Avvecklas – **bortvalt**: affischen används för utskrift och repetition, och länkar finns i omlopp.
* Behåll oförändrad som utfällbar ruta i Förstå – **bortvalt**: den visade regler utan ”när fungerar det inte” och använde räkne-genvägar.
* Dekoren (krona, stjärnor) behölls på själva affischen eftersom den nu bara nås frivilligt; i appen är knepkorten textbaserade utan dekor.

## Research (med verifieringsstatus)

* **Skolverket, Lgr22 matematik (VERIFIERAT, läst)**: centralt innehåll 7–9 omfattar tal i potensform och prefix, metoder för area/omkrets/volym ”samt enhetsbyten”, skala vid förminskning och förstoring, samt ”geometriska satser och formler samt argumentation för deras giltighet” – därav kravet att varje knep säger *varför* och *när det inte gäller*.
* **EEF, Cognitive science approaches in the classroom (VERIFIERAT, PDF läst)**: hämtningsövning och spridd repetition visar lovande men begränsat stöd i vanlig klassrumsmiljö; dual coding kan ge null- eller negativa effekter om bilder är dekorativa (”irrelevant illustrations … may be a distraction”). Därför: minnesfråga före knepet, en dags fördröjning, textbaserade kort och dekor bort från primärflödet.
* **EEF, Improving mathematics in KS2/3 (EJ VERIFIERAT)**: sidan gav HTTP 403 vid hämtning.

## Data och integritet

* Ny nyckel `matteos.knep.v1`: `{v:1, profiles:{grade8:{}, grade9:{}}}` med per knep bara `t0/t1 {at, ok}` och `recall {at, ok, n}`. Aldrig elevens inskrivna text. Okända nycklar och versioner kastas vid läsning.
* Övriga nycklar (`matteos.v5`, `matteos.larande.v1`, `matteos.sprak.v2/v3`, `matteos.cup.v1`, `matte-prov-v1`) läses eller skrivs inte. Ingen migrering eller rensning. Inga nya konton, ingen server, ingen Supabase-ändring.
* Begränsning: minnesknep-status ingår **inte** i matteappens säkerhetskopia (backup-formatet lämnades orört). Att förlora den påverkar inte annan progress.

## Tester

| Svit | Resultat lokalt |
|---|---|
| `tests/knep-qa.js` (ny) | 330/330 |
| `tests/knep-e2e.js` (ny; iPhone SE + 13, tangentbord, fördröjd minnesfråga, offline med riktig service worker) | 66/66 |
| `tests/knep-cross-engine.js` (ny; WebKit + Firefox) | körs i CI (motorerna finns inte lokalt) |
| paper-lessons, posters-content, hint-mapping, qa, figure-consistency, tabell-integration, book-first-regression, larande-qa, sprak-qa, tables | PASS |
| book-first-e2e, posters-e2e, paper-lessons-e2e, calm-ux-e2e, larande-live-e2e, sprak-e2e | PASS |
| upgrade-e2e 5.5.0 → 5.5.6, sprak-upgrade-e2e 2.0.1 → 3.0 | PASS |

Ändrade befintliga tester och varför:

* Versionspinnar 5.5.5 → 5.5.6 (book-first-regression, paper-lessons, posters-content, upgrade-e2e): samordnad cache-bump.
* `paper-lessons.js` krävde frasen ”två decimaler”; kräver nu ”en tiondel av en tiondel” och förbjuder noll/decimal-genvägen i 10²-steget (issue #21).
* `posters-e2e.js` och `calm-ux-e2e.js` öppnade affischens utfällbara ruta; de kontrollerar nu Minnesknep-ingången och att affischlänken finns kvar.

## Rollback

`git revert <merge-sha>` på main och push. Service workern byter då tillbaka till föregående versionsnamn vid nästa besök; `matteos.knep.v1` blir oanvänd men skadar ingenting.

## Inte verifierat

Verklig effekt på elevers förståelse och minne är **EJ VERIFIERAT** – det kräver användning över tid.
