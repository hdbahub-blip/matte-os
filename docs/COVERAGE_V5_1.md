# Täckningsmatris v5.1 – originalplaner → moment

Källa: Google Drive "HT-26- år 9.docx" och "HT-2026 - a_k-8 Terminsplanering.pdf" (inte ChatGPT-handoffen). Genereras från `tests/coverage.js`; `node tests/qa.js` verifierar att varje moment-id finns, att inget är MISSING och att inget moment saknar källa.

## Åk 9

| Vecka | Originalpunkt | Moment (ID) | Status | Not |
|---|---|---|---|---|
| 34 | Stora tal | s9-names | COMPLETE |  |
| 34 | Prefix | s9-prefix | COMPLETE |  |
| 34 | Potensform | s9-scientific, s9-powers | COMPLETE |  |
| 34 | Räkna med potensform | s9-powers, s9-sci-calc | COMPLETE |  |
| 35 | Tiopotenser | s9-scientific | COMPLETE |  |
| 35 | Grundpotensform | s9-scientific | COMPLETE |  |
| 35 | Små tal och prefix | s9-names, s9-prefix | COMPLETE |  |
| 36 | Kvadrat och kvadratrot | s9-sqrt | COMPLETE |  |
| 37 | Talmängder | s9-number-sets | COMPLETE |  |
| 37 | Diagnos | ENGINE:train | PARTIAL | Skolans diagnosprov finns inte som egen funktion; Träna blandar uppgifter ur kapitlet. |
| 37 | Mer om stora och små tal | s9-sci-calc, s9-names | COMPLETE |  |
| 38 | Mer om kvadratrötter | s9-sqrt-more | COMPLETE | Förenkla √n, exakt svar k√n. |
| 38 | Division med kvadratrötter | s9-sqrt-div | COMPLETE | √a/√b = √(a/b), rationalisering ingår ej (ej i planen). |
| 38 | Andragradsekvationer | s9-quadratic | COMPLETE | Nivå x² = a, ax² + b = c, ingen lösning, ±. Ej pq-formel/kvadratkomplettering (ej belagt i planen) – [FA]. |
| 38 | Mer om talmängder | s9-number-sets | COMPLETE | Rationella/irrationella, periodiska decimaler, √16, motexempel. |
| 38 | Repetition (Tal) | ENGINE:train, ENGINE:test | COMPLETE |  |
| 39 | PROV Tal | ENGINE:test | COMPLETE |  |
| 40 | Vinklar | s9-angles | COMPLETE |  |
| 40 | Pythagoras sats | s9-pythagoras | COMPLETE |  |
| 41 | Skala – längd | s9-length-scale | COMPLETE |  |
| 41 | Skala – area | s9-area-scale | COMPLETE |  |
| 41 | Skala – volym | s9-volume-scale | COMPLETE |  |
| 41 | Likformighet | s9-similarity | COMPLETE |  |
| 42 | Symmetri | s9-symmetry | COMPLETE |  |
| 42 | Diagnos | ENGINE:train | PARTIAL | Se v37. |
| 43 | Mer om vinklar | s9-angles-more | COMPLETE | Parallella linjer, vertikal-/sidovinklar, månghörningar. |
| 43 | Mer om Pythagoras sats | s9-pyth-more | COMPLETE | Omvänd sats, höjd i likbent triangel. |
| 43 | Rymddiagonal | s9-space-diagonal | COMPLETE |  |
| 45 | Mer om skala och likformighet | s9-length-scale, s9-similarity | COMPLETE |  |
| 45 | Repetition (Geometri) | ENGINE:train, ENGINE:test | COMPLETE |  |
| 46 | PROV Geometri | ENGINE:test | COMPLETE |  |
| 47 | Andelen, delen, hela | s9-percent-share, s9-percent-part, s9-percent-whole | COMPLETE |  |
| 47 | Förändringsfaktor | s9-change-factor | COMPLETE |  |
| 48 | Upprepad förändring | s9-repeated-change | COMPLETE |  |
| 48 | Procentenheter | s9-percentage-points | COMPLETE |  |
| 48 | Diagnos | ENGINE:train | PARTIAL | Se v37. |
| 49 | Problemlösning med procent | s9-percent-problem | COMPLETE |  |
| 49 | Repetition (Procent) | ENGINE:train, ENGINE:test | COMPLETE |  |
| 50 | PROV Procent | ENGINE:test | COMPLETE |  |
| 51 | Repetition | ENGINE:train | COMPLETE |  |

## Åk 8

