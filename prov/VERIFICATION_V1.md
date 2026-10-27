# Matte Prov v1.1.0 — independent rebuild after figure audit

Datum: 2026-10-27

## Why v1.0.1 was rejected

The first separate exam page was functionally useful but not acceptable as a precise exam environment because it reused Matte OS teaching visuals. That created several classes of risk:

1. A teaching visual can contain method/formula cues that should not exist in an exam.
2. A generic concept figure can differ from the exact wording of the question.
3. A hidden answer can exist inside the teaching visual spec even when the UI question asks the learner to find it.
4. A figure can give more scaffolding than the question itself should provide.
5. The fixed 45-minute timer was not sourced from the school and therefore should not be presented as a default exam condition.
6. Result labels such as "Sitter" were too strong when based on only one or two questions.

## Critical concrete findings

### Hidden-answer risk
The Grade 8 sector task asking for the sector angle had teaching visual data with `v: 90`, while the correct answer is 90°. The exam renderer must never display that stored teaching value when the angle is the unknown.

v1.1 renders:
- `v = ?`
- given radius
- given sector area
- an explicitly non-scale diagram

### Wrong visual type risk
Some teaching visuals are intentionally conceptual rather than literal:
- vertical-angle questions reused the general parallel-lines visual type
- a square-diagonal task reused a right-triangle visual
- a surface-area cube task used a cube net
- symmetry teaching visuals can show lines the learner is supposed to count

v1.1 has a separate exam-only renderer that changes these to literal question figures.

## Architecture

New file:
`prov/js/exam-visuals.js`

It does NOT reuse `js/visuals.js`.

Hard rule:
> An exam figure may contain only given information and explicit unknown markers. It may not contain formulas, solution steps, hidden answer values or teaching mnemonics.

Examples:
- square diagonal → square + diagonal
- rectangular-screen diagonal → rectangle + diagonal
- crossed lines → one intersection, not two parallel lines
- parallel-line task → exactly two parallel lines + transversal
- unknown sector angle → arbitrary schematic sector labelled `v = ?`
- symmetry → shape only, no symmetry lines
- cube surface area → cube, not a net that reveals the six-face strategy

## Exam conditions

v1.1 removes the hard-coded 45-minute timer.

Reason: school test duration has not been verified. The system must not invent examination conditions.

Current difference:
- Diagnos: one question per skill in the chapter.
- Prov: every skill represented plus extra mixed/higher-level questions, max 18.

No formulas, hints or immediate correction are shown during either mode.

## Result precision

Removed over-strong mastery labels.

Instead of saying a skill "Sitter" based on a single item, results say:
- X/Y correct in this test
- Rätt / Följ upp

The result page explicitly states that the result is from this test run and is not a school grade or proof of full mastery.

## Exam review flow

Before submission, the learner gets a review page showing:
- answered questions
- unanswered questions
- marked questions

No final answer is submitted directly from the last question.

## Verification

### Syntax
PASS:
- prov/js/exam-core.js
- prov/js/exam-visuals.js
- prov/js/app.js
- js/math.js
- js/core.js
- js/content9.js
- js/content8.js

### Generated test selection
20 seeds per:
2 grades × 3 chapters × 2 modes

Total:
- 240 generated test runs
- 2,860 selected questions
- 0 coverage failures
- 0 duplicate-question failures
- all canonical answers accepted by the shared deterministic answer checker

### Figure audit
Geometry question bank:
- 130 geometry questions
- 70 render an exam figure
- 55 questions have an explicit figure spec; 55/55 render successfully
- remaining text-only questions are deliberately not forced to have decorative figures

Automated figure checks:
- 0 hidden numeric answer leaks found
- 0 teaching-formula leaks found

Targeted regression checks:
- unknown sector angle does not display 90°
- symmetry count is not drawn
- vertical-angle question uses crossing lines
- rectangular screen is drawn as rectangle + diagonal
- surface-area cube is drawn as a cube, not a teaching net

## Live
Path:
`/matte-os/prov/`

Build:
`1.1.0`

PWA cache:
`matte-prov-v1.1.0-20261027`

## Rollback
`rollback-prov-v1.0.1-before-v1.1`

## Remaining gate
A fresh dynamic external-browser walkthrough of v1.1 could not be started because the metered browser-automation wallet was out of funds. Static live deployment, build marker, service worker and code/data QA are verified.

Still required for final physical acceptance:
- actual iPhone Safari
- keyboard open on numeric/algebra answers
- review screen
- exit confirmation
- home-screen PWA reopening
