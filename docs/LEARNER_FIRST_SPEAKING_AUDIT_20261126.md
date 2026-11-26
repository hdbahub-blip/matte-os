# Matte OS – learner-first UX audit, speaking and language navigation

**Date:** 2026-11-26  
**Audited released baseline:** `c9ea8bb4d772a514a44fee390e4c601cfbe104c0`, main after PR #62.  
**Change class:** Reversible frontend reduction. No new role, account, database table, RLS policy, mentor link, or pupil-data flow.

## Actual user goal

The learner should understand where she is and what to do without a setup tutorial. Subject difficulty can stay at year-9 English; *the interface must not add cognitive difficulty*. The learner needs **two complete, topic-specific, contrasting examples**, a universal worked-guide, a concrete sentence-builder, and a natural conversational handoff.

## Independent findings in the baseline

| Finding | Earlier learner cost | Corrected experience | Guardrail |
|---|---|---|---|
| The first Speaking Lab screen is an introduction and a configuration workflow | Choose solo/pair/group, optionally category, then start before seeing a task | Open the page and the first real question is **already visible** | Existing mode and original deck retained |
| Completing one person's speaking turn routed through a separate six-checkbox reflection page | Two extra steps per speaker before a partner can respond | **One** clear next-person / next-card action | Reflection is not an official grade |
| Five rescue buttons, phrase details and a separate guide competed for attention on a question screen | Many visible controls and unclear priorities | Plain question and next action first; rescue examples lower on the same page, universal guide one tap away | Existing oral skills still taught |
| PACE provided generic placeholders instead of topical modeled answers | Knowing the form did not show what a finished reply sounds like | **Two fully authored PACE answers for each of the existing 49 cards** = 98 unique complete replies, 392 explicit learning steps | No real/secure exam tasks or claims of model answers being scores |
| No constructive way to practise assembling sentences without writing | Memorise a generic phrase or speak unsupported | Four visible sentence stages. **Two topic-specific, complete options per stage**; choice instantly changes a full sample answer | No mandatory typing, no learner response stored |
| The English hub featured general first lesson AND Speaking Lab with many game options below | No single obvious direction for today's oral practice | One clear featured "Prata engelska – börja direkt" CTA on English hub | 39 other language modules and existing debate remain accessible |
| The Swedish subject hub can become busy with parallel feature links | Too many first-step choices | One first-step CTA above existing content | Lessons and tasks unchanged |
| New modules can accidentally break existing PWA caches or privacy boundaries | Stale files and risk of data loss | Versioned learning-only offline cache, content/route tests, no database or user answers touched | Validate offline, migration and live build SHA |

## Pedagogical design

1. **Start with a real card.** The question is the centre of the screen. A location trail, “kort X av 49”, a new-topic button and an optional question reader answer the learner's immediate navigation needs.
2. **A full answer, not “you could say ...”.** Each card offers two complete examples with **P: opinion; A: reason; C: concrete example; E: engaging follow-up**. The examples present different reasonable views, so the pupil learns flexibility instead of memorising one correct position.
3. **Build a sentence by acting.** Each PACE step has two genuine choices specific to that exact question; the built answer recomposes immediately and can be read aloud by text-to-speech.
4. **Keep the conversation flowing.** Solo, pair and four-person school-practice controls live on the task page, with no mandatory onboarding. The follow-on speaker sees a reminder to respond to what was actually said. This is not a claim that four-person practice is the official exam form.
5. **Normalize imperfect starts.** Concrete starter examples for blank mind, boring topic, excessive talking, missing vocabulary and disagreement are visible without navigating away. A separate short guide gives **two fully worked examples for money and crime**, two different topics.
6. **No surveillance.** TTS only reads displayed text. There is no microphone access, voice recording, scoring, transcript, identity collection or new data flow. The existing sessionStorage key holds only topic/turn/order; no pupil answer.
7. **Visual hierarchy before decoration.** Navy text, light background, restrained burgundy and lavender accent, clear buttons and readable 44px+ controls. Night theme uses stored preference. No timed challenge, gamified pressure or extra choice axis.

## Verified primary-source distinction

Göteborgs universitet (NAFS) describes English year-9 national speaking subtest A as **Warm-up, Part 1 and Part 2 in pairs**, assessing oral production and interaction. A four-person mode is only a voluntary practice arrangement. The app's two worked answers and PACE mnemonic are **original practice**, not official national-test prompts or graded rubrics.

Primary sources:
- https://www.gu.se/nationella-prov-frammande-sprak/prov-och-bedomningsstod-i-engelska/engelska-arskurs-7-9/nationella-prov-i-engelska-for-arskurs-9
- https://www.gu.se/nationella-prov-frammande-sprak/prov-och-bedomningsstod-i-engelska/engelska-arskurs-7-9/nationellt-prov-i-engelska-for-arskurs-9
- https://www.skolverket.se/prov-och-bedomning/nationella-prov/provdatum/provdatum-for-grundskola-sameskola-specialskola/delprov-och-innehall---grundskolan-sameskolan-specialskolan

## Quality gates and rollback

**Tests:** `node tests/speaking-lab-qa.js` validates all topics and examples plus data/privacy; `tests/speaking-lab-e2e.js` tests direct start, 320/390/980 px, original examples, sentence-builder, turn-taking, pair and group, deep link to the guide, reload, offline cache via existing test suites, light and dark, and no JS errors. Other regression gates cover math, Swedish, English, private NP, Cup, Study Cloud and Tillsammans.

**Pass criteria:** All quality workflow jobs and the separate private NP job green on the exact PR head SHA; GitHub Pages success on the exact merge SHA; live assets and synthetic published user-flow pass; no change in linked pupil records.

**Not claimed:** A full human usability validation on real pupils, native iPhone Safari/VoiceOver, measured learning improvement, or correctness of spoken pronunciation/factual assertions. A teacher must assess actual conversation. Broad, unrelated whole-site redesign is intentionally out of scope for a no-data-loss urgent frontend release.

**Rollback:** Revert this frontend commit/PR and let GitHub Pages redeploy. Do not wipe browser data, study snapshots, links or authentication sessions.
