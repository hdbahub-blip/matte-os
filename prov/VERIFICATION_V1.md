# Matte Prov v1.0.1 — verification

Datum: 2026-10-27

## Mission
Separat testmiljö från Matte OS. Matte OS används för undervisning/träning; Matte Prov används för diagnos och träningsprov utan formelstöd, ledtrådar eller direkt rättning.

## Scope
Samma verifierade innehållsbank som Matte OS v5.1:
- Åk 9: Tal (10 moment), Geometri (10), Procent (7).
- Åk 8: Tal (11), Geometri (15), Algebra (10).

## Lägen
- Diagnos: exakt en moderat fråga per moment i valt kapitel. Ingen timer.
- Prov: alla moment representeras minst en gång, därefter extra D/F/C-frågor upp till max 18. 45 min tränings-timer. Tiden är inte skolans officiella provtid.

## Automatisk urvals-QA
Fem olika seeds/omgångar testades för varje kombination av 2 årskurser × 3 kapitel × 2 lägen:
- 60 genererade testomgångar
- 715 valda frågor totalt
- 60/60 hade full momenttäckning
- 60/60 hade inga dubbletter
- 715/715 kanoniska korrekta svar godkändes av Matte OS svarsmotor

Förväntade längder:
- Åk 9 Tal: diagnos 10, prov 13
- Åk 9 Geometri: diagnos 10, prov 13
- Åk 9 Procent: diagnos 7, prov 9
- Åk 8 Tal: diagnos 11, prov 14
- Åk 8 Geometri: diagnos 15, prov 18
- Åk 8 Algebra: diagnos 10, prov 13

## Live browser QA
Extern browser-QA verifierade:
- Åk 9 rekommenderar Geometri inför v46.
- Två primära lägen: Diagnos och Prov.
- Åk 9 Geometri Diagnos = 10 frågor.
- Ingen timer i Diagnos.
- Inga ledtrådar eller formelkontroller under test.
- Ingen omedelbar rätt/fel-feedback.
- Första diagnosfrågan renderade utan synlig horisontell overflow.

QA hittade ett fel i första versionen: native confirm vid "Avsluta" blockerade automatiserad retur från testet. Det ersattes i v1.0.1 av en explicit in-page confirmation ("Fortsätt testet" / "Avsluta").

Åk 8 Geometri Prov är verifierat i urvals-QA till 18 frågor och timerlogiken finns i koden, men full extern browser-QA efter exit-fixen är ännu inte omkörd.

## Resultat
Efter inlämning visas:
- total rätt/procent
- resultat per moment
- förmågetaggar när tillräckligt underlag finns
- fråga-för-fråga med elevens svar, facit och lösning
- länk tillbaka till Matte OS för svagaste momentet

## Privacy
Resultat sparas endast i localStorage/sessionStorage på enheten. Ingen elevdata publiceras.

## Rollback
`rollback-v5.1-before-prov-v1`

## Kvarvarande grind
- fysisk iPhone/Safari
- full browser-run av Åk 8 Geometri Prov efter v1.0.1 exit-fix
- verkligt elevprov
