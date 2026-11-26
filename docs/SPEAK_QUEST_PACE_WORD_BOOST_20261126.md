# Matte OS · Speak Quest — topic-aware P.A.C.E. Word Boost
**Date:** 2026-11-26
**Basis:** the exact 49 current original Speak Quest topic/question IDs in lara/speaking-lab-content.js, the 98 original P.A.C.E. model answers and the already released English player from PR #65.
**Delivery:** additive client-side English conversation scaffolding. Original card questions, model answers, progress/session logic, grades, accounts, mentor links and storage formats unchanged.

## Why
The four-stage game already helped learners build English responses but supplied no terminology tailored to the current card. Generic phrases like “I think” do not provide the topic words a pupil needs to discuss AI, fairness, bullying, privacy, the environment or everyday life. The new vocabulary is hand-selected for each original question, with definitions and complete natural spoken examples.

## Design and pedagogy
- **49 original cards, six distinct English words/concepts per card, 294 original contextual examples**.
- P **Point**: two terms to express a position. A **Argument**: two terms to explain a reason or nuance. C **Concrete example**: one term to introduce a realistic situation. E **Engage**: one term to ask a natural follow-up or widen perspective.
- Active round displays only the vocabulary for the current P.A.C.E. stage after explicit expansion of *Word Boost*. Default is collapsed, so it does not interrupt the primary choices.
- The glossary is also available for *I want to speak on my own* and the completed-answer view, showing six terms grouped by stage. The short *How to play* guide includes a collapsed one-word-per-stage preview for its two example themes (Money and Crime).
- Each term offers a concise English definition, one natural *Try saying* example and optional *Listen* (existing on-device English speech synthesis).
- Four reusable conversational moves: “My view is that ...”, “This matters because ...”, “For example, imagine ...”, “How would you see this differently?”
- Word support is optional, does not fill answers automatically and never claims to verify pronunciation, word usage or learning. There are no timers, penalties, speech recording, transcripts, AI assessment, analytics or new accounts.
- Sample complete word sets:
  - AI: AI assistant, original thinking, reliable source, overreliance, fact-check, academic honesty.
  - News: misinformation, credible source, clickbait, corroboration, edited clip, verify the claim.
  - Climate: carbon footprint, sustainable choice, collective action, energy use, food waste, shared responsibility.
  - Fairness: equality, equity, barrier, accessibility, extra time, fair chance.
  - Friendships: close-knit, mutual trust, loyalty, peer pressure, falling out, different perspective.
- No new third-party dependencies and no new Supabase/Cloud database tables or RLS changes.

## Source and integration
- lara/speaking-wordbank.js: 49 × 6 original terms, definitions and spoken examples, read-only data, exact topic IDs.
- lara/speaking-play.js: optional in-round stage-driven disclosure, safe text escaping, Word Boost keyboard-focus restoration, English text-to-speech and short-guide examples.
- lara/speaking-wordboost.css: accessible card styling at 320px+, keyboard focus, light/dark mode and reduced-motion.
- lara/speaking-lab.html: loads new module before interactive player.
- lara/sw.js: isolated offline cache now versioned 5.7.0-pace-words, including glossary, styles and updated player.
- tests/speaking-wordboost-qa.js: topic coverage, stage counts, content quality, consistency, privacy and offline resource checks.
- tests/speaking-wordboost-e2e.js: actual original cards in three widths, stage transitions, free mode, topic selection, guide, keyboard focus and unchanged session state. Chromium verifies a real offline page reload. WebKit verifies all speaking interactions and the offline-cache contents; offline full-page reload is explicitly not asserted because Playwright WebKit 1.49 on Linux produced an internal engine error. A physical Safari offline test remains outstanding.

## Verification and release policy
The minimum gate is new content/JS tests, existing Speak Quest E2E, new Chromium and WebKit E2E, existing learning and offline regressions, and private-NP workflow all successful on exactly the PR head SHA. Merge only then; confirm GitHub Pages deploy on the exact merge SHA and live public card/word examples.

**Human falsification test:** Ask an actual pupil to discuss “Should students use AI to help them study?” without advance explanation. Observe whether she finds *fact-check* at C and *academic honesty* at E; have her speak an original sentence using one term. Repeat with a social issue and an everyday topic. If plain-English definitions are unclear or the helper obscures the original options, revise terms/layout. Physical iPhone Safari / screen-reader use and actual learning-outcomes studies remain explicitly unverified.

## Rollback
Revert the frontend-only PR and allow the previous GitHub Pages release to deploy. Do not clear student progress, session state, Study Cloud, parent snapshots, backend data or mentor memberships. The isolated learning offline worker replaces its own old cache on activation and retains account boundaries. No new persistence is introduced by this feature.
