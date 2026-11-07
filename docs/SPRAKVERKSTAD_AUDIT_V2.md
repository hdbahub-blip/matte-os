# Matte OS · Språkverkstad 2.0.1 — audit, release och pedagogik

## Audit av 1.0

1. 10 svenska och 11 engelska mikrolektioner gav otillräckligt med längre sammanhängande läsning; de behandlade mest enstaka exempel och frågor.
2. Ingen nivåindelad textbank, ingen systematisk växling mellan på-raderna/mellan-raderna/resonemang, ord i kontext, ordluckor och återberättande inom samma text.
3. Orddueller var slumpade per telefon; två användare kunde få olika följd trots samma ämne.
4. Stegvis undervisning fungerade men överfördes inte till en verklig textbaserad lärsekvens. Stor risk att öva svarsklick i stället för språkförståelse.
5. Hörförståelse använde talsyntes; den tekniken ska ses som kompletterande uppläsning, inte som ett validerat hörförståelsetest.

## Ändring 2.0.1

- 4 teman per språk: berättelse, saktext, argument och en ytterligare berättelse; totalt 8 berättelse-/textteman.
- 3 nivåer på varje tema: sammanlagt 24 originaltexter. Ökad textlängd, indirekt information och resonemang, med ytterligare nivåspecifika analysfrågor på nivå 2 och 3.
- 88 läsförståelsefrågor över samtliga textversioner (72 grundfrågor + 16 nivåspecifika), 72 ordluckor, 72 förklara-ord-uppgifter, 24 återberättandeaktiviteter och samtalsuppgifter per text.
- Stegvis flöde: läsa styckevis/lyssna, textfrågor med synliga belägg efter eget svar, förklara och använda ord, skriv luckord (alternativ först på begäran), återberätta utifrån tre stödfrågor, diskussion och gemensam detektivduell.
- Exakt samma innehåll och frågeordning för åk 8 och åk 9; samma dagliga rekommendation för båda i svensk lokal kalenderdag. Duellerna är också deterministiska per ämne och dag. Individuell progression sparas under `matteos.sprak.v2` utan fria elevtexter.
- Gamla mikrolektioner finns kvar som kompletterande kortträning under `#/korta/sv` respektive `#/korta/en`; studieteknik, matematik, Tabellarenan, Cup och Matematikprov lämnas intakta.
- Fungerar offline när den nya serviceworkern har installerats och alla filer laddats. Talsyntes beror på enhetens installerade röster; ingen ljudinspelning eller texterna skickas till server.

## Källprinciper och gränser

Materialet är egenproducerat pedagogiskt övningsmaterial och ska inte tillskrivas Skolverket eller officiella prov. Grundprinciper: åldersrelevanta ämnen med tydlig nivåstöttning, gradvis ansvarsförflyttning, explicit textledtråd, aktiv ordanvändning, dialogisk övning och återberättande.

- Skolverket svenska 7–9: https://www.skolverket.se/undervisning/grundskolan/laroplan-lgr22-for-grundskolan-samt-for-forskoleklassen-och-fritidshemmet/curriculums/LGR22/GRGRSVE01?hasSubjects=true&schoolType=GR&tosHeading=Kursplaner&v=15
- Skolverket engelska 7–9: https://syllabuswebb.skolverket.se/compulsorycw/jsp/subject.htm?subjectCode=GRGRENG01&tos=gr
- EEF läsförståelsestrategier: https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/reading-comprehension-strategies
- EEF muntligt språk: https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/oral-language-interventions

Ingen kalibrering mot elevernas faktiska nivå, ingen automatisk bedömning av öppna svar, ingen länkad realtidssynkronisering på två enheter och inga garanterade ljudröster. Same-text/same-question betyder **samma deterministiska innehåll**, inte att fjärrenheter är tekniskt synkroniserade.

## Tester, release och rollback

1. `node tests/larande-qa.js` (äldre material) och `node tests/sprak-qa.js` (nytt innehåll/ledtrådar, svar, nivåer, separerad data).
2. Full `node tests/sprak-e2e.js http://127.0.0.1:8765/` med Playwright Chromium på CI, tillsammans med existerande `/lara/`-test och befintlig matte-CI för WebKit/Firefox/Cup.
3. Separat mobil kontroll av hela övningsflödet, byte åk 8/9 och identisk daglig text; verifiera publik GitHub Pages-URL efter merge.
4. Rollback: revert integrationscommit från huvudgren om regression uppstår. Radera **inte** elevens `localStorage`. Den gamla lagringen (`matteos.v5`, `matteos.larande.v1`) och den nya (`matteos.sprak.v2`) är skilda.
5. Verifiera senare med elevtest om begriplighet, läslust och självständig överföring av kunskapen har förbättrats. Appens antal uppgifter bevisar inte effekten.
