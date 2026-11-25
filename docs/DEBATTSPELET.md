# Debattspelet (svenska och engelska) – 2026-11-25

Page: `lara/debatt.html` (`?lang=sv|en`) · files `debatt-content.js` (invented topics and cards), `debatt-core.js` (pure rules), `debatt-app.js`, `debatt.css`. Cache `matte-os-larande-5.3.0-debate`.

## Why
The national-test speaking parts reward reasoning, answering back, understanding other perspectives and leading a conversation. Those are skills to rehearse by doing, not to read about. The game turns them into a calm, funny two-person (or solo) activity: one side is FOR, the other AGAINST, you switch back and forth, and a joker card can change what both players are doing.

## How it plays
1. **Setup in three taps**: two on one phone or alone against the Opponent → language and topic (ten topics per language, or "draw a topic") → names, coin toss for sides, short (3 rounds) or full (5 rounds). Optional one-minute **preparation** shows three arguments for each side and likely follow-up questions. Rules, a "questions that may come" panel and a skill meter sit behind collapsible cards so the first screen stays small.
2. **Rounds**: opening (opinion + reason) → example → answer back ("understand – but – so") → ask an open question → closing (sum up and agree with one thing). Each player speaks in turn; the **listener ticks what they heard** (reason, example, answer-back, open question, summing up, partly agreeing, other perspective, fact/opinion). After both turns the listener may give a star for the strongest argument.
3. **Joker** (two per player): the face-down card is turned over by the player. Ten cards: **Switch sides** (both flip, continue from what the opponent just said), **New voice** (both speak as a teacher, parent, someone from another country…), **Fact or opinion?** (classify a statement as fact, opinion or exaggeration, with the reason shown), **Partly agree**, **Ten years ahead**, **Two reasons**, **Say their best argument** (steel-manning), **If everyone did this**, **Surprise question**, **Quiet moment**. A deck is dealt without repeats and never the same card twice in a row.
4. **Help is graded and never an answer key**: sentence starter → argument card for your own side (labelled "a suggestion – not the answer") → answer-back pattern (challenge the reason, challenge the example, look at the result, agree-and-turn).
5. **Solo**: the Opponent plays a card from the other side every round; you answer aloud and tick your own check. Joker "switch sides" also flips which side the Opponent argues.
6. **Pause and resume**: a paused match is saved on the device and offered on the start screen, also after a reload.

## Fun without pressure
Nobody wins points over the other: skills are ticked by the listener, stars are positive ("strongest argument"), and the match ends with reflection questions to talk through. No timer is required (30/45/60 s clock is optional). Reduced-motion users get the joker without the flip animation.

## Data
`matteos.debatt.v1` holds **counts only** per profile (skills heard, games played, topic counts). Names and anything said are never stored there. `matteos.debatt.save.v1` holds a paused match (round, sides, jokers left and, if typed, the two first names) on the device only. Nothing is recorded, sent or synchronised. Progress is not part of the Study Cloud snapshot or the maths backup.

## Navigation changes in this release
* Svenska/Engelska pages: removed the duplicate back links and the version label, added the debate game as the primary activity after "next step", and show three texts per level with "Show all N texts" (page height at 390 px: 3,359 → about 2,480).
* Studio hub, game hub and the "Spela" page link to the game.

## Tests
`tests/debatt-core-qa.js` (409 checks: content parity and quality, rules, jokers incl. swap/voice/fact/opponent scope, solo, help levels, storage sanitising, hostile saves, determinism) and `tests/debatt-e2e.js` (107 checks: full two-player match with a seeded swap joker, pause/resume across reload, solo with fact joker, English UI, keyboard use of the joker dialog, AA contrast day and night, widths 320–1280, 44 px targets, reduced motion, offline). `tests/np-private-qa.js` also scans the new files for school/novel text.

## Not verified
* No real student has played it; whether it feels fun and chilled is untested.
* Two phones are not synchronised (use Cup/Live for that); this is one shared phone or solo.
* The facts used by the "fact or opinion" card are general and harmless; they are not a sourced fact-check.
* Browser tests run in Chromium; WebKit/Firefox are not covered for this page.

## Rollback
Revert the commit. The new page and keys are additive; the only edits to existing files are links and the Svenska/Engelska list layout.
