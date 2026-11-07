# Språkverkstad 2.1 – källgrundad audit och leverans
## Kritisk brist i v1
- För få fullängdstexter, inga nivågraderade texter, svag varierad språkanvändning.
- V1:s gamla slumpduell ger inte samma frågeföljd på två enheter; v2:s språkverkstad har deterministiska textfrågor och daglig gemensam utmaning.
- Gemensamt material får inte betyda ihopblandade elevresultat.
## Använd forskning och produktmönster
- CommonLit 360: hela texter som utgångspunkt för diskussion, skrivande och stödord. https://support.commonlit.org/article/222-how-does-commonlit-360-develop-reading-skills
- CommonLit: läsfrågor, textbevis, samtal, eget resonemang. https://support.commonlit.org/article/678-what-types-of-questions-are-included-in-a-360-reading-lesson
- Kahoot: samarbeta kring en enhet, men undvik att göra snabba svar till enda mål. https://support.kahoot.com/hc/en-us/articles/4408679135891-Team-experience-How-to-play-kahoot-in-groups
- EEF: direkt undervisning av lässtrategier, slutsatsdragning, sammanfattning och gradvis självständighet. https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/reading-comprehension-strategies/
- Skolverket svenska år 7–9: läsa och tolka, texter, ord, sammanfatta, samtal och skrivande. https://syllabuswebb.skolverket.se/compulsorycw/jsp/subject.htm?subjectCode=GRGRSVE01&tos=gr
- Skolverket engelska år 7–9: receptiva och produktiva färdigheter, vardagliga och relevanta ämnen. https://syllabuswebb.skolverket.se/compulsorycw/jsp/subject.htm?subjectCode=GRGRENG01&tos=gr
## Levererad struktur
13 textteman (9 SV, 4 EN); 39 svårighetsvarianter; varje tema har uppbyggnad: läsa/lyssna i stycken, förstå med förklaring och citat, förklara ord, fylla luckor, återberätta, tvåpersonersaktivitet, avsluta. Fem exakt bevarade användartexter på svår nivå, inklusive alla 38 ursprungliga frågor och facitsvar. Kortlektioner i språk och studieteknik är kvar.
## Integritet & säkerhet
Inga autentiseringssystem eller chattkonton införs. Endast övningsprogress per elevprofil i ny lokal nyckel matteos.sprak.v2; matteos.v5 och matteos.larande.v1 rörs inte av språkverkstaden. Ingen fritext eller ljud lagras; uppläsning använder webbläsarens TTS där tillgänglig. Dela inte riktiga elevuppgifter på den publika webbsidan.
## Kontroll före release
Unit och contenu QA (inbegripet varje facit och varje citats förekomst på alla nivåer), mobil Chromium E2E och samtliga gamla matte/Cup/WebKit/Firefox-regressioner måste vara gröna. Säkerställ webbåtkomst till /lara/ och fem fulltexter efter merge. Rollback: revert innehålls-commit. Rensa aldrig elevens localStorage som rollback.
## Begränsningar
- Inga automatiska betyg för fria muntliga/skrivna svar; en människa behöver bedöma resonemangen.
- Samma frågor på två mobiler är deterministiskt innehåll, inte live multiplayer. För live-sync krävs separat säker multiplayerdesign.
- Här finns ingen verifierad effekt på verkliga elever. Mät genom att de kan återberätta, hitta textbevis och göra nya uppgifter utan hjälp efter några dagar.
- TTS är en stödfunktion och kan skilja sig mellan mobiler/röster; inte fullständig hörförståelse med inspelade mänskliga röster.
