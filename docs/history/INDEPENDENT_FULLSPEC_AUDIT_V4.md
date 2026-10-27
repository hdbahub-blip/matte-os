# Matte OS v4 — oberoende FULLSPEC-audit

Datum: 2026-10-27  
Scope: Åk 8 och Åk 9.  
Metod: oberoende heuristisk revision av live-UI, tre iPhone-skärmbilder, faktisk kod/data och lärflöden. “15–16-åringsperspektivet” nedan är ett first-use-simulationstest, inte verklig elevtestning.

## Slutsats

v3 var tydligt bättre än v2, men fortfarande inte acceptabel som slutprodukt. Den största kvarvarande risken var inte färgerna utan **friktion mellan elev och matematik**:

1. appen kunde visa felaktigt extraherad information,
2. visuellt stöd var ibland generiskt eller felkontextualiserat,
3. en riktig formelsamling saknades,
4. mobilhuvudet och bottennavigationen störde fokus,
5. vissa ordval och typografiska proportioner kändes yngre än målgruppen,
6. Träna-sidan gav fortfarande fler val än nödvändigt,
7. samma grafiska modell återanvändes även när uppgiften handlade om en annan dimension/figur.

v4 ändrar därför inte bara “design”; den ändrar informationsarkitektur, lektionsflöde, promptanalys, visualisering och formelåtkomst.

---

## 1. Observerade fel i skärmbilderna

### P0 — felaktig matematisk informationspresentation

I vinkeluppgiften:
> “En triangel har vinklarna 42° och 71°...”

visade appen under **VAD VET JAG?**:
> “42 · 71 m”

Det är ett faktiskt kvalitetsfel. Orsaken var en för bred enhetsregex som kunde tolka bokstaven “m” inne i vanlig text som meter.

**v4-fix:** tal/enheter extraheras nu endast som bundna numeriska värden. Verifierad output:
- Känt: **42° och 71°**
- Söks: **den tredje vinkeln**

Motsvarande kontroll har körts över samtliga 147 övningar: ingen kvarvarande generisk “det frågan ber om”-etikett och ingen falsk fristående meter-enhet.

### P0 — ingen riktig formelsamling

Per-moment “Formelstöd” är inte samma sak som den formelsamling uppdraget kräver.

**v4-fix:** separat **Formelsamling** med hela respektive elevs åk 8/9-scope:
- grupperad per kapitel,
- aktuell del öppnas först,
- huvudregel/formel syns direkt,
- “När?”,
- symbol-/innebördsförklaring,
- omformad/baklänges variant där matematiskt relevant,
- mini-exempel,
- vanlig fälla,
- direktlänk till hela genomgången.

Coverage i data:
- 49/49 moment har regel,
- 49/49 moment har exempel,
- 49/49 moment har antingen omformning eller baklänges-/procedurregel,
- 49/49 har vanliga fel och igenkänningssignal.

### P1 — headern vändes fel på mobil

Äldre responsive CSS satte order på brand/profile/search. När v3 fick ny wrapper ärvde topbar fel ordning; därför hamnade sök/profil före logotypen i skärmbilden.

**v4-fix:** mobilheader är explicit:
**MATTE OS vänster → Sök/Åk höger**. Ingen flex-wrap.

### P1 — navigation i fokusläge

Bottennavigationen låg kvar under lektionssidor och konkurrerade om uppmärksamheten; i en skärmbild ligger den visuellt nära/över lärinnehållet.

**v4-fix:** bottennavigationen visas inte inne i moment eller uppgift. Eleven har bara aktuell uppgift + tillbaka/avsluta.

### P1 — visuellt stöd var ibland visuellt men inte pedagogiskt selektivt

Exempel: enhetsomvandlingen visade längd, area och volym samtidigt även när uppgiften bara gällde area.

**v4-fix:** kontextstyrd grafik:
- längduppgift → en dimension / ×10,
- areauppgift → två dimensioner / ×100,
- volymuppgift → tre dimensioner / ×1000.

