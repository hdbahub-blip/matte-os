# Matte OS — student-first UX and mentor continuity audit
Date: 2026-11-22. Baseline main: `4a391ab9b282dfc57a7b9d93277f9077aa375b0d`.

## Observed and directly verified
- Existing Supabase project: **two learner profiles, one mentor profile, two mentor links spanning both grades and one mentor**, 9 snapshots, 0 study events (read-only aggregate SQL; no identity or answers read).
- Previous study account UI exposed sync, recovery, invite and approval controls as primary student actions even though both current profiles were already linked.
- After password sign-in, the account UI did **not** reload `S.links()`, so a connected learner could be shown an incorrect invite/approval state until a reload.
- Parent cloud view already polls for changes and supports linked-grade reports. Manual "refresh" and "manage links" buttons were distracting, not prerequisites for the two existing links.
- Mobile read-only screenshot confirmed excess first-use account text, a hard-to-read pale brand and learning landing duplication.
- Main branch previously had no required status checks; release gate remains a governance item.

## Bounded implementation
- Student account home now presents four immediate actions (Math, Swedish, English, Games); existing linked students have no invitation or manual sync step.
- On successful sign-in, verified links are reloaded and the owned local workspace is queued for background sync; signed-in learners return to the learning app.
- Recovery, mentor-sharing information, revocation and new-student consent remain available in a collapsed help section; no consent rules or RLS permissions were weakened.
- Mentor account shows the two linked grades without requiring new invites or manual refresh. Adding **future** learners remains in an advanced panel.
- Parent cloud panel removed its manual refresh/link controls. Its existing background 20s refresh remains intact.
- Shared visual styles: readable brand, consistent ink/accents, simpler 2-column learning tiles, restrained surfaces and WCAG-inspired focus/reduced-motion controls.
- PWA cache and linked stylesheet versions rotated. No database, auth, storage schema, RLS, existing account or real answer mutation.

## Acceptance evidence
- New synthetic Chromium account test: 27/27 across linked Grade 8, linked Grade 9, unlinked future learner and mentor, with narrow 320/390px mobile widths, no horizontal overflow and no student-facing sync/link requests.
- Static regressions: Study Login 14/14; Fullspec 17/17; Lärande 313 checks; Parent 49/49; language bank 759/759; Study Cloud 17/17; workspace guard 20/20; color QA 58/58. Mathematics engine 9,410 validations also passed.
- GitHub CI and Pages acceptance on final PR SHA must still pass before production claims.

## Limits and remaining gates
- No real learner passwords or records were used; production authenticated post-merge journeys on both actual pupil devices and the mentor account are NOT verified.
- The 9 snapshots are not equivalent to 9 submitted questions. Zero study events does not prove a data-loss bug; confirm with a deliberately submitted synthetic question in an authorized test account.
- Physical iPhone/VoiceOver, UX preference and educational retention studies remain unverified.
- The parent area's separate local PIN is a protective device-local feature and was not removed. Mentor cloud views remain authorization-gated.
- Public Cup RPC security and default-branch protection require a separate focused gate; no changes made to either in this patch.

## Rollback
Revert this PR and redeploy Pages. Keep Supabase profiles, links, snapshots, events, localStorage and IndexedDB intact. Do not delete or reset existing pupil results.

## Sources
Repository PR #56 and latest main, live screenshot, source files `study/setup.js`, `study/cloud.js`, `foralder/cloud-parent.js`, read-only Supabase metadata, synthetic Playwright regression.
Design controls: W3C WCAG 2.2 https://www.w3.org/TR/WCAG22/ ; CAST UDL 3.0 https://udlguidelines.cast.org/ .
