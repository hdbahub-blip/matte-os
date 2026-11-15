# Matte OS · Tillsammans Live v1 — säkerhets-, release- och rollbackprotokoll

**Status 2026-11-15:** DRAFT/STAGING; inte publicerad eller migrerad i produktion. Denna gren bygger på `feature/guest-together-v1-20261115`, som har ett separat lokalt pass-and-play. Produkt-/driftsmandat ska inte förväxlas med författad kod.

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

**Access control:** Varje RPC kontrollerar `auth.uid()` och befintlig `study_profiles`. Skapande och administration kräver värdens identitet. Läsning kräver faktisk medlemsrad, inte bara gissad UUID. Inbjudan krävs för att ansluta och fungerar bara innan värden startar; 10 medlemmar som högst. Anonyma användare har inget EXECUTE; direkta tabellgrant saknas och RLS är aktivt.

**Brute force:** 128-bitars slumpvärde, endast SHA-256-hash i databasen. Anslutningsförsök begränsas till 15/minut per autentiserad användare; *avslag ska konsumera kvot*. Skapande begränsas till 3/minut och maximalt 3 aktiva rum per användare. Detta eliminerar inte DoS eller ett komprometterat konto; ett storskaligt missbruk kräver Supabase- och edge-skydd på infrastrukturlagret.

**Rättvishet:** Servern bedömer alla svar och avslöjar inte `correct`, `why`, nuvarande rundas poäng eller en hash av det privata facit före `reveal`. Den som är värd kan som skapare redan se undervisningsmaterialet och kan manipulera innehåll **innan** det skickas till servern; resultatet är träning, inte provsäkerhet. En användare med full kontroll över sin egen klient kan inspektera sitt lokala gränssnitt. Ingen identitetsgaranti ges för alias.

**Retention:** Rumsåtkomst upphör logiskt efter 4 timmar. Värdens `leave` tar omedelbart bort rummet och dess beroenden via cascading delete. `together_live.prune_expired()` raderar fysiskt utgångna rum samt äldre försöksräknare. **Det kräver en verifierad produktionsscheduler**; utan cron kan utgångna rum finnas kvar i lagringen trots att klienterna nekas åtkomst. Ge inga löften om fysisk radering innan cron har verifierats i produktion.

## 3. Reproducerbar teknisk acceptans

GitHub Actions `.github/workflows/matte-qa.yml`: `unit-and-content`, `browser-mobile` (Chromium), `cross-engine` (WebKit/Firefox), `cup-backend`, `together-live-backend` (PostgreSQL 16 i throwaway-tjänst). Grön kontroll krävs **på exakt samma slut-SHA** som föreslås för merge.

`tests/together-live-backend.js` ska bland annat bevisa avvisad anon/direktläsning, två olika konton, felaktiga och sena koder, serverägarskap, dolda facit/svar/poäng/hash, idempotent inlämning, faslås, återanslutning via `state`, expiring access, cascade deletion, utförd TTL-purge, otillåtet purge-anrop och bestående rate limits på *misslyckad* kod.

`tests/together-live-e2e.js` med två emulerade mobiler använder **mockad transport**. Den testar webbflödet men verifierar inte en verklig Supabase-inloggning, internetlatens, fysisk Safari, push eller databas-RLS. RLS-fallet prövas separat på verklig throwaway-PostgreSQL.

Allt testmaterial är syntetiskt. Varken verkliga barnkonton, lösenord, skolframsteg eller familjeinformation ska användas i CI-loggar.

## 4. Obligatoriska grindar före publicering