Konceptvyn kan fortfarande visa alla tre för jämförelse; själva uppgiften visar bara relevant dimension.

### P1 — vinkelbilden innehöll inte uppgiftens faktiska data

Triangeln visade “? + ? + ? = 180°” trots att uppgiften gav 42° och 71°.

**v4-fix:** figuren skriver nu in de faktiska givna vinklarna och markerar den okända vinkeln.

### P1 — generiska visualiseringar för vissa moment

Särskilt omkrets, area, befolkningstäthet och decimaltal föll tillbaka till ett generiskt “KÄRNA”-kort.

**v4-fix:** specifika diagram för:
- omkrets,
- area (rektangel/triangel/parallellogram),
- befolkningstäthet,
- decimaltal,
- prefix,
- grundpotensform,
- likformighet,
- begränsningsyta (kontext för klot/kub/rätblock).

---

## 2. 15–16-åringsperspektiv: friktionstest

### Fråga 1: “Vet jag direkt vad jag ska göra?”
v3: ibland, men flera navigationsnivåer och stora rubriker skapade onödig orientering.

v4:
- Hem visar **en dominant nästa handling**.
- Träna visar **ett rekommenderat femfrågepass**.
- Alternativa områden ligger hopfällda.

### Fråga 2: “Känns sidan gjord för ett barn?”
v3:s mycket stora serifrubriker och formuleringar som “Nu gör vi en ihop” riskerade att kännas yngre.

v4:
- modern systemtypografi i lärinnehåll,
- mindre och tätare rubriker,
- brand får behålla serifkaraktär,
- språk: “Se exempel”, “Din tur – med stöd”, “Gör själv”.

### Fråga 3: “Måste jag hålla flera saker i huvudet samtidigt?”
v3: ja, ibland.

v4:
- fyra tydliga delar, men de är ett flöde, inte en meny,
- en relevant bild per uppgift,
- formelstöd hopfällt tills det behövs,
- ledtrådar en åt gången,
- inga XP/stjärnor i kärnflödet,
- navigation göms i fokussidor.

### Fråga 4: “Kan jag snabbt slå upp något utan att gå igenom lektionen?”
v3: inte tillräckligt.

v4: **Formelsamling** är en egen primär yta.

---

## 3. Lärmodell v4

### Del 1 — FATTA
- enkel förklaring,
- en relevant representation,
- en minnesregel,
- en igenkänningssignal.

### Del 2 — SE EXEMPEL
- ett worked example,
- givet / sök / regel,
- en rad i taget,
- eleven uppmanas att förutse nästa rad.

### Del 3 — PROVA MED STÖD
- en ny uppgift,
- först: vad vet jag / vad söker jag,
- sedan uträkning,
- formelstöd vid behov,
- en ledtråd i taget.

### Del 4 — GÖR SJÄLV
- tre korta uppgifter,
- stöd finns fortfarande men är inte påslaget från början.

Det följer principen **modellering → guidad praktik → självständig praktik**.

---

## 4. Evidens som styr designen

### SPSM — ADHD och undervisning
SPSM lyfter tydliga strukturer, återkommande rutiner, visuellt stöd, korta instruktioner i få steg, korta arbetsmoment och överskådligt uppdelat material. De nämner uttryckligen sammanfattningar, listor med viktiga begrepp och **formelsamlingar** som möjliga stöd för arbetsminnet.

Källa:
https://www.spsm.se/stod-och-rad/undervisning/adhd-och-undervisning/

### IES / What Works Clearinghouse — lärande och minne
Rekommendationer inkluderar:
- varva worked examples och egen problemlösning,
- kombinera grafik med verbal beskrivning,
- koppla konkreta och abstrakta representationer,
- sprida lärande över tid,
- använda quiz/retrieval för återexponering.

Källa:
https://ies.ed.gov/ncee/wwc/PracticeGuide/1

### IES / WWC — matematisk problemlösning
Stark evidens anges för:
- att hjälpa elever övervaka/reflektera över problemlösningsprocessen,
- att undervisa med visuella representationer.

