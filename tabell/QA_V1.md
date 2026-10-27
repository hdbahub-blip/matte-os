# Tabellarenan — acceptansgranskning v1.0.2
Datum: 2026-10-27

## Mission
Bygg om den tidigare Multiplikationsboost till en lugn men rolig, mobilförst tabellarena inne i **ordinarie Matte OS**, inte i Matte Prov.

## Levererat
- Tydligt val av hela multiplikationstabellen 1–10.
- Egen referenssida per tabell med 10 korrekta uträkningar, n×1 till n×10.
- Egen träning per vald tabell, 10 uppgifter per omgång, direkt återkoppling, en uppgift åt gången.
- Blandprov med 20 unika frågor från tabell 1–10, utan facit förrän avslut.
- Tvåspelarduell: valfri tabell eller blandat, 10 rundor, två touchknappar samt tangentbordsknappar A/L, muntlig svarsgivning och manuell rätt/fel-markering.
- Duellfel ger andra spelaren en chans. Inga minuspoäng.
- Progress per profil i befintlig lokal Matte OS-state med export/import.
- Stabil tabellstatus kräver minst 9/10 rätt på **två skilda lokala kalenderdagar**; ett enskilt bra pass räcker inte.
- Veckouppdrag: 3 olika träningsdagar, ingen straffande streak eller countdown.
- Egen offline service worker under /tabell/.
- Huvudstartsidans Multiplikationsboost-kort leder till Tabellarenan; gammal hashväg redirectar också hit.
- Tydlig separation från Matte Prov. Inga minderårigas namn i offentlig kod.

## Versionsstatus
- Ordinarie Matte OS: v5.3.1.
- Tabellarenan: v1.0.2.
- GitHub Pages: https://mohamed321966-wq.github.io/matte-os/tabell/
- Rollback-gren skapad före implementering: rollback-v5.2.1-before-tabellarena

## Oberoende browser-QA
Extern browser öppnade live-sidan, valde Åk 9, såg samtliga tio tabellkort utan synlig overflow och verifierade 7:ans alla 10 uträkningar.
Live-HTML kontrollerades även för Åk 8-duelluppsättning med namn, tabellväljare och startknapp.

Browserns fulla klickflöde genom träningsfrågor, blandprov och duell blev inte klart i dess begränsade körfönster.

## Deterministiska funktionskontroller
Körda mot hämtad GitHub-kod i isolerad simulerad DOM/lokal state:
- 59/59 interaktionskontroller (tabellval, 10 frågesteg, rättning, blandprov, duell 10 rundor, resultat)
- 35/35 kompletterande kontroller (samtliga 100 tabelluträkningar, 150 olika blandade prov med 20 unika frågor och täckning 1–10, stabilitet över två dagar, övertag av duellfråga, ingen sammanblandning av duellpoäng med elevens tabellframsteg, säkerhetskopia).
- 0 funna syntaxfel i slutlig app-, arena-, state- och service-worker-kod.
Dessa är kod-/simuleringskontroller, inte full fysisk iPhone-acceptans.

## Kvarvarande kontroll
Fysisk iPhone/Safari: tangentbord, touch med två spelare, PWA/offline/återinträde.
Vid muntlig duell sker rätt/fel-beslut av människa — appen verifierar inte talautomatiskt.
