# Matte OS Cup – så startar ni ett spel med tio egna mobiler

## Läge idag (viktigt)
**Implementerat och testat lokalt:** ja (se `docs/MATTE_OS_CUP_AUDIT.md` §6). **Publicerat och spelbart på riktiga telefoner:** *nej*, förrän stegen nedan är gjorda. Studieläget (tabeller, täcka svar, minitest) fungerar redan utan server.

## Aktivera (en gång, ca 15 min, kräver ditt godkännande)
1. Följ `docs/MATTE_OS_CUP_SUPABASE_PLAN.md`: ett **nytt, tomt, dedikerat** projekt (inte glow-grow eller apex-life-ops). Gratisnivån har 2 aktiva projekt och båda platserna är upptagna, så detta kräver ditt beslut om att frigöra en plats eller godkänna ett betalt projekt. Inget görs automatiskt.
2. Kör `cup/supabase/0001_matte_os_cup.sql` i SQL Editor (en gång).
3. Under *Project Settings → API* kopiera **Project URL** och **anon/publishable key** (aldrig `service_role`).
4. Fyll i dem i `js/cup-config.js` (`url`, `anonKey`), bumpa versionen och merga PR:en. Efter GitHub Pages-publiceringen: öppna appen → Tabellarenan → Matte OS Cup. Menyvalen "Skapa spel" och "Gå med" blir aktiva.
5. Kör `get_advisors(security)` i Supabase och kontrollera att inga tabeller i `public` listas.

## Spelkväll med tio mobiler
1. **Före:** alla öppnar Matte OS en gång på nätet (så den cachas), väljer årskurs (färgtema). Studera tabellerna gärna i Studieläget.
2. **Värd (egen mobil eller större skärm):** Tabellarenan → *Matte OS Cup* → *Skapa spel*. Välj tabeller (t.ex. 6–9), 10 frågor, 20 sekunder. Tryck *Skapa spel*. Kod + QR visas.
3. **Spelare:** skanna QR (öppnar länken) eller *Gå med* och skriv koden. Välj ett smeknamn (inte riktigt namn). Tryck *Jag är redo*. Samma namn får automatiskt siffra efter.
4. **Värd:** när alla är redo, *Starta kvalet*. Nedräkning, sedan egen takt. När alla är klara visas topplistan för alla. *Nästa steg →* leder till utslagsrunda (vid lika på gränsen), semifinaler, final bäst av tre och prispall.
5. **Stöd:** laddar någon om sidan (eller låser skärmen) går de tillbaka in i samma spel; sessionen ligger i telefonens lokala lagring. Rensar någon webbläsardata mitt i spelet kan platsen inte återtas (i lobbyn: gå med igen, värden tar bort spöket ✕). Värden: håll telefonen laddad och rensa inte webbläsardata; titta på online-prickarna innan *Nästa steg*, och använd *Avsluta rundan nu* om någon hänger. Tappar någon nätet visas en gul banner. Fel person i lobbyn? Tryck ✕. Avbryt: *Avsluta spelet*.
6. Spelet raderas automatiskt efter 6 timmar.

## Teknik i korthet
Statisk PWA + Supabase RPC. Ingen Realtime/Auth. Hemligheter hashas i databasen. Missbruksskydd och rättigheter: audit §9. Se auditdokumentet för hotmodell.
