'use strict';
// Helt syntetiskt NP-paket (påhittad text). Används av alla NP-tester. Innehåller INGEN skoltext.
function make(){
 const paras=[
  'Mira stod vid bussen varje morgon och väntade på att någon skulle vinka. Ingen gjorde det, men hon kom ändå tillbaka dag efter dag.',
  'Den gamla klockan i hallen hade stannat på kvart i åtta. Ingen i familjen ville laga den, fast alla pratade om den.',
  '”Du behöver inte säga något”, sa Jonte och räckte henne en kopp te. Hon sa ändå ingenting.',
  'På fredagen bytte hon plats i klassrummet. Ingen sa något om det, men Jonte tittade länge på den tomma stolen.',
  'Hon skrev ett brev och rev sönder det. Sedan skrev hon ett nytt och lät det ligga kvar på bordet.',
  'När klockan slog kvart i åtta hoppade hon till. Någon hade lagat den under natten.',
  'Hon gick ner till köket. Där stod Jonte med ett leende och två koppar te.',
  'Det är inte alltid de stora orden som räknas, tänkte hon. Ibland räcker en kopp te och en lagad klocka.'];
 return {format:'matte-os-np-private-v2',workId:'en-stark-nolla',grade:'grade9',title:'Syntetisk testtext',
  schoolIntro:'Syntetisk inledning om Mira och bussen.',summary:'Syntetisk sammanfattning: Mira och Jonte och en lagad klocka.',
  questionHeading:'Syntetiska frågor',questions:['Hur upplever du den här texten? Motivera.','Vad tycker Mira om att vänta?','Varför bytte Mira plats?','Hur mycket påverkar en liten handling en person?'],
  discussionHeading:'Syntetisk diskussionsfråga',discussionQuestion:'Vad betyder en vänlig handling?',discussionInstruction:'Använd gärna exempel.',
  textParagraphs:paras,note:'Syntetisk anmärkning.',
  sections:[{title:'Del A',paras:[0,1,2],keyPoints:['Mira väntar vid bussen.','Klockan har stannat.']},{title:'Del B',paras:[3,4,5],keyPoints:['Hon byter plats.']},{title:'Del C',paras:[6,7],keyPoints:[]}],
  fidelity:[{i:0,status:'VERBATIM_PHOTO'},{i:1,status:'PHOTO_PARTIAL'},{i:2,status:'VERBATIM_PHOTO'}],
  supports:Array.from({length:5},(_,i)=>({steps:['Syntetisk tankefråga '+i],evidence:'Syntetiskt belägg',perspective:'Syntetiskt perspektiv',stem:'Jag anser (syntetisk)',
   weak:i<2?'Syntetiskt svagt svar.':'',strong:i<2?'Syntetiskt starkt svar med eftersom och å andra sidan.':'',why:i<2?'Syntetisk förklaring.':'',evidenceParas:[0,1],perspectives:[{who:'Syntetisk person',prompt:'Vad skulle hen säga?'}]}))};
}
module.exports={make};
