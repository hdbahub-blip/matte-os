# Matte OS Cup – oberoende audit och byggrapport (2026-10-30)

Bas: main `d109962` (Matte OS 5.4.8). Gren: `feature/matte-os-cup-20261030` → Matte OS **5.5.0**.
Status-etiketter: **VERIFIERAT** = körd test med utdata nedan · **BEGRÄNSAT** = skrivet/delvis testat · **ÖPPET** = inte gjort.

## 1. Metod
Jag klonade repot, läste källfilerna (inte bara README), körde alla befintliga tester som baseline (alla gröna före ändring) och provade matematik-/indatakantfall direkt mot `js/math.js`. Auditen av spelfunktionen gjordes mot den nya koden med riktig Postgres 16 (inte mock).

## 2. Fynd P0–P3

| # | Nivå | Fil / funktion | Fynd | Evidens | Status |
|---|---|---|---|---|---|
| 1 | **P0** | (saknades) | Ingen synkron flerspelarfunktion och ingen backend: Tabellarenans duell är en enhet, utan rum/ranking/utslag. | `js/tabell-arena.js` `beginDuel/judge` är lokala. | **Åtgärdat** – se §3 |
| 2 | **P0** | Drift | Inget dedikerat Supabase-projekt finns; de två aktiva projekten (glow-grow, apex-life-ops) fyller redan gratisnivåns 2 aktiva projekt och rymmer annan data (specen förbjuder återanvändning). | `list_projects`: 5 projekt, 2 ACTIVE_HEALTHY, 3 INACTIVE | **ÖPPET – kräver ditt godkännande** (se §7) |
| 3 | P1 | `js/app.js` `pickprofile` | Ny enhet som öppnar en delad länk (`#/cup/join/KOD`) tappade länken när årskursen valdes (skickades till `#/`). Gäster hade aldrig kunnat gå med via QR. | Playwright: efter klick på årskurs blev hash `#/`. | **Åtgärdat + testat** (E2E: kod förifylld från länk, 10/10) |
| 4 | P1 | `js/app.js` SW-uppdatering | `controllerchange` laddade om sidan mitt i spel; nu skyddas `#/cup`. | Kod + regex-test. | Åtgärdat, ej separat testat med verklig SW-uppdatering (**BEGRÄNSAT**) |
| 5 | P2 | `index.html` | Ingen Content-Security-Policy. Smeknamn escapas överallt i Cup-UI och valideras i servern, men CSP vore djupförsvar. Inte infört: ett fel CSP kan bryta offlineappen. | grep `Content-Security` → inga träffar. | ÖPPET (rekommendation) |
| 6 | P2 | `js/app.js` | `window.__MO_UI`/`__MO_NOW` testkrokar finns i produktion. Ofarligt (lokal data), men onödig yta. | grep. | ÖPPET |
| 7 | P2 | `.github/workflows/matte-qa.yml` | CI körde bara listade grenar/PR och hade inga tester för spel. | Fil. | **Åtgärdat**: nytt jobb `cup-backend` (Postgres-service, 10-spelartest, säkerhet, E2E) – **ej körd på GitHub än** (kräver att PR öppnas) |
| 8 | P3 | `tabell/` | Gammal parallell Tabellarena (v1.0.2, core 5.2.1) ligger kvar. Aktiv väg är `#/tabell`. Orörd (SW hoppar över den). | `tabell/sw.js`. | Lämnad medvetet |
| 9 | P3 | Versionstester | Fyra regressionstester hårdkodar versionssträngen 5.4.8. | grep. | Uppdaterade till 5.5.0 (avsiktlig, samordnad bump) |

**Matematik/indata (VERIFIERAT):** `M.check` med 21 hårda indata (tom, `5,5,5`, `--5`, `5/0`, `Infinity`, `1e999`, 5000 siffror, 3000 parenteser, 100 000 tecken) kastar inget fel och är snabbt (<200 ms). Andragradens två rötter: `5` ensamt avvisas med förklaring, `5 och -5` och `x=5 eller x=-5` godkänns. `10²` ≠ `0,01` (avvisas), `0,01` godkänns som 0,01. Befintliga sviter: `qa.js` (alla kontroller), `figure-consistency` 603/603, `tabell-integration` 52/52, `book-first-regression`, `posters-content`, `paper-lessons` 441 kontroller – gröna före och efter (se §6).
**Ej granskat på djupet:** pedagogiken i de 63 lektionerna (jag har inte läst om dem; auditen här är kod/test, inte ny läraranalys), skärmläsare, riktig iOS Safari/Android Chrome.

## 3. Vad som byggdes (på branchen)
- `cup/supabase/0001_matte_os_cup.sql` – hela spelmotorn i Postgres: rum, spelare, rundor, frågor, svar; RPC `cup_create/join/ready/leave/kick/cancel/start/end_round/answer/state/next`. Inga tabeller exponeras (schema `cup`, RLS på, inga grants till anon); alla RPC är `SECURITY DEFINER` med tomt `search_path`.
- `js/cup-api.js`, `js/cup.js`, `css/cup.css`, `js/qr.js`, `js/cup-config.js` – klient, Shadow DOM-UI (samma färgteman: Åk 9 burgundy, Åk 8 marinblå), egen QR-generator (avkodad med jsQR), studieläge, lobby, värd/spelare, kval/utslag/semi/final/prispall.
- Integration: knapp "Matte OS Cup" i Tabellarenan, route `#/cup`, offline-precache av Cup-filerna. Lokal data i `matteos.cup.v1`; `matteos.v5` rörs inte (testat).
- `cup/dev/rest-shim.js` – testverktyg som efterliknar PostgREST (`/rest/v1/rpc/*`) mot lokal Postgres. Används **inte** i produktion.

