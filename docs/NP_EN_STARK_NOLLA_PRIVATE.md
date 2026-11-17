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
