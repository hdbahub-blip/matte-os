# Matte OS – oberoende FULLSPEC-audit efter Claude och English Speaking Lab

**Datum:** 2026-11-26 · **Granskad baseline:** `2697d8ccd8a091f5c281d7f3db0e38db7071f232` (main efter PR #61) · **Ändringsstrategi:** fristående, reversibel frontend utan databasändringar.

## 1. Ägarens mål och kritiska korrigering

Målet är att en elev i årskurs 9 tryggt kan delta i ett spontant engelskt samtal om ett oväntat ämneskort, vare sig ämnet är engagerande eller ointressant. Eleven ska kunna förmedla en begriplig ståndpunkt, utveckla ett relevant skäl, använda ett konkret exempel, reparera språkliga luckor, reagera på en annan person och bidra till samtalets fortsättning. **Om eleven är mycket intresserad ska hon också kunna vara kortfattad och släppa in andra.**

Äldre spelmodell (PR #58) tränar framför allt *för och emot* med valda teman, argumentkort, joker och två fasta positioner. Detta är värdefull extraövning men **är inte samma sak som spontan samtalsinteraktion**. Debattspelet ska därför inte vara främsta vägen för muntlig engelska.

## 2. Faktiskt granskad förändringshistorik

| Merge / PR | Faktisk omfattning | Revisionens bedömning |
|---|---|---|
| #58, `4230192` | Debattspelet sv/en och länkning till språkstudio | Behåll som tillägg, men ersätt primär English-väg med spontan samtalspraktik |
| #59, `135dd0a` | Inloggning först, mentorvy och följ-med-läge | Ingen ny auth- eller rollerförändring behövs för att lära ut muntligt |
| #60, `816fbd9` | Lekfullt lager, Plugga smart, extra länkar | Bevara; undvik ytterligare startskärmskomplexitet |
| #61, `2697d8c` | Färgsystem, vägvisning, ikon- och 22-sidors visuell audit | Behåll fungerande färg- och navigationssystem; ny modul får egen lugn men tydlig design |

**Gräns:** Claudes rapport `docs/AUDIT_20261125.md` säger att 22 sidor i två teman granskades i 390 px Chromium och att riktiga elever inte testade. Detta är inte bevis på fullständiga elevflöden, faktisk effekt eller motsvarande granskning i WebKit/Firefox.

## 3. [FA] Officiell provform jämfört med skolans muntliga övning

Göteborgs universitet (NAFS), som konstruerar NP engelska åk 9 på uppdrag av Skolverket, beskriver delprov A som **två elever åt gången** med **Warm-up, Part 1 och Part 2**. Uppgiftstypen kan innehålla påståenden, samtalsfrågor eller bilder. NAFS publicerar exempel med kort som används för att turas om att diskutera. Skolverket beskriver syftet som muntlig produktion och interaktion där elever uttrycker, utvecklar och diskuterar ett innehåll.

Ägarens aktuella observation om grupp där varje person drar kort gäller **möjligen skolans förberedelseövning**, inte nödvändigtvis formell NP-procedur. Test: få lärarens instruktion för det specifika undervisningspasset och kontrollera antal deltagare. **Vi bygger både par och fyrpersonersgrupp** för träning, men märker par som närmast beskriven nationell form. Vi kopierar inte konfidentiella eller återanvända riktiga provuppgifter.

Källor:
- https://www.gu.se/nationella-prov-frammande-sprak/prov-och-bedomningsstod-i-engelska/engelska-arskurs-7-9/nationella-prov-i-engelska-for-arskurs-9
- https://www.gu.se/nationella-prov-frammande-sprak/prov-och-bedomningsstod-i-engelska/engelska-arskurs-7-9/exempel-pa-uppgiftstyper-for-engelska-for-arskurs-9
- https://www.skolverket.se/prov-och-bedomning/nationella-prov/provdatum/provdatum-for-grundskola-sameskola-specialskola/delprov-och-innehall---grundskolan-sameskolan-specialskolan
- https://www.skolverket.se/undervisning/grundskolan/kursplaner-for-grundskolan/subjects/GRGRENG01

## 4. Bedömningskriterier – vad eleven faktiskt behöver visa

Offentliga noterings- och översiktsunderlag från Göteborgs universitet betonar:
1. **Innehåll och uttryck:** begriplighet/tydlighet; fyllighet och variation; relevanta exempel och flera perspektiv; sammanhang och struktur; anpassning.
2. **Språk:** flyt/ledighet; varierat ordförråd och användbara fraser; uttal och intonation; grammatiska strukturer.
3. **Kommunikativa strategier:** utveckla och föra samtalet vidare; omformulera, förklara och förtydliga när ett ord eller en formulering saknas; aktivt bemöta samtalspartnerns bidrag.

Appens sex egengjorda självkollspunkter tränar delar av detta, **inte** den officiella bedömningen. Ingen app utan inspelning/lyssning kan bedöma uttal, flyt, faktisk lyssning eller korrekthet med tillförlitlighet. Ingen betygs-/NP-garanti.

## 5. Implementerad korrigering – Speaking Lab

**Ny, fristående modul:** `lara/speaking-lab.html` med `speaking-lab-content.js`, `speaking-lab-core.js`, `speaking-lab.js`, `speaking-lab.css`.

- **49 unika, originalskrivna överraskningskort** inom vardag, samhälle/rättvisa, pengar/framtid, teknik, miljö och kultur. Blandat som standard; kategorival är frivilligt. Korten dras utan repetition inom omgången.
- **PACE-verktyg:** P = Position (ståndpunkt), A = Argument/reason (varför), C = Concrete example (relevant exempel), E = Engage (följdfråga och lyssnande). Den engelska PACE-varianten är egen pedagogisk minnesmodell, inte en officiell examenskapad akronym.
- **Rescue-flöden:** tomt huvud, ointressant ämne, pratar för länge, saknar ord och oenighet. Exempelfraser hjälper eleven att återgå till ämnet utan påhittade fakta.
- **Lärande samspel:** första talaren bjuder in nästa; följande talare får explicit lyssningsuppgift och språkstöd att bygga vidare på föregående svar. Solo har ett tänkt motperspektiv.
- **Solo, par och skolövning i grupp om fyra**. Turordning och självvärdering per person; den riktiga NP-miljön representeras inte falskt.
- **Frivillig 45-sekundersklocka**, aldrig ett krav. Text-till-tal läser upp kortet när webbläsaren stöder det. Ingen inspelning, mikrofon, transkript, AI-bedömning eller skickade elevsvar.
- **Privat övningsstate i `sessionStorage`:** vald kortordning, tur och fas; aldrig namn eller muntliga svar. Studieresultaten i Study Cloud berörs inte.
- **Ljus/mörk kontrast, mobilanpassad design (320/390/980 px), reducerad rörelse, tangentbordsfokus, tydlig tillbaka-väg**. Ny primär länk i English Studio och spelhub; tidigare debattspelet kvar som sidospår.
- **Offline-cache:** nya assets och en separat route införs i lär-PWA:s versionscache. Root-Cup och svenska NP:s privata skolinnehåll berörs inte.

## 6. Risker och gates

| Risk | Hantering |
|---|---|
| Påstå att den nationella provformen är fyrpersonersgrupp | Skilj uttryckligen parsamtalet från gruppträning; verifiera skolans individuella upplägg |
| Eleven lär sig ett manus och låser sig på nya ämnen | Slumpkort, PACE som struktur och egna svar, inte memorering |
| Ointresse → tystnad; intresse → sidospår | Två separata räddningsflöden och självkoll på relevans |
| Debatt = konflikt eller poängjakt | Samtalslab har ingen för/ emot-tvång, inte tävling och inga betyg |
| Förlorad elevdata | Inga schema-/auth-/RLS-/studiesnapshot-writes. Ny modul använder endast sessionStorage för kortposition |
| Ny PWA-resurs saknas offline | Versionsbump, precache och route-test; verifiera lokalt och live efter deployment |
| Produktion går sönder eller blir ful | CI på exakt head-SHA + Pages-release på merge-SHA + riktiga mobilflöden; rollback med git revert |

## 7. Verifiering och avgränsning

**Reproducerbara tester:** `node tests/speaking-lab-qa.js`, `node tests/speaking-lab-e2e.js http://127.0.0.1:8765/`, befintliga np-private/debate/language/content-tester och hela GitHub Actions-workflow. Kontrollera exakta testkvittens och version innan release.

**Kvarstående begränsningar:** ingen fysisk iPhone/VoiceOver-test, inga riktiga elevkontons användartest, inget lärarevaluerat tal och ingen säker prognos om provbetyg. Inga nya lärar- eller elevbehörigheter införda. Read-only databaskontroll visar fortsatt två befintliga elevprofiler, en mentor och två kopplingar, nio snapshots men inga study_events; detta visar **inte** att muntlig engelska kan betygsättas eller att någon elevdata gått förlorad.

**Rollback:** revert av denna frontend-PR och återpublicera Pages, utan att röra databaskopplingar, elevsvar eller konton. Kontrollera att gamla språk-/NP-sidor fortfarande fungerar.
