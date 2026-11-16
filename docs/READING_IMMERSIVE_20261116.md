# Matte OS — FULLSPEC reading/content enhancement and bounded integration audit
**Date:** 2026-11-16  
**Target:** `hdbahub-blip/matte-os`, feature branch `feature/reading-11-immersive-fullspec-20261116`  
**Status:** Development candidate; **not** proof of deployment or pupil acceptance.

## 1. Mission and existing facts
Owner requested a thorough takeover/audit of Matte OS including flows/visuals and **11 new original reading passages**. Source inspection included `README.md`, `docs/UX_FLOW_AUDIT_20261115.md`, `lara/sprak.js`, `lara/sprak.css`, both language banks, `lara/index.html`, both service workers and the existing CI suite.

Existing app is a local-first educational PWA with separate Grade 8/9 local progress, optional accounts, guest modes, offline reading, word activities and separate private mentor/cloud flows. A UX revision dated 2026-11-15 was already addressing overcrowded navigation. Do not replace it with a parallel architecture.

## 2. Authoring inventory

| Language | Level 1 | Level 2 | Total |
|---|---:|---:|---:|
| Swedish | 4 | 3 | 7 |
| English | 2 | 2 | 4 |
| **Total** | **6** | **5** | **11** |

**Swedish:** Lampan som blinkade tre gånger; Lekplatsen som försvann från kartan; Zon Noll – platsen som ingen kunde förklara; Dagen som började klockan 08.13; Hissen till våning minus ett; Arkivet under havet; När himlen började ge fel prognoser.

**English:** The Door on Floor Zero; A Postcard from the Moon; The City That Borrowed Tomorrow; The Last Signal from Earth.

Every new passage has eight tasks: multiple-choice comprehension, find-the-evidence, sequencing, cloze in a fresh context and an open argument/evidence response with three self-assessment criteria. All fiction/newspaper-style texts are original practice passages: **not** authentic national examinations, nor claimed to be standardized. They avoid sexual/erotic subject matter.

**Pedagogical target:** narrative curiosity and cliffhangers without turning complex comprehension into mere speed/recall. Level 1 has glossary and clearer explicit information; level 2 requires interpretation of competing explanations, reliability, evidence and consequences. Open responses support more than one defensible interpretation when backed by the text.

## 3. Code and UX modifications
- New independent `lara/texts-immersive-20261116.js`; unchanged IDs for all earlier texts. Loaded before language aggregators and included only once.
- Extend existing SV/EN banks with new entries, preserving all existing tasks, storage keys and progress.
- The existing library puts new passages first **within each level** and marks them visually with `NY`. The same level taxonomy and screen-reader context remain.
- Update `lara/index.html`, nested `lara/sw.js`, root `sw.js` and versioned references to ensure installed PWA offline retrieval without stale asset mixes.
- No new login, roles, analytics, permissions, database tables, student fields or new remote calls.

## 4. Risk scan / acceptance tests
| Risk | Control / acceptance |
|---|---|
| Story imported twice | `tests/reading-immersive-qa.js` requires exact bank totals and one runtime ID; inspect both worker pre-cache lists |
| Old pupil progress lost | Never reset `matteos.v5`, `matteos.sprak.v3`, `matteos.larande.v1`; upgrade same-origin with synthetic grade8/grade9 sentinels |
| Wrong answer shown as correct | Each task's first authoring option is the correct answer, deterministic display shuffles it; QA checks evidence anchors, unique options, explanation, and position bias |
| Unsupported source/claim | Do not present stories as real reports or official national-proven items; fictional setting where appropriate |
| Lower reader accessibility | Keep adjustable OS text zoom, readable spacing, high contrast, keyboard focus and light/dark profile colors; test mobile/WebKit |
| Private text leak | No modifications to cloud writes, RLS or guest isolation; existing security tests must remain green |
| Stale offline version | Root and learning cache versions changed; upgrade regression and offline reload must pass |

## 5. Verification and release
**Directly inspected:** repository source structure, existing learning engine and authored anthology metadata. The new bank contains 7 Swedish, 4 English passages and 88 authored tasks. The development branch is read/write evidence, not runtime proof.

**New executable regression:** `node tests/reading-immersive-qa.js`. Existing `node tests/sprak-qa.js`, `node tests/atelier-content-qa.js`, `node tests/fullspec-release-qa.js`, browser, cross-engine and upgrades should all pass on the exact PR head. New regression is wired into `.github/workflows/matte-qa.yml`.

**Not yet verified at authoring:** actual student reading performance, physical iPhone Safari, authenticated multi-device sync or all live UI interactions. [FA] Improved engagement is a hypothesis: a blinded short task with representative users should compare reading completion, one evidence question, one inference question and what they voluntarily choose next against the old anthology.

**Release gate:** all applicable CI jobs green on final head, no duplicate IDs, offline reload and no data regression; confirm GitHub Pages deploy commit equals merged main. No direct merge or publication in this candidate.

**Rollback:** revert the content/UX change on main (if merged), bump both SW caches and redeploy. Preserve every pupil local storage key and all remote data. No schema rollback is required because none was changed.

## 6. Bounded full-app audit status
A 2026-11-15 UX review already maps the broader Maths/Grade/Study/Guest/Cup/Mentor routes. This contribution validates integration boundaries for **reading**; it is **not** an independently observed A–Ö live regression of every feature. Before calling that larger mission complete, run task-by-task journeys on both profiles, solo, same-device group, cross-device Cup, guest, parent overview, offline/online switching, backups/imports and return after interruption, with screens and evidence on the exact deployed revision.
