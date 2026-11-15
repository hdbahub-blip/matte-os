# Matte OS — fullständig flödes- och friktionsrevision
**Version:** 2026-11-15 · UX RELEASE CANDIDATE · PR #39  
**Källor:** repository \`hdbahub-blip/matte-os\`, \`js/app.js\`, \`js/profile-chooser.js\`, \`tillsammans/{app,model,live-ui}.js\`, \`lara/app.js\`, \`js/cup.js\`, \`js/tabell-arena.js\`, \`studera/app.js\`, \`study/setup.js\`, \`foralder/app.js\`, \`prov/js/app.js\`, \`sw.js\`, \`lara/sw.js\` och CI:s syntetiska regressionstester.  
**Verifieringsnivå:** Kodinspektion + körbara syntetiska browser-/SQL-regressioner. Inte verkliga användarförsök eller fysisk iPhone.

## 1. Kärnfynd och beslut

Grundproblemet var inte brist på funktioner, utan **för många konkurrerande vägar till samma intention**. Den publika startsidan exponerade rekommendationer, fem ämneskort, två olika samarbetssnabbval, provplanering och flera andra moduler. Separata applikationsdelar använde namn som "Gäster & Tillsammans", "Träna tillsammans", "Studera tillsammans", "Spela tillsammans" och "Live", trots skilda konto-, synk- och sekretessvillkor.

**Beslut:** Två huvudvägar, "Kör själv" och "Kör tillsammans". Valfritt ämnesval och avancerade lägen får egna tydligt märkta öppningar. Kontokrävande studiepass skiljs från konto-fria alternativ. Behåll alla tidigare avancerade moduler och befintlig elevprogression, men undvik att kräva att användaren först förstår produktarkitekturen.

## 2. Flödesinventering: hela sidans funktionella områden

| Område | Observerad UX-risk före | Åtgärd eller avgränsning |
|---|---|---|
| Start och navigation | Flera jämbördiga knappar och parallella samarbetsvägar | Två primärval med kort beskrivning, direkta ämneslänkar, resten under en valfri översikt |
| Profilval | Root hade redan kortgrid; Lärande hade en separat lång dropdown | Lärande visar årskurser, dynamiska Jokrar och föräldraöversikt i samma tvåspaltiga visuella språk |
| Solo matematik | Rekommenderad träning bland andra alternativ | "Kör själv" startar direkt fem rekommenderade frågor |
| Solo språk/studieteknik | Ämnen blandas med två konkurrerande Tillsammans-kort | Bevara tre en-klicksämnen; bara en tydlig primär Tillsammans-ingång |
| Solo Joker | Behövde sätta upp ett gruppass för en enda person och bekräfta "min tur" | "Jag kör själv" startar lokal femfrågesession direkt; även nästa fråga hoppar över turöverlämning |
| Grupp, samma telefon | Deltagare, ämne, material, val, start fördelade över mycket innehåll | En kort förvalsskärm för deltagare+ämne, sammanfattat antal, fem frågor, material under frivillig "Byt..." |
| Återkommande grupp | Återval av samma deltagare och material | Senast valda lokala deltagar-ID:n, ämne och källref sparas i separat lokal preferensnyckel |
| Flerspelare Cup | "1 Studera / 2 Skapa / 3 Gå med" antydde att studier måste göras först; avancerade val öppna | Direkt "Skapa spel" eller "Gå med"; "Öva tabeller" frivilligt; snabbmatch förvald, avancerat stängt |
| Cup poäng/timer | Komplex tävlingslogik, säkerhetsgränser, tidtagning | Oförändrad backend och matchlogik; endast inträdet förenklat |
| Privat Tillsammans Live | Onlineauth och privata svar | Bevarad authgrind, säkerhetsmodell, server- och frontendlogik, ingen kontogenerering |
| Mentor/elev \`studera/\` | Om konton saknas möter användaren en blockerande inloggningssida | Tydligt "kräver konto" och direkt väg tillbaka till kontofritt samarbete |
| Tabellarenan | Självtest, valda tabeller, duell, teman | Oförändrad motor; nås via "Välj annat" eller träningsnavet |
| Prov och restprov | Många detaljer för datum, moment och bedömning | Oförändrat; förblir nåbart via Träna och den frivilliga översikten |
| Språkverkstad, ordlek, minnesknep | Ämnesdjup och specialfunktioner | Ingen onödig ombyggnad av innehåll, provlogik eller progression |
| Min översikt | Separat skyddad PIN- och read-only-vy | Oförändrade data- och behörighetsgränser; ingår i samlat profilval |
| Konto/synk | Skilda villkor för Study Cloud och gäster | Inte ett förstaval; ligger i profilhantering respektive tydligt märkta konto-vägar |
| Backup/import/reset | Destruktiv risk vid återställning | Befintliga explicit bekräftade åtgärder kvar; inga nya genvägar till reset |
| Offline/PWA | Risk för blandade cacheversioner efter UI-ändring | Versionsbump, förladdning av nya UI-filer och test av root- och Lärande-cachen |
| Visuellt system | Olika namn och dekorationssymboler | Gemensam tvåspaltig grundprincip, tydliga penn-/grupp-/anslutningsikoner, kontrasterande grade-/gästpaletter, reduced-motion-stöd |

## 3. Primära uppgifter efter ändringen

**Själv, årskurs:** Välj Åk 8/9 en gång → "Kör själv" → första matematikfrågan. Vid ett redan valt elevkonto krävs ett tryck från startsidan. Fortsättningsknappar inne i övningarna följer befintlig didaktik.

**Tillsammans, samma mobil:** "Kör tillsammans" → en skärm med föreslagna spelare och ämne → "Starta 5 frågor". Varje person får privat turövergång, svarar och bekräftar; facit visas först när alla har svarat. Standardvalen kan ändras utan separata onboarding-/inställningsskärmar.

**Själv, Joker:** Välj Joker i profilrutnätet → "Jag kör själv" → första frågan utan onödig turbekräftelse. Gästen behåller egna lokala framsteg och stil, separata från \`matteos.v5\`.

**Cup, olika mobiler:** Öppna Cup → "Skapa spel" eller "Gå med". Värden får snabbmatch som förslag, och kan direkt skapa en kod utan att öppna avancerade kontroller. Vill man ändra turnering, tabeller eller tid finns dessa kvar under rätt valt läge.

**Lärande:** Välj Svenska, Engelska eller Studieteknik på ämneskort. Behöver ni öva tillsammans finns en prioriterad väg till lokalt Tillsammans, medan ordduell och muntligt samarbete ligger under extraval.

**Kontobaserade pass:** Live/mentorpass är tydligt utmärkta som kontokrävande; inga konton behövs eller skapas för de vanliga lokala lägena.

## 4. Data och tillitsgränser

- Befintlig matematikprogression: \`matteos.v5\` — **får inte ersättas, tömmas eller importeras** av gäst- och gruppflöden.
- Befintlig Lärande-progress: \`matteos.larande.v1\` — oberoende från gruppresultat.
- Gästprofiler och gäststatistik: \`matteos.guests.v1\` — eget ID och säkerhetskopia.
- Grupppass: \`matteos.together.session.v1\` — lokal pågående session, separerad från skolpoäng.
- Nya UI-preferenser: \`matteos.together.flow.v1\` — endast senaste ämne, materialreferens och valda deltagar-ID:n. Inga råa svar, kontouppgifter eller profiler.
- Studera/Live/Cup: separata server-/auth-flöden, befintlig RLS och säkerhets- och rate-limit-kontrakt kvarstår.
- Eftersom Cup och Live kräver nät eller konton i vissa lägen får de aldrig presenteras som ett alltid-offline-alternativ.

## 5. Riskanalys och avvägningar

**Risk A — avancerade funktioner blir svårare att hitta:** De flyttas under en tydlig sammanfattning "Välj annat ämne eller aktivitet" och behåller sina adresser. Test krävs för att alla gamla länkar finns kvar och blir klickbara efter att sammanfattningen öppnats.

**Risk B — spelare får se varandras facit:** Gruppens överlämningsgrind och visning först efter allas svar ligger kvar; endast SOLO-grinden tas bort. Testar både solo och flerperson.

**Risk C — fel person får skolprogression:** Endast \`grade8\`/ \`grade9\` får vara aktiv skolprofil. Joker väljs med separat gäst-ID. Kontrollera sentinel i båda matematikprofilerna och språkprofilen efter grupp-/solo-körning.

**Risk D — offline-versioner blandas:** Explicit query-version på root, Lärande, Tillsammans, Cup och service worker. Kontrollera \`addAll\` mot faktiska lokala resurser och gammal→ny uppgradering.

**Risk E — användare råkar ersätta pågående session:** Befintlig bekräftelsedialog vid ny session finns kvar. Pausat grupppass får återupptas efter omladdning; engångslaunchparametern konsumeras.

**Risk F — färg och animation hindrar läsbarhet:** Färg används för igenkänning, men lägesnamn och knapptexter bär betydelsen. Fokusmarkering, 44px+ tryckytor, mörkt läge och \`prefers-reduced-motion\` måste testas.

## 6. Test- och releasegrindar

Automatiska, syntetiska kontroller: \`tests/one-tap-journeys-e2e.js\` för båda browsermotorerna, befintliga tester för matematik, Lärande, ordlek, språk, profiler, återkomst, prov, tabeller, Cup med lokal PostgreSQL, Cup-integritet, privat Live-RLS och migrations-/uppgraderingsregressioner. Alla fem CI-jobb **måste** vara gröna på slutlig PR-SHA före merge. Pages-deploy **måste** visa samma commit som \`main\`.

[FA] Faktiskt lägre mental belastning och färre fel hos elever är en **hypotes**, inte bevisad av koden. Falsifiering: två representativa användare på verkliga mobiler utför utan instruktion (a) solo från hem, (b) grupp med två personer, (c) återkomst efter avbrott, (d) Cup via spelkod och (e) hitta föräldraöversikt. Mät steg, feltryck, tid, frågor om var man är och tydlighetsbetyg. Förväntat: uppgifterna ska gå att slutföra utan hjälp; annars revidera CTA-/informationstäthet.

### Rollback
Revertera endast PR #39:s releasecommit och följ Pages-deploykvittot. Behåll elev-/gästlagringsnycklar och alla Supabase-scheman orörda. Valfri UI-preferens \`matteos.together.flow.v1\` kan ignoreras av äldre klienter; den behövs inte för att starta en gruppsession med gammal kod.

### Slutkontrakt
**VERIFIERAT:** efter avslutad CI ska kört test, exakt SHA, jobstatus och Pages-deploy anges här, inte antas.

**UTTRYCKLIGEN BEGRÄNSAT:** ingen fysisk iPhone/Safari, ingen autentiserad tvåtelefonssession, ingen barn-/familjeintervju, ingen empiriskt verifierad UX-effekt. Kontoarbetet är fortfarande uppskjutet enligt Owner-instruktion.
