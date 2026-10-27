# Matte Prov v1

Separat testmiljö för Matte OS.

## Syfte
Matte OS undervisar och tränar. Matte Prov mäter vad eleven kan utan formelstöd, ledtrådar eller direkt rättning.

## Lägen
- **Diagnos**: ett moderat problem per moment i valt kapitel, ingen timer. Avsedd för att hitta luckor.
- **Prov**: blandat prov med hela kapitlet representerat, 45 min tränings-timer. 45 min är inte skolans officiella provtid.

## Scope
Åk 8 och Åk 9 använder samma verifierade innehållsbank som Matte OS v5.1.0:
- Åk 9: Tal, Geometri, Procent.
- Åk 8: Tal, Geometri, Algebra.

## Privacy
Alla resultat sparas i localStorage på den aktuella enheten. Inga elevnamn eller resultat publiceras i GitHub.

## Resultat
Efter inlämning visas:
- totalpoäng/procent
- resultat per moment
- förmågetaggar när minst två bedömda frågor finns
- fråga-för-fråga-granskning
- länk tillbaka till Matte OS för svagaste momentet

## Rollback
Före införandet skapades grenen `rollback-v5.1-before-prov-v1`.
