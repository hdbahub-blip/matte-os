/* Matte OS · "Plugga smart": short study-technique stories.
   Written for 13–16 year olds: few words, one idea per card, one thing to try now.
   Grounded in well-replicated learning research (retrieval practice, spacing,
   interleaving, self-explanation, sleep, attention). No claims of guaranteed grades. */
(function (root) {
  'use strict';
  const STORIES = [
    { id:'fastnat', icon:'?', title:'Fastnat?', a:'#5B21D6', b:'#8B5CF6',
      cards:[
        { big:'Fastnat? Helt normalt.', small:'Alla fastnar. Proffs har bara en plan för det.' },
        { big:'1. Vad frågas?', small:'Läs sista meningen igen. Säg frågan med egna ord.' },
        { big:'2. Vad vet du?', small:'Skriv upp talen och enheterna. Allt du vet räknas.' },
        { big:'3. Rita eller testa', small:'Gör en skiss. Eller prova med enkla tal först.' },
        { big:'4. Är det rimligt?', small:'Kolla svaret. Ett barn som väger 400 kg? Räkna om.' },
        { big:'Fortfarande fast?', small:'Ta en ledtråd. Det är träning, inte fusk.', cta:{label:'Öva nu', href:'../#/trana'} }
      ] },
    { id:'testa', icon:'⚡', title:'Testa dig', a:'#C2185B', b:'#F0508A',
      cards:[
        { big:'Läsa om känns bra.', small:'Men det fastnar dåligt. Det är en fälla.' },
        { big:'Testa dig själv i stället.', small:'Stäng boken. Försök minnas. Det är då hjärnan bygger.' },
        { big:'Fel är bra här.', small:'Varje gång du kämpar för att minnas blir minnet starkare.' },
        { big:'Gör 5 frågor nu.', small:'Tar 5 minuter.', cta:{label:'Starta 5 frågor', href:'../#/trana'} }
      ] },
    { id:'fokus', icon:'◷', title:'Fokus', a:'#0A6E62', b:'#14A38E',
      cards:[
        { big:'Mobilen i ett annat rum.', small:'Bara att se den tar en del av ditt fokus. På riktigt.' },
        { big:'Kör korta pass.', small:'10–25 minuter fokus. Sen 5 minuter paus.' },
        { big:'En sak i taget.', small:'Musik utan text funkar för många. Serier gör det inte.' },
        { big:'Starta en timer.', small:'Bestäm tiden. Börja direkt.', timer:true }
      ] },
    { id:'sprid', icon:'✦', title:'Lite varje dag', a:'#B45309', b:'#F59E0B',
      cards:[
        { big:'15 min × 4 dagar', small:'slår 60 minuter samma kväll. Samma tid, mer kvar i huvudet.' },
        { big:'Hjärnan sparar när du sover.', small:'Därför funkar det att plugga lite, sova, och plugga igen.' },
        { big:'Repetera när det nästan glömts.', small:'Lite jobbigt = perfekt läge att repetera.', cta:{label:'Minnesknep', href:'../#/knep'} }
      ] },
    { id:'blanda', icon:'⇄', title:'Blanda', a:'#1D4ED8', b:'#3B82F6',
      cards:[
        { big:'Blanda typer av uppgifter.', small:'Procent, ekvationer, geometri – om vartannat.' },
        { big:'Känns svårare. Är bättre.', small:'Du tränar att välja metod. Det är det provet testar.' },
        { big:'Testa blandträning.', small:'Fem blandade frågor, ingen metod angiven.', cta:{label:'Blandat', href:'../#/trana'} }
      ] },
    { id:'forklara', icon:'❝', title:'Förklara', a:'#7C2D92', b:'#B05CC8',
      cards:[
        { big:'Kan du förklara det, kan du det.', small:'Förklara för en kompis, en förälder eller din mobilkamera.' },
        { big:'Fråga dig: varför?', small:'”Varför blir det så?” fäster bättre än att bara veta svaret.' },
        { big:'Debattera!', small:'För och emot tränar att tänka och prata.', cta:{label:'Debattspelet', href:'../lara/debatt.html'} }
      ] },
    { id:'lasa', icon:'◎', title:'Läs uppgiften', a:'#0E7490', b:'#22A3C3',
      cards:[
        { big:'Hitta frågeordet.', small:'Hur mycket? Hur många? Vilket? Det styr svaret.' },
        { big:'Stryk under tal och enheter.', small:'cm, kr, %, timmar. Ska svaret ha en enhet?' },
        { big:'Släng bort brus.', small:'Långa texter har ofta info du inte behöver. Det är meningen.' }
      ] },
    { id:'misstag', icon:'✕', title:'Misstag', a:'#BE123C', b:'#F43F5E',
      cards:[
        { big:'Misstag = data.', small:'Felet visar exakt var du ska öva. Gratis info.' },
        { big:'Skriv ner felet.', small:'Inte bara rätt svar. Vad tänkte du? Var gick det snett?' },
        { big:'Gör om samma typ.', small:'Två dagar senare. Klarar du den nu har du lärt dig.' }
      ] },
    { id:'prov', icon:'★', title:'Inför prov', a:'#4338CA', b:'#6366F1',
      cards:[
        { big:'En vecka innan', small:'Gör gamla prov på tid. Se vad som saknas.' },
        { big:'Kvällen innan', small:'Lätt repetition. Inget nytt. Sov 8–9 timmar.' },
        { big:'På provet', small:'Börja med det du kan. Fastnar du – hoppa och kom tillbaka.', cta:{label:'Matte Prov', href:'../#/trana'} }
      ] },
    { id:'belona', icon:'♥', title:'Belöna dig', a:'#047857', b:'#10B981',
      cards:[
        { big:'Bestäm belöningen innan.', small:'Klar med passet → serie, snack, gaming. Du har förtjänat det.' },
        { big:'Jämför dig med dig.', small:'Inte med andra. Bättre än förra veckan = vinst.' },
        { big:'Snäll mot dig själv.', small:'Dålig dag? Gör 5 minuter. Det räknas.' }
      ] }
  ];
  root.MOSmart = Object.freeze({ STORIES });
})(typeof window !== 'undefined' ? window : globalThis);
