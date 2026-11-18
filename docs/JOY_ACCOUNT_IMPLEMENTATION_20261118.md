# Matte OS · Joy + kontosäkerhet: releasekandidat 2026-11-18
Status: kod på testgren; produktionsdatabasens self-enrollment-spärr införd med verifierad readback. HOLD för produktionsmerge tills CI och slutliga regressionsgrindar är gröna.
Källrepo: hdbahub-blip/matte-os
Gren: audit/joy-safety-unified-20261118
Bas: FULLSPEC-revision 2026-11-18 och verifierad befintlig matematik-/språkkod.

## Mål och avgränsning
Inloggad elev ska aldrig kunna växla skolidentitet genom en lokal profilväljare. Årskurs är innehållsnivå, inte personkonto. Elev ska känna att ett litet försök är tillräckligt för att komma igång, och kunna studera utan prestationsskam. Jokrar är gäster, inte elevkonton. Mentor är befintlig behörighetsroll, inte en ny produktdimension.

## Faktiskt ändrat i testgrenen
- Ägarbunden lokal arbetsyta för Study Cloud, uppdelad per användar-ID; omärkta gamla resultat karantänsätts utan automatiskt antagande om ägare.
- Automatisk uppladdning av gamla lokala data vid första inloggningen borttagen. Utkö mot moln kräver rätt konto och arbetsyta.
- Utloggning säkerhetskopierar kontots lokala kö och rensar dess globala arbetsyta.
- Grundprofilväljaren och Lärandes motsvarighet visar elevens verifierade årskurs när hon är inloggad; elevens navigering visar Mitt konto.
- Skapande av elev/mentorroller från elevens webbläsare blockerat; administrativ tilldelning ska ske via säkert serverförfarande.
- Databasmigration `matte_study_roles_admin_only_20261118` är applicerad i anslutet Supabase-projekt. Ny SQL-readback visar `authenticated INSERT=false`, 0 INSERT-policy, oförändrat 3 profiler/2 länkar/8 snapshots och kvarstående privilegierad adminväg. Koden under `study/supabase/0004_admin_owned_roles.sql` är motsvarande återuppbyggnadsunderlag.
- Mentor-/föräldraöversikt spärras visuellt för inloggad elev, medan Supabase RLS fortsatt är servergränsen.
- Ny gemensam CSS med blått/indigo, lila/berry, mint och mjukt rosa, korta responsanimationer, kontrast och reducerat rörelseläge.
- Ursprungliga uppgiftsmotorer, lektionsinnehåll, årsgradernas progression, Cup och Joker lagras fortsatt separat.

## Psykologi, pedagogik och sociologi — hypoteser att pröva
1. Låg starttröskel: fyra begripliga ämnesval och fem frågor utan komplicerad konfiguration.
2. Handlingsfrihet inom begränsade val: eget ämne och solo/kompis, men få primära knappar.
3. Återkoppling om metod och nästa steg: tydliga ledtrådar, självrättning och fel som information.
4. Äkta inlärning: aktiv återkallelse och spridd repetition i stället för enbart läsning.
5. Social tillhörighet utan offentlig jämförelse: valfria samarbeten, skyddad progression, ingen publik ranking eller tvångsstreak.
6. Visuell variation utan distraktion: mjuka men distinkta ämnesfärger, förutsägbar navigation, mikrorörelser bara för feedback.
7. Inklusion: tydliga ord, hög kontrast, minskad animation, skärmläsning, anpassad tangentbordsnavigering, olika tempo.
8. Lärarperspektivet: förstå var eleven behöver hjälp utan att felaktigt dra slutsats om nivå eller jämföra syskon.

Forskningsankare (motiverar designprövning, inte bevisad effekt):
EEF Metacognition and Self-Regulated Learning, 2025:
https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/metacognition
EEF Feedback:
https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/feedback
CAST UDL Guidelines 3.0:
https://udlguidelines.cast.org/engagement/
Nature Reviews Psychology, spacing and retrieval:
https://www.nature.com/articles/s44159-022-00089-1
W3C WCAG 2.2:
https://www.w3.org/TR/WCAG22/

## Releasegrindar och risker
1. **P0 auth:** två syntetiska elever i samma årskurs, elev->mentor-rollförsök, ansvarsbyte, otillåten snapshot-läsning och misstänkt invitation.
2. **P0 local:** gammal delad enhet, offline-kö, kvot full, två flikar parallellt och misslyckad backup; absolut inget okänt elevresultat får överföras.
3. **P1 learning:** gamla 63 matteområden bevaras, förklaringar och bedömningar korrekta, förmågenivåer ej förväxlade.
4. **P1 navigation:** root, Lärande, Prov, Cup, Joker, Tillsammans och mentorvyer har rätt back/forward, fokus, avbrott och återkomst.
5. **P1 appearance:** 320/390/768/1440 px, dag/kväll, minskad rörelse, fysisk Safari/VoiceOver, zoom 200%.
6. **P1 real-evidence:** minst två representativa elever och en mentor ska kunna börja och avsluta utan instruktör; mät feltryck, tid till första uppgift, förvirring, nyfikenhet och upplevd belastning.
7. **CI/rollout:** kör samtliga tester på samma commit SHA, kontrollera Pages-deploy SHA och offline-cache-färskhet.

## BLOCK / återstående begränsningar
- Säkerhetsmigrationen är genomförd och verifierad; produktionsrelease kräver fortfarande gröna CI-grindar och slutlig synk-, flerfliks-, offline- och tillgänglighetskontroll. Ett oregistrerat konto får nu vänta på betrodd administrativ profilaktivering, inte välja mentorroll självt.
- Workspace-isoleringen bör kompletteras med konfrontativa flerfliks- och strömavbrottstester; global browserlagring ersätts hellre långsiktigt med direkt kontonycklad lagring.
- Äldre data ligger i karantän. Ingen automatisk migrering får ske utan belägg om ägare och återställningspunkt.
- Skarpa elevkonton, privata inlämnade svar och fysisk mobil används inte i automatiska test.
- Inga resultat om faktisk ökad studielust eller lärandeeffekt får påstås utan användarobservation.

## Rollback
Revertera granskningsgrenens UI/JS/CSS/PWA-commit om test går rött, men radera aldrig localStorage, karantänkopior, elevdata, mentor-länkar eller Supabase-snapshots. Databasmigration återställs inte slentrianmässigt till osäker självvald roll; administrativ kontoprovisionering måste finnas kvar.

## Definition av klart
Ett inloggat elevkonto visar endast egen årskurs och egen data, ger ett tydligt första steg, uppmuntrar konstruktiva försök, synkar/återkommer utan sammanblandning och fungerar tillgängligt på mobil. Mentoråtkomst är verifierad och återkallelig; inga säkerhets- eller skoldata löser sig genom dold profilväxling.
