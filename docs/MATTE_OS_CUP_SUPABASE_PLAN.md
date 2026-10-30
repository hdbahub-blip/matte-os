# Plan: dedikerat gratisprojekt för Matte OS Cup

**Status: ej godkänd, ingenting skapat.** Inget befintligt projekt får pausas, raderas eller återanvändas, och inget betalt projekt skapas utan ditt uttryckliga ja.

## Nuläge (läst från kontot, endast läsning)
Organisationen har 5 projekt. **Aktiva (2):** `glow-grow-summer-league`, `apex-life-ops-endgame-pilot`. **Inaktiva (3):** `mohamed321966-wq's Project`, `apex-oi-nonprod-rc2-20260819`, `noor-stage-b-0043-gate-20261026`. **[FA]** Gratisnivån tillåter 2 aktiva projekt, alltså är båda platserna upptagna. Test: Billing/Usage i Supabase-konsolen eller att `create_project` visar kostnad innan bekräftelse (jag bekräftar aldrig ett belopp själv).

## Alternativ (max tre) och rekommendation
1. **Du frigör en gratisplats själv** (pausar eller raderar ett projekt som du äger och inte behöver), därefter skapar jag `matte-os-cup-prod` (gratis, eu-north-1). Kostnad 0 kr. Risk: du måste själv bedöma att det pausade projektet inte behövs; jag rör inget av dem.
2. **Betalt projekt** i organisationen (kostnadsbekräftelse visas före skapande). Kostnad: enligt Supabase prislista **[FA, slå upp vid beslut]**. Fördel: ingen pausrisk (gratisprojekt pausas efter inaktivitet).
3. **Vänta** och behåll Cup avstängd (`js/cup-config.js` har tom `url`). Studieläget fungerar redan.
**Rekommendation:** 1 för test och första spelkväll; 2 först om ni spelar regelbundet. Det som måste vara sant: att du kan undvara en av de två aktiva eller tre pausade projekten, och att gratisprojektet inte pausats av inaktivitet vid spelkvällen (kör en testmatch dagen innan).

## Kapacitet [FA]
Polling 1 anrop/s/spelare. 10 spelare ≈ 36 000 anrop/timme; vid ~2 KB/svar ≈ 72 MB/timme. 24 spelare ≈ 170 MB/timme. Gratisnivåns utgående trafik (5 GB/månad enligt mina anteckningar, **ej uppslaget**) räcker då till ca 30–70 spelade timmar/månad. Test: Usage-sidan efter första testmatchen. Åtgärd om det blir trångt: polla var 2:a sekund i lobby och mellan rundor (ej implementerat).

## Efter godkännande – körordning och bevis (inget av detta är gjort)
1. Skapa projektet (efter kostnadsbekräftelse) och notera ref.
2. Kör `cup/supabase/0001_matte_os_cup.sql` som EN migration (`apply_migration`). Bevis: `list_migrations`, `list_tables` (inga tabeller i `public`).
3. Rättigheter: fråga `pg_proc`/`has_function_privilege` som i `tests/cup-hardening.js` mot det riktiga projektet; exakt 11 `cup_*` körbara för anon.
4. `get_advisors(security)` och `get_advisors(performance)`. Förväntat: varningar om anon-körbara SECURITY DEFINER-funktioner (avsiktliga, dokumenteras). Allt annat åtgärdas.
5. Hämta publishable key (`get_publishable_keys`), lägg `url` + nyckel i `js/cup-config.js` (aldrig `service_role`).
6. Verkliga API-anrop och header-probe enligt `docs/MATTE_OS_CUP_STAGING.md` §B (publishable key utan Authorization, RATE efter 6 skapanden, vilken IP-header som faktiskt kommer fram, justera `cup.settings`).
7. Fullt spel från **tio separata mobiler** (värd + 10 deltagare) via GitHub Pages-staging, med skärmdumpar/logg. Först då ändras beslutet till GO.
8. Rollback: tom `url` i `js/cup-config.js`; kör `cup/supabase/rollback_0001.sql` (testat, tar bara Cups egna objekt).
