# Matte OS — 2026-11-16 läs- och flödesrevision (isolated change / release candidate)
**Källgrund:** aktuella filer i hdbahub-blip/matte-os, tidigare granskning docs/UX_FLOW_AUDIT_20261115.md, dokumenterade UI-/testkontrakt. **Inget faktiskt elevtest eller fysisk iPhone-observation utfördes.**

## Beslutsöversikt
1. Huvudproblemet är inte brist på funktioner. Den senaste UX-revisionen identifierade många konkurrerande navigationer; befintliga två primärval och separerade elev-/gästflöden ska bevaras i stället för att införa ännu en startsida.
2. Språkverkstaden har redan nivåstruktur, reproducerbar slumpning av svarsalternativ, beläggsfrågor, öppna svar, felrepetition, gästläge och progressionsisolering. Återanvänd dessa kontrakt.
3. Biblioteket prioriterar nu nya texter per nivå och visar en tydlig NY-etikett. Inga gamla ID:n eller lagringsnycklar raderas eller skrivs över.
4. Tillkommer **11 helt nya originaltexter**: svenska nivå 1 = 4, svenska nivå 2 = 3, engelska nivå 1 = 2, engelska nivå 2 = 2. Åtta uppgifter per text = 88. Tre svenska texter är särskilt provliknande; även övriga granskar information, slutsatser, belägg och språk.
5. Allt material är skönlitterärt eller tydligt påhittat reportage. Det är **inte** ett nationellt prov, en officellt bedömd uppgift eller en garanti för skolresultat.

## Funktionell granskningsmatris
| Område | Kontrollerad grund | Risk / föreslagen prioritet |
|---|---|---|
| Navigation / start | UX-audit 2026-11-15; två huvudvägar redan i repo | Verifiera verkligt antal tryck och begriplighet med elev, inte en ny redesign |
| Årskursprofil och Joker | Separata localStorage-nycklar och gästsessionskontrakt | Regression får inte skriva gästsvar till betygsprogress |
| Matematik 8/9, Tabellarena | Befintlig lektionsmotor, svarskontroll och figurtäckning | Bevara motor; math-, figure- och E2E-checks måste fortsatt vara gröna |
| Prov och restprov | Eget provflöde | Daglig träning får inte blandas med formell provdel |
| Språk och ordlek | 3 nivåer; deterministiskt uppgiftssvar, öppna frågor, felhistorik | Nya text-ID:n/versioner och svar måste överleva backup/offline |
| Språkdidaktik | Flerval, belägg, begrepp, ordlucka, öppet resonemang | Kvalitet kräver elevprövning, blinda omprov och analys av distractors |
| Visualitet / nattläge | Burgundy för åk 9, marinblått för åk 8, färgvariabler | Kontrast, fokus, radlängd, textstorlek, 44 px tryckytor kontrolleras |
| Offline | Root SW + isolerad lara SW | Förladda ny fil i båda; ändra båda cacheversionerna |
| Konto / synk | Study Cloud och mentor med separat RLS-policy | Ingen ny auth-/schema-/produktionsdataändring eller kontogenerering |
| Samarbete / Cup | Konto-fria och kontokrävande lägen har olika tillitsgränser | Förväxla inte dem; bevara turordning och privat facit |
| Säkerhetskopia / reset | Befintliga lagringsnycklar | Testa upgrade/restore med syntetiska sentinelvärden före merge |

## Releasegrind
- `node tests/sprak-qa.js` (inkluderar fördelning av rätt svar, ordval, unika belägg), `node tests/atelier-content-qa.js`, `node tests/immersive-reading-qa.js`.
- Browser: svenska/engelska, nivå 1/2, öppet svar, ledtråd, textbelägg, två profiler, gästläge, språk, dag/natt, offline och återkomst.
- GitHub Actions: alla relevanta CI-jobb på exakt PR-head gröna. Därefter separat explicit beslut om merge och Pages-verifiering; ingen automatisk produktion.
- [FA] De nya berättelserna är mer lockande för tonåringar. Falsifiering: låt minst två elever oberoende välja mellan ett gammalt och ett nytt textkort, testa att läsa hela texten, återberätta handlingen, förstå en indirekt fråga samt göra frivillig fortsättning nästa dag. Samla inte in namn eller privata fritextsvar.

## Reversibilitet
Revertera isolerad PR från `main` om regressionsprov faller. Ändra inte `matteos.v5`, `matteos.sprak.v3`, Supabase-tabeller, RLS eller riktiga elevkonton. Versionerad cache kräver ny version efter rollback.

## Verifiering
Skriven kod och författat innehåll är inte detsamma som observerad driftsatt funktion. Ange CI-kvittot och aktuellt commit-SHA innan merge. Inga verkliga elevtester eller iPhone-test har genomförts i detta arbete.