Källa:
https://ies.ed.gov/ncee/wwc/PracticeGuide/16

### CAST UDL 3.0
UDL betonar att val ska optimeras, inte bara multipliceras. Elever skiljer sig i hur mycket val de gynnas av. Stöd bör också byggas gradvis och information/resurser organiseras så att exekutiv belastning minskar.

Källor:
https://udlguidelines.cast.org/engagement/interests-identities/choice-autonomy/
https://udlguidelines.cast.org/

### Skolbaserade ADHD-interventioner
2025 års systematiska översikt/meta-analys av skolbaserade RCT:er rapporterade förbättringar bland annat i ouppmärksamhet och akademisk prestation. Det stödjer strukturerade skolnära insatser generellt; det bevisar inte att en viss UI-layout ensam ger effekt.

Källa:
https://pubmed.ncbi.nlm.nih.gov/40761448/

---

## 5. Informationsarkitektur v4

Primär navigation:
1. **Hem**
2. **Formler**
3. **Träna**

Framsteg, veckoplan, restprov och inställningar ligger under profilverktyg eller kontextuell länk.

Motiv: primär navigation ska motsvara elevens tre vanligaste intentioner:
- Vad gör jag nu?
- Vad var regeln?
- Jag vill träna.

---

## 6. Träna v4

v3 gav fortfarande flera likvärdiga val.

v4 visar först:
> **Rekommenderat · 5 uppgifter**

Sedan ett sekundärt provläge.

“Välj annat område” är hopfällt.

Standardpass:
- rekommenderat pass: max 5 uppgifter,
- kapitelpass: max 6 uppgifter,
- ett moment: 3 uppgifter.

---

## 7. Matematikpresentation

### Vinklar
Faktiska givna vinklar ritas in.

### Enheter
Dimensionen avgör grafiken.

### Omkrets
Figuren visar kanten som ska summeras.

### Area
Figuren visar rätt bas/höjd eller längd/bredd.

### Begränsningsyta
Klotuppgift visar klot, kubuppgift visar kub, rätblocksuppgift visar rätblock.

### Likformighet
Två likformiga figurer visas som korresponderande former i stället för generiskt skalblock.

### Grundpotensform / prefix / decimaler / täthet
Varje område har egen representation i stället för textkort.

---

## 8. Vad v4 medvetet INTE gör

- Ingen skrikig gamification.
- Ingen leaderboard.
- Inga diagnosetiketter i elevgränssnittet.
- Ingen AI-runtime krävs.
- Ingen extern elevdatabas.
- Ingen falsk “baklängesformel” när momentet egentligen är en procedur eller klassificeringsregel.

---

## 9. Kvalitetskontroller genomförda före promotion

- 49 moment.
- 49 pedagogikprofiler.
- 147 övningar.
- 49/49 har regel.
- 49/49 har mini-exempel.
- 49/49 har igenkänningssignal.
- 49/49 har vanlig fälla.
- 49/49 har omformning eller procedur/baklängesregel.
- 147/147 promptar har testats mot nya “känt/söks”-extraktionen.
- 0 falska fristående meter-enheter i promptanalysen.
- 0 kvarvarande generiska “det frågan ber om”-etiketter.
- Samtliga tre inline-JavaScriptblock syntaxkompilerar.

---

## 10. Rollback

Rollback före v4:
`rollback-v3.0.1-before-v4-audit`

v4 ska inte ersätta v3 utan återställningsväg.

---

## 11. Kvarvarande acceptansgrind efter live-deploy

För full acceptans på fysisk iPhone:
1. Hem → Formler → öppna formelkort.
2. Hem → Fortsätt här → Fatta → Se exempel → Prova med stöd → Gör själv.
3. Kontrollera att vinkeluppgift visar “42° och 71°”, inte felaktig enhet.
4. Kontrollera att enhetsuppgift visar endast relevant dimension.
5. Kontrollera att bottennavigationen inte syns/överlappar i lektions- eller uppgiftsläge.
6. Lägg till på hemskärmen → stäng → öppna → testa offline.

