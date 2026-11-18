# Muntlig NP-övning (åk 9) – independent rebuild, 2026-11-18

Page: `lara/np-muntligt.html` · linked from Svenska (åk 9) · version 2.0.0 · cache `matte-os-larande-4.9.0-np-rebuild`.

## Why it was rebuilt
The first version was eight tabs and text fields: a digital question booklet. The audit showed that it counted an answer as done after 10 characters, offered no modelling of reasoning, no revision, no spoken practice with fading support, no transfer to unseen texts, and put file import/sync status above the learner's first minute. It was replaced, not patched.

## The learning journey (7 stations, one recommended next step)
1. **Så fungerar övningen** – what Presentera / Leda / Delta mean (named after Skolverket's description; explicitly *not* the exam), then a six-item sort quiz with an explanation per item.
2. **Läs och förstå** – the school text in chunks; retell each chunk in own words (a gentle flag if it only copies the text), self-check against key points, save paragraphs as *evidence* typed as "det som står / min tolkning / det jag tycker", a three-line story summary, optional read-aloud (browser speech synthesis).
3. **Tänk och svara** – for each of the four school questions plus the discussion question: own answer first → pick evidence paragraphs → try another perspective → compare three reasoning examples (the learner chooses before the explanation shows) → improve own answer and *name what improved* → say it aloud with three self-written cue words and fading support (all cues → first word only → none). Three help levels exist but only on request; the worked example opens only after the learner has tried. A **retest** (blank answer, no old answers visible) unlocks about a day after the revision; a retest only counts if it was saved at least that long after the revision and not in the future (owner fix e8d5862: a typed deep link cannot bypass the delay).
4. **Presentera** – five-part cue-word presentation (warns when an entry becomes a script), pulls the learner's own earlier work in as suggestions, rehearsal rounds with fading cues and an optional two-minute timer.
5. **Leda samtalet** – five branching simulations (silence, dominating speaker, hard tone, shallow answer, drifting topic) with reasons for each option, the learner's own opening (two follow-up questions are checked for being *open*), surprise-objection cards answered aloud, and a role card for a family member (no account or paid service).
6. **Delta i andras texter** – three short, invented, unseen texts in different genres; recap → connect → open question → build on/object politely. Support fades per text (frames → first words → none).
7. **Generalrepetition** – six-step run-through with optional timer (clearly labelled not official), reflection (what I could first / what improved / what next), before-and-after view.

### What "done" means (and does not)
Stations are only marked done on complete practice (owner-tightened rules, e8d5862): *Läs* needs every section retold and two evidence paragraphs; *Tänk* needs all five answers improved with a named improvement and at least two said aloud at a faded level; *Present*, *Lead*, *Join* and *Finish* as described above.

Progress is derived from actions: tried, evidence attached, revised *with a named improvement*, said aloud at a faded level without reading, retested independently, unseen texts answered, one without any help. **Length of text never counts.** The textual analysis ("Mitt svar / Därför / Belägg / Annan syn") is a heuristic hint, labelled as such, and no grade or exam score is produced anywhere. Unit tests assert that 2,000 filler words earn nothing, that identical rewrites and unnamed changes do not count as revision, and that reading aloud does not count as speaking freely.

## Source fidelity (gate A)
School photos are the primary source; the EPUB only supplements where the photos cannot be read. Photo 3 (title, summary, four questions, discussion question, instruction) is clear and preserved verbatim. Photos 1 and 2 are partly blurred, curved at the left margin or covered by a thumb.

A paragraph-by-paragraph comparison of the earlier private JSON against the photos found deviations in **one paragraph** (the "1700s" paragraph): one missing punctuation mark, one wrong word pair, and a wrong final word. They were corrected to the photo; the final word is only partly legible on the photo and is supported by the novel. The earlier file's `bookTextParagraphs` (an EPUB mixture) was dropped from v2 so that the novel text is no longer shipped alongside the school edit.

Package v2 carries a per-paragraph `fidelity` status (`VERBATIM_PHOTO`, `PHOTO_PARTIAL`, `EPUB_INFERRED`, `UNREADABLE`). Non-verbatim paragraphs are marked in the reader, and the settings sheet summarises the counts. The statuses were set by Claude reading the photos; **they have not been proof-read by a human against the paper** – that remains the one open source gate. Never "fix" the school's wording to suit the design.

## Public vs. private
Public (open source, cached by the PWA): engine, UI, generic pedagogy, five simulations, three invented practice texts, a model episode. **No school text, no question wording, no novel text, no student answers.** Text-specific scaffolding (worked weak/strong examples, perspectives, key points) lives only in the private package v2.

`tests/np-private-qa.js` enforces this in CI: it scans every tracked file for 6-word runs and compares SHA-256 prefixes with `tests/np-leak-hashes.json` (hashes of the school text and the novel chapter; the hashes cannot be turned back into text). The first run caught a test fixture that reused a school question's opening words.

## Data model and migration
Notes remain flat `key → {value, at}` entries so the existing Study Cloud helper works unchanged (`study_snapshots`, `module='reading'`, per-device row, marker `kind='matteos-private-np-2'`; np-1 rows from the old app are still read). New keys: `ans.qN.*`, `read.sN`, `ev.pN`, `pres.*`, `lead.*`, `join.*`, `rehearsal`, `reflect.*`, `quiz.pass`. First load migrates old keys (`q0…q4`, `p1…`, `l1…`, `testnote`) to the new names, keeps everything else under `legacy.*` (shown on the final page), and **never deletes or overwrites** the old keys, so rolling back loses nothing.

Sync semantics: last write per key wins; the server never decides. Known limits: device clock skew can pick the "wrong" winner for a field edited on two devices at the same moment; the helper reads at most 250 snapshot rows; a snapshot is far below the 900 kB jsonb guard (the test fixture's is ~15 kB); data is RLS-protected but **not end-to-end encrypted** and an approved, linked mentor can read it. Incoming sync never re-renders while the learner is typing, so a field in progress cannot lose focus or text.

No schema, RLS, auth or production change was made. No new service, role or account type.

## Accessibility
7 stations instead of 8 tabs; one primary action per screen; file pickers are real buttons (keyboard); sheet focus trap and Escape; heading focus on navigation; step labels shown for the current step only on narrow screens; every target ≥ 44 px at 320/390/430/1280 (tested); text/background contrast ≥ 4.5:1 in day and night (tested over headings, buttons, school quotes, help blocks, feedback); respects `prefers-color-scheme` until the learner chooses; no motion beyond a 150 ms colour transition (disabled with reduced motion).

## Tests
| Test | What it proves |
|---|---|
| `np-core-qa.js` | package validation, analysis, open-question check, copy check, cue fading, merge/migration, progress semantics, retest rules |
| `np-private-qa.js` | leak guard, no network use, offline cache lists, content consistency, no school names in public code |
| `np-private-e2e.js` | whole journey in a real browser with a synthetic package, backup/clear/restore, migration of old notes, corrupt storage, widths, contrast, offline via the real service worker, no school text in the cache |
| `np-cloud-e2e.js` | two isolated browsers with a mocked Supabase client: device B recovers text + answers, newer edits win per field, different fields merge, stale copy is ignored, np-1 rows migrate, typing is never interrupted, other learner isolated, sign-out and account switch |

## Not verified
* **Gate G (human):** no real learner has used it. Whether she can start without help, answer, improve and speak is untested.
* **No live account:** sync was tested with synthetic accounts and a mocked client, never with a real learner login in production.
* Paper proof-reading of the paragraph statuses (above).
* Speech output depends on the browser's Swedish voice. Spoken practice is self-rated; nothing is recorded or analysed.
* The NP browser tests run in Chromium; WebKit/Firefox are not covered for this page.

## Rollback
Revert the squash commit. Old `notes` keys are untouched; the previous page reads them as before. The cloud rows written by v2 use a different `kind` and are ignored by the old page.

## 2026-11-18: no-file private auto-source (PR #47)

- **User outcome:** The owner does not upload JSON. An authenticated grade-9 learner opens a one-time private activation URL, and all subsequent devices retrieve the 27 source paragraphs, four worksheet questions, discussion prompt and learning aids using the SAME Study Cloud account. Existing notes, practice attempts, annotations and progress use the existing per-user `study_snapshots` flow.
- **Content location:** The exact supplied private v2.1 JSON is seeded as a single row in Supabase `public.np_private_school_source`, never in public GitHub/HTML/JS. `study/supabase/np_private_source_20261118.sql` versions structure only; no activation hash or source material is committed.
- **Access:** A 256-bit random, single-use secret in a private URL fragment is SHA-256 checked by `public.np_claim_school_source` for an authenticated non-anonymous `study_profiles.role='learner' AND grade='grade9'`. One successful claim permanently binds the source row to that user's UUID. The token is kept in per-tab sessionStorage until claim, then erased; history is rewritten to remove it. URL fragments are not sent to GitHub Pages. The source RLS exposes only `source_key, material, material_sha256` and only to the claiming learner. No anon privileges or write access; account passwords are never used as activation secrets.
- **Enrollment:** There were zero real grade-9 Study Cloud profiles at deployment. A real account must be created and signed in once; logging in as a different account from another device cannot magically transfer that user's material. The email provider's confirmation restrictions remain; this feature does not change Auth/SMTP settings or create users. The private activation link is shared directly with the owner, never stored in the repository.
- **Offline:** After first authenticated read, source and notes remain in local browser storage; if available the per-user snapshot serves other devices online. If a learner already worked as guest, log in on THAT original device once before moving to another device, so prior local answers sync. Clear browser data or use separate iOS home-screen app containers only after verifying cloud sync.
- **Testing:** `tests/np-auto-source-e2e.js` mocks two users, two device contexts, a one-time claim and protected fetch. Tests must reject second-user access and confirm that exact synthetic school questions and saved responses reappear on the next device without any manual file input. Existing 587+ NP checks remain. This is synthetic assurance, not a substitute for live account acceptance.
- **Source fidelity:** 18/27 paragraph statuses are photograph-verified; nine remain PHOTO_PARTIAL because original images are blurry. Neither RLS nor automatic delivery upgrades that evidence.
- **Rollback:** Revert PR #47 to restore manual private import; do NOT delete students' `study_snapshots`. Leave the private source table denied to non-owners (or revoke active grant in a separate authorized operation). The private source can be backed up by the owner if required.
