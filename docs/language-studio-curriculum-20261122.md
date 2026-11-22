# Matte OS — Language Studio: curriculum, UX and release QA
Candidate 2026-11-22. Target: hdbahub-blip/matte-os (existing production).

## Intent and first-use acceptance
A student should always know where they are, their next action and how to return. Entry remains four familiar choices: Maths, Svenska, English and Spela. The signed-in Grade 8/9 role remains authoritative. Guest selection is local-only. No new accounts, role axis or schema.

Learning route: subject > strand > lesson (worked example) > two questions with explanatory feedback > optional writing with self-check or partner discussion.
Play route: choose language > game type (five questions, match pairs, order ideas or conversation) > solo or two on one screen. Previously available multi-device/group games and Cup are still linked.

## Official source scope
Sweden Lgr22 Swedish and English, years 7-9:
- Svenska: https://www.skolverket.se/undervisning/grundskolan/laroplan-lgr22-for-grundskolan-samt-for-forskoleklassen-och-fritidshemmet/curriculums/LGR22/GRGRSVE01
- Engelska: https://www.skolverket.se/undervisning/grundskolan/kursplaner-for-grundskolan/subjects/GRGRENG01

New bank comprises 19 Swedish and 20 English original lessons, each with grade-adapted questions. This is broad strand coverage, not a guarantee of every school's local plan or every possible text or assessment.
Swedish:
- Läsa: explicit facts, inference, theme/message.
- Texter: narrator, genre, metaphor and symbolism.
- Skriva: story, argument, explanatory writing, revision.
- Tala: presenting, discussion, listening for gist/details.
- Språk: grammar, text cohesion, language varieties and online register.
- Källor: source criticism, quotation and references.
English:
- Reading: gist, inference, genre and purpose.
- Listening: gist, corrected details.
- Speaking: dialogue, persuasive discussion, short presentations.
- Writing: stories, messages, arguments, editing.
- Language: tense, connectors, modals, vocabulary nuance, pronunciation.
- Sources: evaluating evidence and media messages.
- Culture: respectful comparison of perspectives.
The previously published longer reading workshop and 30 legacy short lessons remain available. English listening lessons include optional on-device text-to-speech playback with a human-reader fallback; no audio is recorded or uploaded.

## Learning and design research, with limits
- Duolingo: voluntary short rounds with clear feedback — https://blog.duolingo.com/
- Khan Academy: scaffold and mastery-oriented practice — https://www.khanacademy.org/
- Kahoot!: cooperative classroom quizzes — https://kahoot.com/
- Quizlet: multiple retrieval games from similar knowledge — https://quizlet.com/
- CAST Universal Design for Learning: engagement and response choices — https://udlguidelines.cast.org/
- W3C WCAG 2.2: focus, readability, non-tiny touch targets, reduced motion — https://www.w3.org/TR/WCAG22/

These are design influences, not borrowed proprietary design or a claim of measured effectiveness.
Design decisions: neutral surfaces with one restrained grade accent, no timer or public ranking in new games, descriptive navigation, short teaching example, visible exit/back, original question bank, no invented grades for open writing, no rush requirement and optional partner play.

## Verification, risk and rollback
The new bank has 39 modules, 78 distinct primary grade-level questions, 117 definition pairs, 39 writing assignments and 39 discussion tasks. Objective questions also include one term retrieval item per module and grade. Correct answer positions are deterministically shuffled with stable seeds so position alone does not reveal correctness. QA checks uniqueness, data shape, valid answers and cross-grade coverage.
Browser acceptance targets 320 and 390 CSS-pixel viewports, Grade 8 and 9, Chromium and WebKit, all four games to completion, writing checklist, reading-workshop backward compatibility, no unintended new user-data storage, no overflow, and existing access/role isolation.

New games intentionally keep session-only results. Draft writing is not uploaded or persisted by the new feature. Existing cloud, exam, mentor, maths and reading records remain unchanged. No real learners/physical iPhone or measured learning outcome can be claimed from automated tests.

Release gate: exact merged SHA, successful GitHub Pages deployment, original URL live smoke, root and child service-worker cache rotation. An old installed browser may require the existing safe updater at https://hdbahub-blip.github.io/matte-os/uppdatera.html .
Rollback: revert the relevant merge commit and redeploy GitHub Pages, then retest old and new links. Never delete student localStorage, IndexedDB, private progress or accounts.
