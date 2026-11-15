# Matte OS · Tillsammans Live v1 — säkerhets-, release- och rollbackprotokoll

**Status 2026-11-15:** Det kontofria läget har mergats via PR #35. Live-koden har passerat 5/5 CI och är färdig för webbpublicering; de två isolerade Live-migrationerna är installerade i det dedikerade Supabaseprojektet. **Inga autentiserade Study Cloud-konton har skapats** och verkliga tvåtelefonssessioner är därför ännu inte verifierade. Fysisk iPhone-granskning och extern HTTPS-readback är egna återstående steg.



### Read-only preflight före Live-installation, 2026-11-15

Utförd med **enbart SELECT**, utan ändring av auth, schema eller data: PostgreSQL **17.11**, `public.study_profiles` finns och innehåller **0 profiler**, `together_live.rooms` saknas, och både `pgcrypto` och `pg_cron` är redan aktiva. `extensions.digest(text,text)`, `extensions.gen_random_bytes(integer)` samt `auth.users.is_anonymous` finns. Detta var verifierat **före** Live-installationen. Test på två riktiga konton förblir en kvarstående funktionsgrind.

## 1. Verkligt användningsområde och beroenden

- Samma enhet: `/tillsammans/` fungerar lokalt utan konto och med Joker-gäster; detta är baslinje/rollback.
- Olika enheter, bara gemensam originaltext: `/tillsammans/?text=sv:buss:v1`; texten är publicerad och läsbar utan konto, men delade svar/poäng finns inte.
- Olika enheter, privat **live-rum**: `/tillsammans/live.html` använder *befintliga* personliga Study Cloud Auth-konton och skyddade `study_profiles`. Ingen ny identitetstyp, inga anonyma live-deltagare, ingen ny betalplan. Varje person måste kunna logga in på sin egen enhet; en lokal Joker-profil är aldrig ett autentiserat konto.

Funktionsomfattning: 1–10 autentiserade användare, en värd, tidsbegränsad inbjudan, 1–12 multiple-choice-frågor från befintlig matte-/språk-/studieteknikbank, svar dolda fram till gemensamt facit, serverberäknade poäng, återanslutning och uttrycklig stängning. Polling cirka 2,5 s medan rumsvyn visas; det är inte push-Realtime. Första versionen saknar efterhandsredigering av svar, godtycklig rumskick, muntlig analys och tillgänglighet på fysisk iPhone som ännu verifierad effekt.

## 2. Data, behörighet och hotmodell

| Objekt | Innehåll | Ägare/kontroll |
| --- | --- | --- |
| `together_live.rooms` | Värdens användar-ID, originalmaterialets ref, *hashad* 128-bitars inbjudan, frågedäck, fas och tidsfrist | Privat schema; endast kontrollerad server-RPC |
| `together_live.members` | Inloggat användar-ID och valt alias | Kan läsa endast när personen redan är deltagare via kontrollerad `state`-RPC |
| `together_live.answers` | Val per deltagare och runda | Ingen direkt databasåtkomst; visas i server-RPC endast efter reveal |
| `together_live.throttle` | Användar-ID, åtgärd, tidsfönster och försök | Privat schema; både felaktiga och godkända försök med rumskod räknas |
| `matteos.together.live.room.v1` | Endast senaste rummets ID och inloggat användar-ID, på personens enhet | Lokalt; byter inte konto/årskurs |
| Gäst- och skolnycklar | `matteos.guests.v1`, `matteos.v5`, `matteos.larande.v1` | Skilda flöden; **ingen** automatisk uppladdning till live-rum |

**Access control:** Varje RPC kontrollerar `auth.uid()` och befintlig `study_profiles`. Skapande och administration kräver värdens identitet. Läsning kräver faktisk medlemsrad, inte bara gissad UUID. Inbjudan krävs för att ansluta och fungerar bara innan värden startar; 10 medlemmar som högst. Anonyma användare har inget EXECUTE; dessutom nekas Supabase Auth-användare med `is_anonymous=true` även om deras JWT bär rollen `authenticated`. Direkta tabellgrant saknas och RLS är aktivt.