## 4. Spelregler (som koden gör)
- **Kval:** alla spelare, samma N frågor (10/15/20) i samma ordning, eget tempo, rundtid N×(15/20/30 s)+5 s. 1 poäng per rätt, 0 per fel. Resultat syns först när rundan är slut. Rundan stängs när alla svarat eller tiden gått ut (eller värd avslutar).
- **Gräns vid plats 4:** om ett lika-poäng-block korsar gränsen spelas en **utslagsrunda** (3 frågor, bara de oavgjorda) tills gränsen är ren. Efter 5 utslagsrundor utan skillnad avgörs det på anslutningsordning och UI:t säger det öppet. Ingen svarstid används (latensrättvisa).
- **Semifinal:** 1 mot 4 och 2 mot 3 samtidigt, 5 frågor; lika → utslagsrunda (3 frågor).
- **Final:** bäst av tre spel à 5 frågor; lika i ett spel → utslagsrunda. Vinnare = först till två.
- **Prispall:** 1:a, 2:a och **delad 3:e** (de två semifinalförlorarna). Bronsmatch är **inte** byggd.
- Färre än 4 spelare: de två bästa går direkt till final. Max 24 spelare per rum.
- **Ej byggt (P1/P2):** lag 5 mot 5, snabbmatch alla-mot-alla, revansch för utslagna, "största förbättring", temarundor utöver tabellval, medaljer, PDF/bild av resultat, större text/längre tid som egen inställning (tiden per fråga kan väljas 15/20/30 s).

## 5. Arkitektur, hotmodell, behörighet
Klient (GitHub Pages, statisk) → Supabase REST `rpc/cup_*` (publik anon/publishable-nyckel) → SECURITY DEFINER-funktioner. Ingen Realtime, ingen Auth: klienten pollar `cup_state` varje sekund (10–24 spelare ≈ 10–24 anrop/s per rum). Skäl: enklare, inga kanalbehörigheter att fel­konfigurera, fungerar likadant i test. **Kostnads-/kvotrisk (obekräftad [FA]):** 1 anrop/s/spelare under ett spel på ~15 min ≈ 1 000 anrop per spelare, alltså ca 10–25 tusen anrop per spel – långt under vad gratisnivån brukar tillåta, men verifiera aktuella gränser i ditt Supabase-konto före skarpt bruk.
Behörighet: värd = `host_secret` (slumpad, lagras hashad). Spelare = `player_id` + egen hemlighet (hashad). Rumskod räcker bara för att *gå med* (lobby, innan start); allt annat kräver hemlighet. Facit lämnar aldrig servern före eget svar; hela facit finns i egen genomgång först när rundan är klar.
Hot som provats (se §6): direkt tabellåtkomst, falska poäng, byte av spelar-ID, korsrum, värd-kommandon som spelare, SQL-injektion, XSS-/kontrolltecken i smeknamn, replay/dubbelsvar, svar före start/efter slut, hoppa över fråga, utkickad spelare, rumsfull, otillräckligt antal.
**Kvarstående risk:** (a) den som gissar/ser en rumskod kan gå med i lobbyn – värden kan ta bort spelare och starten låser rummet; (b) polling utan rate limit på `cup_state`/`cup_answer` (gäller Supabase:s projektgränser; ingen egen throttling) – en illasinnad skulle kunna förbruka kvoten; (c) `Date`-baserad rättvisa: klientklockor används inte, men nätfördröjning slår mot rundtidens slut.

## 6. Testbevis (alla körda lokalt 2026-10-30)
| Svit | Resultat |
|---|---|
| `tests/cup-backend.js` (riktig Postgres 16, 10 spelare + värd, 2 utslagsrundor i kval, semitie, final 3 spel) | **51 PASS, 0 FAIL** |
| `tests/cup-security.js` | **59 PASS, 0 FAIL** (inkl. alla 100 multiplikationsfakta, facit = a·b, 30 unika blandade frågor) |
| `tests/cup-qr.js` (jsQR avkodar egen QR) | **7 PASS** |
| `tests/cup-e2e.js` (1 värd + 10 spelare i 11 Chromium-contexts: iPhone SE ×4, iPhone 13 ×3, Pixel 5 ×3; omladdning i lobby, nätbortfall med banner, hela turneringen till prispall) | **60 PASS, 0 FAIL**, 104 s, 0 JS-fel |
| Befintliga sviter | se regressionsloggen i PR-beskrivningen |
**Begränsning:** allt ovan är emulerade webbläsare på en dator mot **lokal Postgres**, inte fysiska telefoner och inte Supabase. Gratisnivåns Realtime/gränser och latens över internet är **inte** testade.

## 7. Blockerare och hur den löses
Ett Supabase-projekt med Cup-schemat måste finnas. Jag skapade inget (nytt projekt kan påverka fakturering/kvot och kräver ditt godkännande; befintliga projekt rördes inte). Steg: se `docs/MATTE_OS_CUP.md` §Aktivera.

## 8. Rollback
Main är orörd. Ta bort/avstå PR:en. Efter aktivering: sätt `url` tom i `js/cup-config.js` → Cup-knapparna stängs av, resten av appen oförändrad. Databas: `drop schema cup cascade; drop function public.cup_*;`.
