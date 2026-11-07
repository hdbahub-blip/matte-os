# Matte OS · Lärande v1 · release/rollback

## Scope
- Publicerad under /lara/ med egna statiska filer och service worker; inga nya servrar, konton eller elevdata i repot.
- Matematiken och Cup lämnas intakta; huvudmenyn får en extra kortlänk.
- Elevprogression lagras lokalt per grade8/grade9 i matteos.larande.v1; gamla matteos.v5 berörs endast vid profilbyte (active), inga matematikförsök skrivs om.
- 30 lektioner: 10 svenska, 11 engelska, 9 studieteknik. 24 duellkort + samarbete + 8 startkollsfrågor.
- Muntliga och öppna svar bedöms mot synliga kriterier av användaren, inte av en AI.

## Quality gates before publish
1. All four existing workflows (unit, mobile, cross-engine, Cup backend) green on exact PR head.
2. tests/larande-qa.js and tests/larande-live-e2e.js green; root link, navigation and offline verified.
3. Same-origin upgrade 5.5.0 to 5.5.5 preserves existing math progress.
4. Check published HTTPS /matte-os/lara/ in browser. No release-claim before direct readback.

## Rollback
Revert the integration commit. Preserve user browser storage. Do not clear localStorage; old maths progress is stored under matteos.v5 and learning progress under matteos.larande.v1. A rollback hides the learning link but should not erase progress.

## Educational rationale
- Curriculum: https://syllabuswebb.skolverket.se/compulsorycw/jsp/subject.htm?subjectCode=GRGRSVE01&tos=gr and https://syllabuswebb.skolverket.se/compulsorycw/jsp/subject.htm?subjectCode=GRGRENG01&tos=gr
- EEF metacognition (2025): https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/metacognition
- Distinguish technical tests from educational impact. Evaluate student understanding with independent transfer tasks over multiple sessions.