**Brute force:** 128-bitars slumpvärde, endast SHA-256-hash i databasen. Anslutningsförsök begränsas till 15/minut per autentiserad användare; *avslag ska konsumera kvot*. Skapande begränsas till 3/minut och maximalt 3 aktiva rum per användare. Detta eliminerar inte DoS eller ett komprometterat konto; ett storskaligt missbruk kräver Supabase- och edge-skydd på infrastrukturlagret.

**Rättvishet:** Servern bedömer alla svar och avslöjar inte `correct`, `why`, nuvarande rundas poäng eller en hash av det privata facit före `reveal`. Den som är värd kan som skapare redan se undervisningsmaterialet och kan manipulera innehåll **innan** det skickas till servern; resultatet är träning, inte provsäkerhet. En användare med full kontroll över sin egen klient kan inspektera sitt lokala gränssnitt. Ingen identitetsgaranti ges för alias.

**Retention:** Rumsåtkomst upphör logiskt efter 4 timmar. Värdens `leave` tar omedelbart bort rummet och dess beroenden via cascading delete. `together_live.prune_expired()` raderar fysiskt utgångna rum samt äldre försöksräknare. **Det kräver en verifierad produktionsscheduler**; utan cron kan utgångna rum finnas kvar i lagringen trots att klienterna nekas åtkomst. Ge inga löften om fysisk radering innan cron har verifierats i produktion.

## 3. Reproducerbar teknisk acceptans

GitHub Actions `.github/workflows/matte-qa.yml`: `unit-and-content`, `browser-mobile` (Chromium), `cross-engine` (WebKit/Firefox), `cup-backend`, `together-live-backend` (PostgreSQL 16 i throwaway-tjänst). Grön kontroll krävs **på exakt samma slut-SHA** som föreslås för merge.

`tests/together-live-backend.js` ska bland annat bevisa avvisad anon/direktläsning, två olika konton, felaktiga och sena koder, serverägarskap, dolda facit/svar/poäng/hash, idempotent inlämning, faslås, återanslutning via `state`, expiring access, cascade deletion, utförd TTL-purge, otillåtet purge-anrop och bestående rate limits på *misslyckad* kod.

`tests/together-live-e2e.js` med två emulerade mobiler använder **mockad transport**. Den testar webbflödet men verifierar inte en verklig Supabase-inloggning, internetlatens, fysisk Safari, push eller databas-RLS. RLS-fallet prövas separat på verklig throwaway-PostgreSQL.

Allt testmaterial är syntetiskt. Varken verkliga barnkonton, lösenord, skolframsteg eller familjeinformation ska användas i CI-loggar.

## 4. Produktionsinstallationen och kvarvarande aktiveringsgrindar

### Serverdrift — verifierade resultat 2026-11-15

- Installerad migration `matte_os_together_live_auth_only_v1`, GitHubfil `tillsammans/supabase/0001_together_live_secure.sql`. Direkt efter installerad migration: **4 privata Live-tabeller, 4/4 med RLS, 7 avsiktligt auth-behöriga RPC, 0 anon-EXECUTE, 0 direkta SELECT-grants för anon/authenticated**.
- Installerad migration `matte_os_together_live_hourly_expiry_v1`, GitHubfil `tillsammans/supabase/0002_together_live_hourly_expiry.sql`. Verifierad `cron.job`: `jobid=2`, `active=true`, `schedule='0 * * * *'`, `command='select together_live.prune_expired();'`.
- Verifierad manuell körning av `together_live.prune_expired()`: returnerade **0** (inga utgångna rum vid kontrollen). **Schemalagd cron-körning är ännu inte separat bevittnad** i `cron.job_run_details`.
- **0** skapade `study_profiles`, **0** Live-rum vid produktionskontroll. Ingen syntetisk testprofil skapades i produktionsauth. Befintliga `study_*` och `cup.*` lämnades oförändrade av migrationerna.
- Backendtest på throwaway PostgreSQL 16 godkänt inklusive anonym roll, auth-identitet, rate-limit, svarsläckage, replay, TTL och purge. Ett separat kodbaserat test betyder inte att produktionens faktiska inloggningar provats.

