# Matte OS 5.5.1 – UX-implementering och releasegrind

**Baserad på:** 2026-10-30 ChatGPT + Claude oberoende auditer, därefter konsoliderad dubbel-audit. **Grund:** 5.5.0 `7f87feeac11fc4800b05cbee0cfded415b1052ff`. **Ändringar endast i draft-PR #11** mot nya kontot `hdbahub-blip/matte-os`.

## Syfte
Elevernas dokumenterade feedback: matematik var ibland för abstrakt och överstimulerande; fler klick och osäker navigation gjorde inlärningen svårare. Åtgärden ska ge: *ett ämne → konkret förklaring → tre synliga steg → svar → prova själv*, och låta en värd starta Cup på egna mobiler utan teknisk förkunskap.

## Implementationsmatris (spårbarhet)

| Audit-ID | Ändring | Verifiering / risk |
|---|---|---|
| C01 | Onboarding/Inställningar särskiljer lokala matteframsteg från tillfälliga Cup-data (smeknamn, session och poäng). Kommentar i engine korrigerad. | Nya browser-assertions och kodgranskning; inga nya datainsamlingar. |
| C02 | Åk 9:s restprov tar inte längre över den första hemrekommendationen. Restprov finns kvar som valfri undersida med synliga ämnen och frivilligt datum. | Mobil-E2E för båda årskurserna; bekräfta att restprovsvägen fortfarande är åtkomlig. |
| C03,C07 | Hem visar tre begripliga vägar: Förstå, Öva multiplikation, Spela tillsammans. Träna har en sammanhållen multiplikationsingång; affisch valfri. | Direkt Cup från Hem på ett klick, från Träna på ett klick, ingen ny global flik. |
| C04,C05 | Samma stegnamn. Första lektionssidan visar tre steg och svar; går direkt till guidad övning. Svårare exempel är valfritt på separat gren av samma lektion. | 63 befintliga introdata används oförändrat, nya/uppdaterade browser-tester. |
| C06 | Formellista börjar med sök och begripliga förklaringar; affisch flyttad till sekundärt val. Teknisk formel göms i modal, sökträffar och slutkort. | Kodgranskning plus barnvy: ingen obligatoriskt exponerad formel. |
| C08 | Lektions-/träningsutgång returnerar till sammanhanget (kapitel/hem/träna) med säker standard. | Navigationsrundor i browser. |
| C09,C10 | Minst 44px minsta knapphöjd på huvudsakliga små knappar, fokus på huvudrubrik efter navigation och återställd fokus efter dialog. | Desktop+mobil och tangentbordsgranskning; fysisk VoiceOver återstår. |
| C12 | Restprovsspråk förenklat och obekräftat provdatum kan fyllas i frivilligt. | Kontroll av text och originalrestprov. |
| U01,U02 | Cup har direkt "Skapa spel och visa koden"; avancerade tabell- och tidsval fällbara, förvalt 30s (lugnare takt). QR och kopiera inbjudningslänk prioriteras. | Cup E2E öppnar avancerat val innan testets 15s-kval. Verklig test med tio mobiler separat. |
| U03 | Kort första ledtråd beroende på matematiskt område, inte generisk fråga eller facit. | Manuella exempel område för område; äldre facit och svarskontroll orörda. |
| U04 | Tabellarenan erbjuder opt-in automatisk fortsättning 1,8 s efter **rätt** svar. Efter fel svar står rättningen kvar tills eleven trycker Nästa. Vid reduced-motion visas inget val (manuell nästa-knapp). | `calm-ux-e2e`: rätt svar går vidare, fel svar stannar, reduced-motion döljer valet. Skärmläsare återstår. |
| C15 | Versionsmarkörer synkade till 5.5.1 och README uppdaterad till ny GitHub-adress. | PWA/offline/test-QA. |

## Bevarade kontrakt
- Inga ändringar i `js/content8.js`, `js/content9.js`, `js/math.js`, `js/engine.js` lärmotorsfunktioner (endast kommentar), `prov/` bedömning eller `affischer/` matematik.
- Inga nya Supabase-migrationer eller ändringar av `cup/supabase/*`, RPC, sessionstokens, rumspoäng eller gallring.
- Samma `matteos.v5`, `matte-prov-v1`, `matteos.cup.v1` localStorage-nycklar och befintlig export/import.

## Automatiska kvalitetsgrindar
1. Node syntax och 63/63-papper-och-penna-förklaringars strukturella täckning.
2. 9 410+ tidigare matematik-/innehållskontroller, figur, tabell, prov/regression och poster/offline.
3. Playwright: iPhone SE, iPhone 13, desktop, åk 8 och åk 9, orientering, 3 synliga förklaringssteg och svar på första skärmen, valfri formel, Cup-snabbstart.
4. Cup: 10 spelare + värd i lokala isolerade Postgres-/webbläsartester. Ingen ny Supabase-privilegiering.

## Återstående acceptans
- [ ] Full GitHub CI på senaste PR-head (run-länkar ska läggas till i PR när grönt)
- [ ] Fysisk iPhone/Safari, Android/Chrome och tangentbords-/skärmläsartest
- [ ] Eleverna kan med egna ord förklara area som 4×3 rutor = 12 cm², och 10² vs (0,1)² utan att memorera en regel
- [ ] En fysisk värd + tio deltagare kan genomföra hela Cup, inklusive tillfälligt nätbortfall
- [ ] Även efter omstart finns lokala elevdata och proven kvar

**Risk:** UX-ändring kan påverka navigation under ett pågående övningspass eller formelförklaring. Publicera inte förrän alla automatiska tester är gröna; efter publicering krävs ett avgränsat elevtest. **Rollback:** revert PR #11; bevara `matteos.v5` och Cup-databasen. Ingen databasrollback behövs för denna ändring.

**Ställningstagande:** Granskbar draft-PR, ej full elevacceptans och ej automatisk publicering.