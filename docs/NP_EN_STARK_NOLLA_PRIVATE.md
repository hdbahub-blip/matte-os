# En stark nolla — privat muntlig NP-träning (draft)
Created 2026-11-17, app basis main 824daf1dc29ceed6199249d8a11082e7a2f97c17.
## Scope
- New static front-end lara/np-muntligt.html, linked only from Svenska in lara/app.js.
- The public repository includes NO book text, school photo text, school questions, student notes, user credentials or password.
- User-imported .json stays in browser localStorage on the device (grade9 namespace).
- Eight parts: read, understand, questions, present, lead, join, practice, review. Notes save locally and export as a JSON backup.
- Source content is supplied separately by the owner, from their uploaded novel EPUB and photos.
- **Important:** the EPUB chapter does NOT exactly equal the edited school handout. The imported JSON says so plainly. Original photograph wording overrides where visible; never claim perfect school-source fidelity without another photo comparison.
- No new account role, schema, RLS, OAuth, login, cloud sync, deployment or public publication.
## Account decision
Current Matte OS Study Cloud already supports signed-in learner accounts. Do not request pupils' Gmail passwords. Google sign-in via Supabase OAuth is a possible later separate auth/config project after explicit owner approval.
## Manual acceptance
1. Start local web server; open lara/#/sv and confirm training link; open NP page.
2. Check module is empty before import. Import the owner's private JSON. Confirm 4 original study questions plus 1 original discussion question.
3. Inspect phone layout, day/night, keyboard and screen reader labels, and test all 8 sections.
4. Type answer, reload, verify it persists; export notes; verify backup.
5. Confirm no chapter text, personal answer or account secret in remote HTML/JS, page source, network requests, or service worker cache.
6. Confirm maths, old Språkverkstad items, Åk8 state and cloud sync remain unchanged.
7. Compare all visible phrases to the original school worksheet, photograph by photograph; unresolved phrases remain marked.
8. Merge and deploy only with explicit owner release approval, backed by CI and physical device review.
## Rollback
Close PR with no merge. If merged in the future, revert the two UI commits; no database changes or data migration is required.
## Static QA
node tests/np-private-qa.js

## 2026-11-18 repair: dark contrast and cross-device persistence

- Dark unselected tabs no longer inherit near-black text on dark backgrounds. Browser QA verifies WCAG AA text contrast (>=4.5:1) in both modes.
- Private school text, answers, checklists and note timestamps persist locally, then sync only under a verified signed-in `grade9` learner profile.
- Synced data is written into the existing RLS-protected `study_snapshots` table using `module='reading'` with a separate, locally generated `device_id` and payload `kind='matteos-private-np-1'`. There is **no schema/RLS/auth provider migration**; original Workshop reading snapshots are never overwritten.
- Existing access policies allow the learner and any *approved, linked mentor* to read their grade-owned snapshots. The data are **not end-to-end encrypted**. Do not suggest that a secret URL alone controls access.
- The content is not embedded in publicly served HTML/JS. It is imported once on an authenticated learner device; after a confirmed sync, the same user can sign in on another device to retrieve it. Without a learner account, it remains local-only.
- First-time sign-in migrates legacy guest import and notes into account-scoped local keys. Migration aborts without erasing guest state if local persistence fails. A selected account with saved auth context can display the locally cached content while offline.
- Per-field timestamps prevent stale unrelated answers from overwriting newer fields after two-device edits. Explicit clear uses timestamped tombstones; explicit backup restore gives restored fields current timestamps.
- A private JSON backup now includes both text and responses; an existing older notes-only export can also be restored. Treat backups as sensitive, and never upload them to a public issue.
- Test in `tests/np-cloud-e2e.js` uses two synthetic isolated browser contexts and a mocked Supabase client: cloud save/recovery, merge, isolation, dark/light contrast. Run with Playwright. `tests/np-private-e2e.js` continues checking local functionality.
- No real learner profile was created during implementation. Actual family account onboarding and production end-to-end verification require owner-set credentials and normal login; these cannot be inferred or simulated.

Rollback: revert the NP page + cloud helper and associated workflow/test changes. No DB migration, secret, RLS or auth change was made.