| Vecka | Originalpunkt | Moment (ID) | Status | Not |
|---|---|---|---|---|
| 34 | Bråk och decimalform | f8-fractions-compare | COMPLETE |  |
| 34 | Addition och subtraktion av bråk | f8-fractions-add | COMPLETE |  |
| 34 | Multiplikation av bråk | f8-fractions-multiply | COMPLETE |  |
| 35 | Multiplikation/division av bråk | f8-fractions-multiply, f8-fractions-divide | COMPLETE |  |
| 35 | Division med bråk | f8-fractions-divide | COMPLETE |  |
| 35 | Multiplikation av decimaltal | f8-decimals | COMPLETE |  |
| 36 | Multiplikation/division i decimalform | f8-decimals | COMPLETE |  |
| 36 | Tal i potensform (häfte) | f8-powers, f8-powers-ten | COMPLETE | Tiopotenser, grundpotensform, prefixintro. |
| 37 | Negativa tal | f8-negative | COMPLETE |  |
| 38 | Diagnos | ENGINE:train | PARTIAL | Se Åk 9 v37. |
| 38 | Mer om bråk, multiplikation med bråk och decimal | f8-fractions-multiply, f8-decimals | COMPLETE |  |
| 39 | Förkorta bråk | f8-simplify-fraction, f8-primes | COMPLETE |  |
| 39 | Mer om division med bråk | f8-fractions-divide | COMPLETE |  |
| 39 | Mer om negativa tal | f8-negative | COMPLETE |  |
| 39 | Repetition (Tal) | ENGINE:train, ENGINE:test | COMPLETE |  |
| 40 | PROV Tal | ENGINE:test | COMPLETE |  |
| 40 | Dimensioner, längd och längdenhet | f8-units | COMPLETE |  |
| 41 | Cirkelns omkrets | f8-circle-circ | COMPLETE |  |
| 41 | Area och areaenheter | f8-area, f8-units | COMPLETE |  |
| 41 | Area av stora områden | f8-large-area | COMPLETE | ha, km². |
| 41 | Cirkelns area | f8-circle-area | COMPLETE |  |
| 41 | Cirkelbåge och cirkelsektor | f8-sector | COMPLETE |  |
| 42 | Volym och volymenheter | f8-volume-units | COMPLETE |  |
| 42 | Cylinder | f8-cylinder | COMPLETE |  |
| 42 | Pyramid och kon | f8-pyramid, f8-cone | COMPLETE |  |
| 42 | Klot | f8-sphere | COMPLETE |  |
| 43 | Mer om omkrets | f8-perimeter | COMPLETE |  |
| 45 | Mer om area och areaenheter | f8-area, f8-area-more | COMPLETE | Trapets, sammansatta figurer. |
| 45 | Befolkningstäthet | f8-density | COMPLETE |  |
| 45 | Mer om klotets volym och begränsningsytans area | f8-sphere, f8-surface-area | COMPLETE |  |
| 45 | Blandade övningar / repetition (Geometri) | ENGINE:train, ENGINE:test | COMPLETE |  |
| 46 | PROV Geometri | ENGINE:test | COMPLETE | Veckoordning 40–46 i PDF:en är overifierad visuellt – [FA]. |
| 47 | Uttryck med variabler | f8-expressions | COMPLETE |  |
| 47 | Ekvationer | f8-equations | COMPLETE |  |
| 47 | x i båda leden | f8-x-both-sides | COMPLETE |  |
| 47 | Addition/subtraktion med parenteser | f8-parentheses-add | COMPLETE |  |
| 48 | Multiplikation med parenteser | f8-parentheses-multiply | COMPLETE |  |
| 48 | Problemlösning med ekvationer | f8-equation-problems | COMPLETE |  |
| 49 | Diagnos | ENGINE:train | PARTIAL | Se Åk 9 v37. |
| 49 | Mer om uttryck, ekvationslösning, parenteser | f8-expressions, f8-equations-more | COMPLETE |  |
| 49 | Mer problemlösning | f8-equation-problems, f8-formulas | COMPLETE |  |
| 49 | Konjugatregeln | f8-conjugate | COMPLETE |  |
| 50 | Faktorisera | f8-factor | COMPLETE |  |
| 50 | PROV Algebra | ENGINE:test | COMPLETE |  |
| 51 | Repetition | ENGINE:train | COMPLETE |  |
| central | Talsystemets utveckling (historik) | – | PARTIAL | Ingen historisk lektion; talmängder/negativa tal täcks. Medvetet utelämnat – ej räknefärdighet. |
| central | Rimlighetsbedömning och överslag | f8-decimals, f8-order | PARTIAL | Rimlighet/avrundning ingår i enstaka uppgifter, ingen egen lektion. |
| central | Primtal (förmågeexempel) | f8-primes | COMPLETE |  |
| central | Räkneordning 35 − 2(8+3) (förmågeexempel) | f8-order | COMPLETE |  |
| central | Äpplen/glass/mjölk – avrunda som i affären | f8-order | COMPLETE |  |
| central | Formler och variabler | f8-formulas | COMPLETE |  |

## Summering

{"COMPLETE":84,"PARTIAL":7} av 91 punkter.

PARTIAL är medvetna avgränsningar: skolans diagnosprov (ersätts av Träna), talsystemets historik, rimlighetsbedömning som egen lektion.