### Restgates innan full **live-användning**, inte blockerare för kontofritt läge

1. **Kontoskapande:** minst två individuella Study Cloud-konton ska senare skapas/kontrolleras med giltig SMTP/confirm email eller via Supabase Auth i användarens egen process. En lokal Joker-profil är inte ett konto.
2. **Verklig fullständig live-session:** värd + deltagare på två faktiska enheter, båda inloggade, korrekta/ogiltiga inbjudningar, dold rättning tills alla svarat, avbrott och återanslutning, session slut, relogin, rate limits och utomstående nekas. Ingen verklig elev-/familjedata i testloggar.
3. **Fysisk mobil/tillgänglighet:** Safari och installerad iPhone-PWA, Android, VoiceOver, dynamisk text, kontrast, touch, tangentbord, nätverksfel, bakgrundsflik, återkomst och offline→online. Syntetisk WebKit-emulering i CI är inte fysisk enhet.
4. **Schemalagd retention:** efter nästa cron-tillfälle kontrollera en lyckad post i `cron.job_run_details`, samt att det inte finns någon oväntad Realtime-publicering, inga nya åtkomstgrants och inga försök att läsa gäst-/skoldatalagring.
5. **Publicerad HTTPS:** efter merge verifiera `/matte-os/tillsammans/` och `/matte-os/tillsammans/live.html` direkt på GitHub Pages, inklusive mobilnavigering och att inloggning krävs för live. Kör säkerhetsadvisors och bedöm avsiktliga auth-RPC-varningar mot faktiska rollkontroller.
6. **Rollback:** vid incident stoppa live-UI och återkalla endast `public.together_live_*` EXECUTE. Ändra eller radera aldrig `study_*`, `cup.*`, Auth eller lokal skolprogress. Separat explicit godkännande krävs för eventuell destruktiv sanering av Live-schemat.

Källa för cron: [Supabase Cron](https://supabase.com/docs/guides/cron). Installationens utfall är verifierat genom Supabase-migration receipts och readback av metadata; full liveanvändning kvarstår tills separata riktiga konton finns.

## 5. Rollback, dataskydd och felsökning

- **Före merge:** lämna PR #36 som DRAFT eller stäng grenen. PR #35:s lokala gästläge är fristående och skoldatan på huvudgrenen påverkas inte.
- **Efter frontend-merge, före schema:** ta bort Live-länken eller revert PR #36. Låt `/tillsammans/` fortsätta fungera med lokala Jokrar och delade lästexter.
- **Efter schema:** sluta skapa nya rum, låt gamla rum löpa ut, kör verifierad purge vid rätt tid; överväg sedan att återkalla EXECUTE och ta bort dedikerade Live-objekt genom **separat godkänd** migration. Rör inte `study_*`, `cup.*`, Auth eller andra scheman. Säkerhetskopiera/utvärdera lagringsretention innan destruktiv sanering.
- **Dataåterställning:** export/import i lokalt Joker-läge är separat; varken Live eller rollback får återställa andras skolprogression.
- **Incidenter:** om fel person kan läsa svar eller om RLS-advisorn rapporterar exponering, stoppa Live-entrypoint och återkalla EXECUTE innan vidare funktionstest. Verifiera avslag som `anon`, ej medlem och borttagen medlem. Dokumentera evidens utan råa svar eller identifierbara uppgifter.

## 6. Publiceringsbeslut

**GO för publicering av statiskt gränssnitt och lokalt Tillsammans** när 5/5 CI är gröna och HTTPS-readback fungerar. **HOLD för påståendet 'Live fullt användbar/verifierad'** tills två riktiga konton, faktiska telefoner och schemalagd rensningslogg har testats. Ingen produktionsanvändare får bjudas in till en oprövad live-session.

**Beviskrav:** länka commit, CI-körning, enhetstest/OS-version, separat driftad staging-RLS-testlogg, cron-jobbstatus samt production deploy/readback. Ett planerat steg eller en grön mock är aldrig bevis för verklig drift.
