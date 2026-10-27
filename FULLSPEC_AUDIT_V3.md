# Matte OS v3 — FULLSPEC pedagogisk & UX-audit

Datum: 2026-10-27  
Scope: Åk 8 och Åk 9. Ingen diagnosetikett visas för eleven. Syftet är en lugn, tydlig och stödjande matematikmiljö för elever som gynnas av hög struktur, låg distraktion, korta steg och tät återkoppling.

## 1. Kritiska brister i v2

### För många samtidiga val
V2 hade sex huvudval i bottennavigationen, global sökning, profilväxling, sex klickbara lektionssteg och flera CTA:er på samma vy. Det ökade beslutskostnaden innan själva matematiken började.

### Lektionen var inte tillräckligt linjär
Eleven kunde hoppa mellan sex delar. Det är motsatsen till målet "en sak i taget". En nybörjare ska inte först behöva välja *hur* hen vill lära sig.

### Visuellt stöd fanns, men var ibland informationspackat
Exempel: enhetsomvandlingsbilden visade längd, area, volym och flera enheter samtidigt. Det visualiserade information, men reducerade inte nödvändigtvis arbetsminnesbelastningen.

### För tidigt metodval för noviser
I övningsflödet behövde eleven välja mellan flera metoder innan tillräcklig modellering. Metodval är viktigt, men ska fasas in efter att eleven först sett ett fungerande exempel.

### Formelstöd var inte tillräckligt nära arbetsögonblicket
Formler fanns i innehållet, men de behövde vara tillgängliga som ett lugnt "kika vid behov"-stöd under både lektion och övning.

### Gamification konkurrerade med kärnuppgiften
XP, nivånamn och stjärnor syntes i primärflödet. Belöningsdata kan finnas i bakgrunden, men ska inte konkurrera om uppmärksamheten.

### Otydliga symboler
Unicode-symboler i navigationen var inte konsekventa eller självförklarande.

## 2. Evidens som styr v3

### SPSM — ADHD och undervisning
SPSM rekommenderar tydlig struktur, återkommande rutiner, korta instruktioner i få steg, visuellt stöd, korta arbetsmoment, återhämtning och uppdelat/överskådligt material. SPSM nämner även sammanfattningar, listor och formelsamlingar som stöd för arbetsminnet.
https://www.spsm.se/stod-och-rad/undervisning/adhd-och-undervisning/

### SPSM — Matematiksvårigheter
SPSM rekommenderar fler korta instruktioner, visuella arbetsordningar, bildstöd, minnesanteckningar och kontrollfrågor för att minska överbelastning av arbetsminnet.
https://www.spsm.se/stodmaterial-matematiksvarigheter/tillgodose-behov-av-stod-i-matematik/det-atgardande-arbetet/

### IES/What Works Clearinghouse — lärande och minne
Rekommendationerna omfattar att varva worked examples med problemlösning, kombinera grafik och verbal beskrivning, koppla konkreta och abstrakta representationer, använda aktiv återkallning och sprida lärandet över tid.
https://ies.ed.gov/ncee/wwc/PracticeGuide/1

### IES/WWC — matematisk problemlösning
Stark evidens anges för att hjälpa elever att övervaka/reflektera över problemlösningsprocessen och att lära dem använda visuella representationer.
https://ies.ed.gov/ncee/wwc/PracticeGuide/16

### School-based ADHD RCT meta-analysis
En systematisk översikt/meta-analys av skolbaserade randomiserade studier rapporterade förbättringar i bland annat ouppmärksamhet och akademisk prestation. Detta stödjer att skolnära, strukturerade interventioner kan ge effekt, men säger inte att en viss UI-design ensam orsakar förbättring.
https://pubmed.ncbi.nlm.nih.gov/40761448/

## 3. V3-designprinciper

