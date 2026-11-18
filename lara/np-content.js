/* Matte OS · NP-träning – öppet pedagogiskt innehåll.
 * ALLT här är skrivet för Matte OS och påhittat (egna korta texter, egna personer, egna scenarier).
 * Skolans text, frågor och sammanfattning finns aldrig här – de läses in privat på elevens enhet.
 * Övningsdialoger och exempel är simuleringar, inte facit och inte officiella provuppgifter.
 */
(function(root){
'use strict';
var C={};

C.roles=[
 {id:'present',title:'Presentera',does:'Du berättar vad texten handlar om och vad du själv tycker och tänker om den – med egna ord, inte uppläst.',proof:'Det märks att du kan det när du kan förklara ett svar för någon som inte har läst texten, och peka ut var i texten du hittar det.'},
 {id:'lead',title:'Leda',does:'Du ställer frågan som gruppen ska prata om, ser till att fler kommer till tals och håller samtalet igång.',proof:'Det märks att du kan det när en tyst person får ordet, när du ställer följdfrågor och när du kan samla ihop vad ni kommit fram till.'},
 {id:'join',title:'Delta',does:'Du lyssnar på andras texter – även sådana du inte har läst – och bidrar med frågor och egna tankar.',proof:'Det märks att du kan det när du kan återge vad någon sa, koppla det till något annat och bygga vidare eller invända vänligt.'}
];
C.frame='Enligt Skolverkets beskrivning består den muntliga delen av nationella provet i svenska i årskurs 9 av att presentera och att leda och delta i diskussion, normalt i grupper om fyra–fem elever. Det här är din privata övning. Det är inte provet, inget här är ett betyg, och tiderna är bara övningsval.';
C.quiz=[
 {s:'Jag berättar vad texten handlar om och varför jag tycker som jag gör.',a:'present',why:'Du förklarar texten och din egen tanke – det är att presentera.'},
 {s:'Jag ställer frågan som gruppen ska prata om.',a:'lead',why:'Den som ställer samtalsfrågan och håller i samtalet leder.'},
 {s:'Jag frågar den tysta personen vad hen tänker.',a:'lead',why:'Att bjuda in fler är en ledarsak.'},
 {s:'Jag bygger vidare på något en kompis sa om sin text.',a:'join',why:'Du bidrar till någon annans samtal – det är att delta.'},
 {s:'Jag sammanfattar vad jag förstod, utan att läsa innantill.',a:'present',why:'Fri sammanfattning med egna ord hör till presentationen.'},
 {s:'Jag lyssnar på en text jag inte har läst och ställer en öppen följdfråga.',a:'join',why:'Att lyssna aktivt och fråga om okänt stoff är kärnan i att delta.'}
];

/* Ingredienser i ett resonemang */
C.ingredients={
 claim:{label:'Mitt svar',hint:'Ett tydligt svar på frågan.'},
 because:{label:'Därför',hint:'Varför du tänker så – ”eftersom”, ”därför att”.'},
 evidence:{label:'Belägg',hint:'Var i texten du ser det – ett stycke eller ett citat.'},
 other:{label:'Annan syn',hint:'Hur någon annan kan se det, eller vad som talar emot.'}
};
C.betterOptions=[
 {id:'claim',label:'Jag svarar tydligare på själva frågan'},
 {id:'because',label:'Jag har lagt till ett ”därför”'},
 {id:'evidence',label:'Jag har lagt till ett belägg ur texten'},
 {id:'other',label:'Jag har tagit med en annan syn'},
 {id:'example',label:'Jag har lagt till ett exempel'}
];

/* Modellexempel på påhittad text – visar hur ett resonemang växer. */
C.model={
 title:'Den tomma bänken',
 text:'Maja och Elin brukade sitta bredvid varandra. Sedan flyttade Elin till en annan klass, och bänken bredvid Maja blev tom. Varje kväll skrev Maja ett meddelande till Elin – och raderade det innan hon skickade. På lördagen stod Elin plötsligt utanför dörren med två muggar kakao. ”Jag orkade inte vänta på att du skulle skriva”, sa hon.',
 question:'Varför skickar Maja aldrig sina meddelanden?',
 answers:[
  {id:'w',label:'Svar A',t:'Hon vill inte.',tag:'weak'},
  {id:'m',label:'Svar B',t:'Hon är rädd att Elin har fått nya kompisar, eftersom hon ”raderar” meddelandena.',tag:'mid'},
  {id:'s',label:'Svar C',t:'Jag tror att Maja är rädd att Elin har gått vidare. Hon skriver varje kväll men ”raderar det innan hon skickade”, vilket visar att hon vill men inte vågar. Å andra sidan kan hon också tycka att det blir pinsamt om Elin inte svarar. Därför väntar hon hellre.',tag:'strong'}
 ],
 best:'s',
 explain:{
  w:'För tunt: det står inte varför eller var i texten du ser det.',
  m:'Bättre: här finns ett tydligt svar, ett ”eftersom” och ett belägg (”raderar”). Men det saknas en annan syn och en slutsats.',
  s:'Starkast: ett tydligt svar, ett ”därför”, ett belägg (skriver men raderar), en annan syn (”å andra sidan”) och en slutsats.'
 }
};

/* Hjälpnivåer per frågetyp – utan facit. Nivå 3 (jämför exempel) låses upp först efter eget försök. */
C.helpByType={
 opinion:{stems:['Jag tycker att texten är … eftersom …','Det som fastnade hos mig var … därför att …'],asks:['Vilket ställe i texten stannade du vid?','Vad kände du där – och varför?','Vad tror du att andra läsare tycker?']},
 view:{stems:['Jag tror att han/hon tycker att … eftersom …','Man ser det när …'],asks:['Vad gör eller säger de andra personerna?','Vilka ord visar vad berättaren tycker om det?','Är berättaren helt säker – eller är det mer komplicerat?']},
 motive:{stems:['Jag tror att han/hon gör det för att … Det syns när …','Det kan finnas flera skäl: … och …'],asks:['Vad vill personen få?','Vad är personen rädd för?','Vad skulle hända om hen gjorde tvärtom?']},
 effect:{stems:['Jag tror att utseendet påverkar … ganska mycket/lite eftersom …','Ett exempel är när …'],asks:['Hur reagerar andra när någon ser annorlunda ut?','Kan det vara olika för olika personer eller grupper?','Vad påverkar mer än utseendet?']},
 discussion:{stems:['Det som är ”normalt” bestäms av … eftersom …','Ett exempel är när …'],asks:['Kan du tänka på ett exempel där det ”normala” ändrats?','Vem tjänar och vem förlorar på vad som kallas normalt?','Finns det olika ”normalt” i olika grupper?']}
};
C.typeOfQuestion=['opinion','view','motive','effect','discussion'];
C.perspectivesGeneric=[
 {who:'En klasskamrat som tycker tvärtom',prompt:'Vad skulle hen säga – och vilket skäl skulle hen ha?'},
 {who:'En vuxen som känner dig',prompt:'Vad skulle den personen lägga märke till som du kanske missar?'},
 {who:'Samma situation för tio år sedan',prompt:'Vad hade varit annorlunda då?'}
];

/* Muntlig övning med nedtrappat stöd */
C.oral={
 levels:[
  {lvl:1,title:'Runda 1 · med alla stödord',text:'Titta på dina stödord. Säg svaret högt på 30–45 sekunder. Läs inte din text.'},
  {lvl:2,title:'Runda 2 · bara första ordet',text:'Bara det första stödordet i varje del syns. Resten kommer du ihåg.'},
  {lvl:3,title:'Runda 3 · inga stödord',text:'Nu syns bara frågan. Säg det du vill ha sagt med egna ord.'}
 ],
 rates:[{id:'free',label:'Fritt, utan att läsa innantill'},{id:'partly',label:'Delvis – tittade ibland'},{id:'read',label:'Jag läste mest innantill'}],
 tip:'Att läsa innantill känns tryggt men gör det svårare att lyssna på de andra. Stödord är 2–5 ord, inte meningar.'
};

/* Presentationens delar */
C.presParts=[
 {n:1,title:'Inledning',prompt:'Vilken text är det, vem handlar den om? (en mening)'},
 {n:2,title:'Vad händer',prompt:'Handlingen i egna ord – bara det viktigaste.'},
 {n:3,title:'Belägg',prompt:'Ett ställe i texten som visar något viktigt.'},
 {n:4,title:'Min tolkning',prompt:'Vad tänker jag – och varför?'},
 {n:5,title:'Till gruppen',prompt:'Frågan jag ställer till de andra.'}
];

/* Leda: simuleringar – du väljer, och ser varför */
C.leadSims=[
 {id:'silence',title:'Det blir tyst',setup:'Du har ställt frågan till gruppen: Sam, Noor, Elias och Frida. Efter tio sekunder har ingen sagt något.',
  options:[
   {t:'Jag svarar själv på frågan, så att det blir ett samtal.',good:false,why:'Då tar du över och de andra behöver inte tänka. Tystnad betyder ofta att folk tänker – eller inte vet hur de ska börja.'},
   {t:'”Vi tänker en minut var för sig. Sedan berättar ni två och två för varandra.”',good:true,why:'Du ger tänktid och en lättare start. Det är lättare att säga något till en person först.'},
   {t:'”Okej, då går vi vidare.”',good:false,why:'Då försvinner chansen att alla får tänka. Du kan ändra frågan eller sänka tröskeln först.'}
  ]},
 {id:'dominate',title:'Någon pratar och pratar',setup:'Elias har pratat i flera minuter. Noor försöker säga något men hinner inte.',
  options:[
   {t:'”Nu får du vara tyst, Elias.”',good:false,why:'Det kan såra och göra samtalet stelt. Bekräfta först, bjud sedan in någon annan.'},
   {t:'Jag väntar och hoppas att någon annan tar över.',good:false,why:'Ledaren hjälper gruppen att fördela ordet. Väntar du för länge försvinner Noors tanke.'},
   {t:'”Tack Elias, det var ett tydligt exempel. Noor, vad tänker du om det han sa?”',good:true,why:'Du bekräftar, kopplar till det han sa och bjuder in Noor.'}
  ]},
 {id:'disagree',title:'Skarp ton',setup:'Frida och Sam tycker tvärtom och tonen blir hård. De andra tittar ner i bänken.',
  options:[
   {t:'”Ni tänker olika. Kan var och en säga vad i texten som får er att tänka så?”',good:true,why:'Du håller samtalet öppet och flyttar fokus från personerna till skälen och texten.'},
   {t:'”Vi kan inte vara oeniga, vi måste bestämma oss.”',good:false,why:'Oenighet är material för samtalet. Du behöver inte ”vinna” – du behöver få fram skälen.'},
   {t:'”Okej, vi byter fråga.”',good:false,why:'Då lär sig gruppen att det blir obehagligt när man tycker olika. Prova att be om skäl först.'}
  ]},
 {id:'shallow',title:'”Det är bara bra”',setup:'Noor svarar kort: ”Det är bara bra.” Du vill att samtalet ska fördjupas.',
  options:[
   {t:'”Okej.”',good:false,why:'Då stannar samtalet vid ytan. Du kan ställa en öppen följdfråga.'},
   {t:'”Är det bra eller dåligt?”',good:false,why:'Det är en sluten fråga som kan besvaras med ett ord till.'},
   {t:'”Vad menar du med bra? Kan du ge ett exempel?”',good:true,why:'En öppen följdfråga ber om skäl och exempel utan att ifrågasätta personen.'}
  ]},
 {id:'offtopic',title:'Samtalet glider iväg',setup:'Gruppen börjar prata om ett tv-program. Frågan ni började med är bortglömd.',
  options:[
   {t:'”Det programmet är bra. Hur hänger det ihop med frågan vi började med?”',good:true,why:'Du tar emot det som sägs och leder tillbaka med en fråga, inte med en tillsägelse.'},
   {t:'”Vi pratar om fel sak!”',good:false,why:'Det kan kännas som en tillrättavisning. Bjud hellre in till att koppla ihop.'},
   {t:'Jag låter dem prata klart och hoppas att det går bra.',good:false,why:'Gruppens tid är begränsad. Ledaren håller i riktningen.'}
  ]}
];
C.leadFrames=[
 'Följdfråga: ”Vad i texten får dig att tänka så?”',
 'Följdfråga: ”Kan du ge ett exempel?”',
 'Inbjudan: ”… (namn), vad tänker du?”',
 'Sammanfatta: ”Så långt har vi sagt att … men vi tycker olika om …”'
];
C.objections=[
 'Jag tycker inte att den här frågan är viktig.',
 'Det finns inget rätt svar, så varför prata om det?',
 'Jag har inte läst texten.',
 'Alla vet ju hur det är, det behöver man inte diskutera.',
 'Jag håller inte med, men jag vet inte varför.',
 'Det där är samma sak som du sa nyss.',
 'Kan du förklara vad du menar med ”normalt”? Jag förstår inte.',
 'Min åsikt är den enda rätta.',
 'Ingen vågar säga vad de egentligen tycker.',
 'Du frågar bara dem som redan har pratat.',
 'Vi hinner inte – kan vi inte avsluta?',
 'Jag tycker precis som han där.'
];
C.family={
 title:'Rollkort för din övningspartner',
 how:'Du övar med en person hemma som inte behöver kunna något om texten. Be personen läsa korten nedan – ett i taget, i valfri ordning – och låt dig svara högt i 20–30 sekunder. Personen ska inte rätta, bara reagera som en vanlig gruppmedlem.',
 rules:['Börja med att eleven ställer sin diskussionsfråga. Svara kort.','Ibland: säg ingenting i tio sekunder.','Ibland: ta över och prata länge.','Läs ett kort från bunken när eleven vill ha en överraskning.','Efteråt: fråga ”Vad gick bra? Vad tar du med dig?” – inte ”Var det rätt?”.']
};

/* Delta: korta texter som ingen har läst i förväg */
C.joinTexts=[
 {id:'t1',title:'Lappen i skåpet',genre:'Berättelse',
  text:'På måndagen låg en lapp i Wilmas skåp. ”Din teckning av hunden i korridoren var bäst. Fortsätt!” stod det med blå penna, utan namn. Wilma läste den tre gånger. Hon visste att bara Ida och Jonas hade sett teckningen. På lunchen tittade hon på båda och försökte gissa. Ida skrattade för högt åt allt, och Jonas åt tyst med mössan neddragen. Wilma bestämde sig för att inte fråga. Hon gömde lappen i sin ryggsäck, och på tisdagen började hon rita igen.',
  ideas:['Någon har lämnat en anonym uppmuntran.','Wilma gissar vem det är men frågar inte.','Lappen får henne att börja rita igen.'],
  strong:{recap:'Wilma hittar en anonym uppmuntrande lapp om sin teckning och blir så glad att hon börjar rita igen.',link:'Det påminner mig om hur ett litet ”bra jobbat” kan betyda mycket, till exempel när en lärare sagt något snällt till mig.',q:'Varför tror du att personen valde att inte skriva sitt namn?',build:'Jag förstår tanken att hon inte vill fråga, men jag undrar om hon hade fått ännu mer av att veta vem det var.'}},
 {id:'t2',title:'Mobilen i skåpet?',genre:'Argumenterande',
  text:'Vår skola borde låta mobilerna ligga i skåpen under lektionerna. För det första är det svårt att koncentrera sig när någon bredvid dig får ett meddelande. För det andra blir rasterna bättre när man pratar med varandra i stället för att titta ner. Men en del elever behöver mobilen som hjälpmedel, och då måste det finnas undantag. Om skolan inför regeln utan att tänka på det riskerar den att slå fel. Min slutsats är att regeln är bra, men att den ska kunna anpassas.',
  ideas:['Skribenten vill ha mobilerna i skåpen under lektion.','Skäl: koncentration och bättre raster.','Skribenten ser en baksida: undantag för hjälpmedel.'],
  strong:{recap:'Skribenten tycker att mobilerna ska ligga i skåpen på lektionerna, men säger att det måste finnas undantag.',link:'Jag har själv märkt att det är lättare att lyssna när telefonen inte surrar – men jag förstår också de som behöver den som hjälpmedel.',q:'Hur skulle man kunna avgöra vem som får ha undantag utan att det blir orättvist?',build:'Jag håller med om att koncentrationen blir bättre, men jag är inte säker på att raster blir bättre – vissa använder mobilen för att slippa vara ensamma.'}},
 {id:'t3',title:'Bussen hem',genre:'Reflekterande',
  text:'Bussen var full när jag klev på. En äldre man med käpp stod bredvid mig, och ingen reste sig. Jag kände att jag borde, men jag satt kvar och låtsades titta ut genom fönstret. Efter tre hållplatser reste sig en kille i min ålder, utan att säga något. Mannen nickade bara. Jag tänkte på det hela kvällen. Det som stör mig mest är inte att jag inte reste mig – utan att jag väntade på att någon annan skulle göra det.',
  ideas:['Berättaren ser en man som behöver sitta men reser sig inte.','En annan kille reser sig.','Berättaren stör sig på sin egen väntan.'],
  strong:{recap:'Berättaren åker buss, ser att en äldre man behöver sitta, men reser sig inte, medan en annan kille gör det.',link:'Det liknar när man ser något orättvist i klassrummet och väntar på att någon annan ska säga något.',q:'Vad tror du hindrade berättaren från att resa sig?',build:'Jag förstår känslan av att vänta, men samtidigt tror jag att det ofta är just de som tvekar som gör mest när de väl agerar.'}}
];
C.joinSteps=[
 {id:'recap',title:'Återge',ask:'Vad handlade texten om? En eller två meningar.',frames:['Texten handlar om …','Det viktigaste som händer är …']},
 {id:'link',title:'Koppla',ask:'Koppla till något annat – en annan text, något du upplevt eller något du vet.',frames:['Det påminner mig om …','Jag har själv sett/upplevt …']},
 {id:'q',title:'Öppen fråga',ask:'Ställ en fråga som kräver mer än ja eller nej.',frames:['Varför tror du att …?','Hur skulle … om …?']},
 {id:'build',title:'Bygg vidare eller invänd vänligt',ask:'Bygg vidare på det du hörde, eller säg att du ser det annorlunda – och varför.',frames:['Jag håller med om att … men jag undrar …','Jag ser det lite annorlunda eftersom …']}
];

/* Generalrepetition och reflektion */
C.rehearsal={
 steps:['Presentera texten och en viktig händelse.','Förklara en egen åsikt och ett belägg.','Ställ skolans diskussionsfråga.','Ställ två följdfrågor och bjud in någon som inte pratat.','Lyssna på partnern och bygg vidare eller invänd vänligt.','Sammanfatta vad ni kom fram till.'],
 timerNote:'Klockan är ett övningsval. Den visar inte provets tid.'
};
C.reflect=[
 {k:'first',label:'Vad kunde jag först, när jag började?'},
 {k:'better',label:'Vad har blivit bättre – och hur vet jag det?'},
 {k:'next',label:'Vad ska jag öva mer på nästa gång?'}
];
C.statusText={0:'Inte påbörjad',1:'Första svaret',2:'Med belägg eller annan syn',3:'Förbättrat',4:'Sagt högt'};
C.stationInfo={
 start:{n:1,title:'Så fungerar övningen',goal:'Du vet vad Presentera, Leda och Delta innebär.',mins:'3 min'},
 read:{n:2,title:'Läs och förstå',goal:'Du kan återberätta delarna med egna ord och har sparat belägg.',mins:'15 min'},
 think:{n:3,title:'Tänk och svara',goal:'Du kan ge ett resonemang med belägg – och förbättra det.',mins:'30 min'},
 present:{n:4,title:'Presentera',goal:'Du kan presentera utan att läsa innantill.',mins:'15 min'},
 lead:{n:5,title:'Leda samtalet',goal:'Du kan ställa frågor, bjuda in och hantera tystnad och oenighet.',mins:'20 min'},
 join:{n:6,title:'Delta i andras texter',goal:'Du kan lyssna, fråga och bidra – även på en text du inte läst.',mins:'20 min'},
 finish:{n:7,title:'Generalrepetition',goal:'Du har övat hela provet och sett vad du blivit bättre på.',mins:'15 min'}
};
root.MO_NP_CONTENT=C;
if(typeof module==='object'&&module.exports)module.exports=C;
})(typeof window!=='undefined'?window:globalThis);
