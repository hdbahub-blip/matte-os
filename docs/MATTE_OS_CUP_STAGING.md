# Matte OS Cup – staging- och releasechecklista (riktig Supabase)

**Förutsättning:** dedikerat projekt är godkänt av Mohamed (se `MATTE_OS_CUP_SUPABASE_PLAN.md`). Inga befintliga projekt rörs. Allt nedan är **ej genomfört** tills dess; kryssa av med bevis (skärmdump/utdata) i PR:en.

## A. Migrering och rättigheter
- [ ] `apply_migration` med `cup/supabase/0001_matte_os_cup.sql` (en gång). Bevis: `list_migrations`.
- [ ] `list_tables`: inga tabeller i `public`; i schema `cup` 8 tabeller (rooms, players, rounds, round_players, questions, answers, rate, settings), alla med RLS på.
- [ ] SQL: `select proname from pg_proc where pronamespace='public'::regnamespace and has_function_privilege('anon', oid, 'execute')` → exakt de 11 `cup_*` (plus ev. projektets egna). Inga `cup.*` körbara för anon.
- [ ] `get_advisors(security)` och `get_advisors(performance)`: förväntade varningar = "anon kan köra SECURITY DEFINER-funktion" ×11 (avsiktligt, varje funktion kräver rumskod + hemlighet). Allt annat åtgärdas eller förklaras skriftligt.

## B. Riktiga API-anrop (curl, publishable key)
- [ ] `cup_create` med **enbart** `apikey`-huvud (ingen Authorization) → 200 med `code`. Samma anrop med `Authorization: Bearer sb_publishable_…` → förväntat fel (bekräftar varför klienten inte skickar det).
- [ ] Kod, join, ready, start, answer, state genom `js/cup-api.js` mot det riktiga projektet.
- [ ] `cup_answer` svarar `{ok, duplicate, answered}` utan `correct`/`answer`; `cup_state` under aktiv runda utan facit.
- [ ] **IP-header-probe (avgör rate-limit-inställningen):** skapa tillfälligt `create function public.zz_hdr() returns json language sql security definer as $$ select current_setting('request.headers', true)::json $$; grant execute on function public.zz_hdr() to anon;`. Anropa via REST med `-H 'x-forwarded-for: 6.6.6.6'` från två olika nät. Anteckna: finns `cf-connecting-ip`? Hur ser `x-forwarded-for` ut (klientens falska värde först, verklig IP sist, extra interna hopp)? Radera funktionen (`drop function public.zz_hdr()`).
  - `cf-connecting-ip` finns och är din verkliga IP → inget att ändra.
  - Bara `x-forwarded-for`, verklig IP sist → standard `xff_from_right=1` är rätt.
  - Extra hopp efter din IP → `update cup.settings set val='2' where key='xff_from_right'` (eller 3).
  - Ingen användbar header → `update cup.settings set val='off' where key='ip_mode'` (globala tak gäller ändå).
- [ ] Rate limit i drift: 7 × `cup_create` från samma dator → det sjunde svarar `{"error":"RATE: …"}`; 130 ogiltiga `cup_join` → RATE efter 120.

## C. Spelkväll: tio mobiler (värd + 10 deltagare)
- [ ] Release-bygget på staging-URL (GitHub Pages-gren eller förhandsvisning), `js/cup-config.js` ifylld med projektets URL + publishable key (aldrig `service_role`). Version 5.5.0, service worker uppdaterad på alla telefoner (öppna appen två gånger).
- [ ] Minst 10 *fysiska* telefoner (blandade iPhone/Android, blandat Wi-Fi/mobildata, inte alla på samma nät). Anteckna modell och webbläsare.
- [ ] Alla studerar tabellerna (Studieläge) och gör minitestet; kontrollera att Matte OS-framsteg (`matteos.v5`) är oförändrade.
- [ ] Värd skapar spel; 10 går med via QR och via kodinmatning (båda vägarna); dubbelt smeknamn får siffra; alla trycker Redo.
- [ ] Kval: ingen skärm visar rätt/fel eller facit under rundan (neutral "Svar skickat"); efter rundan visas topplista + egen genomgång. Notera klockslag per fas.
- [ ] **Återanslutning:** (1) ladda om en spelares sida mitt i rundan, (2) lås skärmen 20 s och lås upp, (3) flygplansläge 10 s, (4) byt Wi-Fi→4G. Alla hamnar i samma spel utan dubbel plats. Värdens sida laddas om mellan två rundor och styr vidare.
- [ ] Utslagsrunda vid lika på gränsen (provocera med två spelare som svarar lika), semifinaler 1v4/2v3, final bäst av tre inklusive minst ett avgjort-på-utslag eller ett 2–0.
- [ ] Prispall: 1:a, 2:a, delad 3:e (två semifinalförlorare) stämmer mot kvalplaceringen.
- [ ] Efter spelet: Usage-sidan (trafik/DB), loggar (`query_logs`) utan fel; `select count(*) from cup.rooms` ≈ 1; kontrollera att `cup.rate` inte växer okontrollerat.
- [ ] Beslutsrad i PR: antal telefoner, nät, avvikelser, GO/HOLD med skäl.

## D. Rollback (testad lokalt: `tests/cup-rollback.js`, 8 kontroller)
1. Stäng av i klienten: sätt `url` till `''` i `js/cup-config.js` och publicera (Cup-knappar stängs, resten av Matte OS oförändrat).
2. Databas: kör `cup/supabase/rollback_0001.sql`. Tar bort exakt de 11 `cup_*`-funktionerna (namngivna) och schema `cup`; rör inte andra funktioner/tabeller/roller. Idempotent. **Raderar pågående spel.**
3. Bevis efter rollback: `select count(*) from pg_namespace where nspname='cup'` = 0 och funktionslistan från A är tom för `cup_*`.
4. Återinstallation går att köra igen (rundtur testad lokalt).