1. **Schema och säkerhet:** granska exakt SQL-diff, alla SECURITY DEFINER-funktioner, effektiva GRANT/RLS och exponering från REST, RPC samt Postgres Changes; inget privat Live-objekt i Realtime-publication. Ingen användning av elevbackuper eller `study_session_answers`.
2. **Konto och samtycke:** verifiera minst två separata autentiserade testkonton på befintlig Study Cloud i det dedikerade Matte OS-projektet. Minderårigas konton kräver ansvarig vuxens bedömning och lämpligt samtycke. SMTP och Auth-flöde måste fungera eller konton vara behörigt skapade i Supabase dashboard.
3. **Retention:** installera/aktivera Supabase Cron (`pg_cron`) om det inte redan finns, skapa ett unikt jobb för `select together_live.prune_expired();` varje timme; kontrollera `cron.job` och lyckade poster i `cron.job_run_details`. Kontrollera att annat projekts cron-jobb lämnas intakta.
4. **Nätverks- och misbrukstest:** två till tio faktiska enheter, in-/utloggning, två olika konton, giltig/felaktig/utgången/återanvänd kod, frånkoppling/återanslutning, långsam anslutning, dubbla tryck, stängt rum och sign-out under session; verifiera att utomstående alltid nekas och att privata facit inte läcker via trafik/API.
5. **Verklig iPhone/PWA:** fysisk Safari och installerad Home Screen-app vid 320–430 px, tangentbord, VoiceOver, dynamisk text, storlek på tryckytor, färgkontrast, ljust/mörkt, strömsparläge och offline→online. Kontrollera att separat installerad PWA kan ha **annan localStorage** än Safari.
6. **Ändringskontroll:** ta säkerhetskopia av befintliga lokala skolresultat på berörda enheter, mät regressionsstatus, inhämta publiceringsgodkännande för databasmigration och merge, och verifiera den publicerade `/matte-os/tillsammans/` och `/live.html` på HTTPS efter deploy.

[FA] SQL och klienten är skrivna mot den befintliga Study Cloud-authmodellen och förutsätter att projektet har `pgcrypto` i `extensions`. Verifieringstest: introspektera målprojektets schema och rollprivilegier, migrera först i engångs-/stagingmiljö med anonym och autentiserad roll och testa två riktiga konton innan produktion.

### Databasinstallationsförslag (**ej genomfört**)

1. Verifiera projekt-ID och backup. Kontrollera projektspecifik Postgres-version, `extensions.pgcrypto`, `auth.uid`, `public.study_profiles`, auth- och RLS-policyer.
2. Kör `tillsammans/supabase/0001_together_live_secure.sql` i separat stagingmiljö. För ett produktionsbeslut: gör en granskad versionsmigrering enligt målprojektets migrationspolicy, aldrig ett improviserat manuellt SQL-klipp utan audit.
3. Aktivera Supabase Cron enligt aktuell dokumentation och skapa unikt TTL-jobb. Exempel efter särskild behörighetskontroll (***kör inte automatiskt***):
   ```sql
   select cron.schedule(
     'matte-os-together-live-expiry-v1',
     '0 * * * *',
     $$ select together_live.prune_expired(); $$
   );
   ```
4. Kör server-RLS/advisors, separat konto- och rums-QA, publicera endast efter godkännande. Exponera aldrig service_role eller `study_profiles` i offentliga alias-listor.

Källa för cron-beteende: [Supabase Cron](https://supabase.com/docs/guides/cron), [Install](https://supabase.com/docs/guides/cron/install). Specifik produktionskonfiguration har **inte** lästs/ändrats i detta arbete.

## 5. Rollback, dataskydd och felsökning

- **Före merge:** lämna PR #36 som DRAFT eller stäng grenen. PR #35:s lokala gästläge är fristående och skoldatan på huvudgrenen påverkas inte.
- **Efter frontend-merge, före schema:** ta bort Live-länken eller revert PR #36. Låt `/tillsammans/` fortsätta fungera med lokala Jokrar och delade lästexter.
- **Efter schema:** sluta skapa nya rum, låt gamla rum löpa ut, kör verifierad purge vid rätt tid; överväg sedan att återkalla EXECUTE och ta bort dedikerade Live-objekt genom **separat godkänd** migration. Rör inte `study_*`, `cup.*`, Auth eller andra scheman. Säkerhetskopiera/utvärdera lagringsretention innan destruktiv sanering.
- **Dataåterställning:** export/import i lokalt Joker-läge är separat; varken Live eller rollback får återställa andras skolprogression.
- **Incidenter:** om fel person kan läsa svar eller om RLS-advisorn rapporterar exponering, stoppa Live-entrypoint och återkalla EXECUTE innan vidare funktionstest. Verifiera avslag som `anon`, ej medlem och borttagen medlem. Dokumentera evidens utan råa svar eller identifierbara uppgifter.

## 6. Publiceringsbeslut

**GO** endast om slut-SHA är grön, databasmigrering/RLS/TTL är säkerhetsgodkända och två separata verkliga telefoner har klarat användnings- och integritetskontrollen. **HOLD** om något av detta saknas. Den lokala delen i PR #35 kan bedömas separat; den ska inte blockeras av Live-komplexitet.

**Beviskrav:** länka commit, CI-körning, enhetstest/OS-version, separat driftad staging-RLS-testlogg, cron-jobbstatus samt production deploy/readback. Ett planerat steg eller en grön mock är aldrig bevis för verklig drift.