1. **En primär handling per skärm.**
2. **Fyra delar i stället för sex:** Fatta → Gör med mig → Prova med stöd → Gör själv.
3. **Stegen är linjära, inte en meny.**
4. **Visuellt först, men endast relevant visualisering.**
5. **Worked example innan självständig problemlösning.**
6. **Stödet tonas bort stegvis.**
7. **Formel finns nära men kollapsad: "kika när du behöver".**
8. **Ledtrådar visas en i taget.**
9. **Fel förklaras som nästa justering, inte bara rätt/fel.**
10. **Ingen diagnosetikett i elevgränssnittet.**
11. **Ingen publik elevdata; progression stannar lokalt på enheten.**
12. **Lågmäld progression; XP/stjärnor är borttagna från huvudflödet.**

## 4. Informationsarkitektur v3

### Primär navigation
- Hem
- Träna
- Framsteg

Plan, restprov och regelbibliotek finns kvar men exponeras endast när de behövs, inte som sex likvärdiga huvudval.

### Hem
Visar:
1. vad som händer i skolan nu,
2. exakt *nästa* rekommenderade moment,
3. närmaste prov/restprov,
4. två sekundära verktyg: Veckoplan och Hitta regel.

### Moment
Fyra delar:
1. **Fatta** — vanlig svenska + en visualisering + en minnesregel.
2. **Gör med mig** — worked example, ett steg visas åt gången.
3. **Prova med stöd** — en guidad uppgift; formel och ledtrådar finns nära.
4. **Gör själv** — tre korta uppgifter.

Efter den guidade uppgiften skickas eleven automatiskt vidare till "Gör själv".

### Övning
Tre mentala faser:
1. Förstå frågan.
2. Räkna.
3. Lär av svaret.

Metodquizet är borttaget i det guidade nybörjarflödet. Självständigt metodval tränas senare i blandade/provliknande pass.

## 5. Visuell redesign

- Färre kort, färre skuggor och mindre dekor.
- Konsekventa SVG-linjeikoner i stället för Unicode-glyfer.
- Creme/papper + en accentfärg per profil.
- Större tomrum runt det aktiva innehållet.
- Inga dekorativa rutnät bakom lärinnehållet.
- Mobilen prioriterar bild → uppgift → en primär knapp.
- Enhetsvisualiseringen visar nu varför faktorn blir ×10, ×100 eller ×1000 via dimensioner, i stället för en tät tabell med många enheter.

## 6. Formula dock

Varje moment har ett kollapsat Formel-stöd:
- grundsamband,
- symbolförklaring,
- omformade varianter där sådana finns.

Det gör stödet tillgängligt utan att tvinga eleven att se allt samtidigt.

## 7. Felhantering

Rättningsmotorn från v2 behålls. V3 presenterar feedbacken lugnare:
- exakt vad som behöver justeras,
- en "ta med dig"-rad,
- därefter försök igen eller nästa uppgift.

## 8. PWA/drift

V3 uppdaterar service worker till ny cache-version och använder network-first för navigering, så installerade enheter lättare får nya versioner i stället för att fastna på gammal cache.

## 9. Rollback

Git-branch:
`rollback-v2-before-guided-v3`

V2 kan återställas från denna branch om v3 skulle ge regressionsfel.

## 10. Verifieringsgrind

För att kalla v3 fullt accepterad krävs:
- [x] Inline JavaScript syntaxkompilerar.
- [x] V3-preview renderar i extern browser.
- [x] Tre huvudnavigationsval visas.
- [x] V3-startbudskapet renderas.
- [x] Fyra lektionsdelar finns i koden.
- [x] Formel-dock finns.
- [x] Guidad session kan returnera till självständig träning i koden.
- [x] V2 rollback-branch finns.
- [ ] Live root efter GitHub Pages redeploy verifierad.
- [ ] iPhone: öppna → moment → formula dock → guidad uppgift → självständig uppgift.
- [ ] iPhone hemskärmsinstallation + stäng/öppna + offline-reload verifierad.

