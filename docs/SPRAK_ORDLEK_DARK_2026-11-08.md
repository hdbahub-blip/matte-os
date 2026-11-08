# Matte OS · Språk & nattläge — audit och verifieringskontrakt, 2026-11-08

## User intent
- Se fel i efterhand och träna på dem.
- Flera verkligt olika svenska och engelska texter på nivåer, huvudsakligen kryssuppgifter men också självformulerade svar.
- Lekfull ordförståelse: välj betydelse, sätt rätt ord i mening och skriv en egen mening.
- Nattversion för båda årskurserna, med marinblått åk 8 och burgundy åk 9.
- Resultat ska fungera även när användaren växlar mellan mobil och dator.

## Verifierad nulägesaudit
- Matematik: `matteos.v5` sparas lokalt i browsern.
- Lärande: `matteos.larande.v1` sparas lokalt.
- Språkverkstad 3: `matteos.sprak.v3`, separata årskursprofiler, sparar per-uppgiftresultat men endast första försöket som bevis för färdighet. Fria elevtexter och ljud sparas inte.
- Nu kopplas `matteos.ordlek.v1` till säkerhetskopian från Lärande. Det är fortfarande lokalt per enhet.
- Vid kontroll saknades en befintlig autentiserad elevsynk och färdig skyddad elevdatabas; därför är **automatisk synk INTE aktiverad** i den här PR:n.

## Leverans
1. Nattläge (☾/☀) i både Matematik och Lärande, med gemensamt lokalt appearance-val `matteos.appearance.v1`. Tabellarenans shadow root får samma läge. Kontrast och elevfärg testas. Ingen progressionsdata ändras av temaväxling.
2. Ordlek med 16 svenska och 16 engelska ord, två frågetyper per ord och frivillig fri mening. Läsförståelsens öppna frågor finns kvar. Fri text sparas aldrig.
3. Sidan Mina fel visar både ännu ej lösta och senare rättade frågor, rätt svar och källtextlänk. Övningsräkning och senaste rätt/fel sparas separat från första försökets färdighetsbedömning. Historiskt felval/text lagras inte.
4. Textbanken: 8 unika svenska och 8 unika engelska texter, 143 läsuppgifter. Nya genrer: informationsbrev, intervju, instruktioner/meddelanden och recension/åsikt. Tre nivåer finns kvar.
5. Lokal backup/export från Lärande innehåller även ordlek. Import stöder gamla filer utan ordlek. Säkerhetskopian för Matematik ligger fortsatt separat.

## Säker automatisk synk — HOLD
[FA] Användarnas mobil och dator kan användas av olika personer och eleverna kan vara minderåriga. Verifiera att ägaren faktiskt vill registrera ett separat inloggat elevkonto eller en vuxenhanterad familjeinloggning för den redan existerande elevprofilen innan införande.

För aktivering krävs:
- Verifierad identitet för varje elev/session utan publika skriv-/läsrättigheter.
- Auth + ägarspecifik RLS + faktisk cross-user och cross-device negativtestning, gärna EU-lagring.
- Konfliktpolicy (event-ID + tid + idempotens och manuell återställning), offlinekö och export/radering.
- Inte lägga känsliga skrivsvar, elevnamn, råa ljud eller hemliga nycklar i publik klient.
- Föräldra-/ägargodkännande för kontoupplägg och dataskydd där det behövs.
- Först därefter slå på cloud sync. **Detta är inte färdigbyggt.**

## Release gate
- Samma slutcommit: unit-content, browser-mobile, cross-engine, cup-backend samtliga gröna. Testa åk 8/9, nattläge, lokal backup, felhistorik, ordvalsordning, alla gamla texter, prov och Cup.
- Publicera först efter godkänd merge; kontrollera att GitHub Pages byggt och faktisk live-sida visar funktionerna.
- Fysiska mobiler och verklig pedagogisk nytta återstår alltid för användartest.

Rollback: revert PR och bump cachar; spara inte över lokal data. Ingen backendändring/schemaändring i detta arbete.
