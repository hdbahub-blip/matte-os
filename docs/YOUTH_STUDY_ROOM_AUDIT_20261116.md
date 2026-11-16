# Matte OS — Independent youth study-room audit + v2 release
**Audit date:** 2026-11-16 · **Repository:** hdbahub-blip/matte-os  
**Source of truth:** actual current main tree, linked to this PR's tested SHA.  
**Scope:** navigation, tone, study psychology, drop-in Jokers, local vs separate phones, accessible visual identity, privacy, offline, regression and operations.
**Status:** candidate; production claims require CI readback + exact Pages deployment receipt.

## 1. Mission and conclusion

The value proposition is not "access five independent apps"; it is **"open your study room, choose something interesting and begin"**.

The previous iteration of PR #39 improved the root, but seven conceptual fractures remained:
- Selecting a year-group in Math did not automatically carry that grade into the Together invitation; root forwarded only \`?start=group\`.
- Together selected persistent Jokers by default and offered no disposable visitor at the point of play. A casual friend had to become an editable, backed-up profile.
- On a different phone, reading links opened the same text but offered no immediate no-save question flow.
- The authored reading workshop forced solo attempts onto a school grade; a visiting Joker could not answer without writing into grade progress and potentially Study Cloud capture.
- Lärande used another profile chooser; a Joker card linked to a permanent account-like local profile. There was no one-tap disposable guest.
- Differently styled primary actions, some ambiguous glyphs, and dense information made the system look like separate products.
- Youth experience lacked a clear bridge between agency ("what do I want?"), pedagogical structure ("how does this help?") and a low-pressure exit. More flashy badges or forced streaks would not solve this.

**Decision:** preserve the educational engines, account security and content; change the *participation model* and make the interface more coherent. No new role system, app or commercial product has been introduced.

## 2. Current routes and operational audit

| Area | Entry/controls | Main risk | Release intervention |
|---|---|---|---|
| \`/\`, \`#/formler\`, \`#/trana\` | Root grade 8/9, five-question practice, explanations | Group opened without a meaningful default grade; many parallel options | Carry active grade as an explicit safe query ID; first group screen suggests that grade plus a Joker; keep key school continuation prominent |
| \`#/k\`, \`#/l\`, \`#/run\`, \`#/prov\` | Chapters, guided math, independent test and exam | Permanent learning progress exposed to guest-mixing | School engine and scoring untouched; visitors use a separate practice bank or reading guest mode |
| \`#/knep\`, \`#/tabell\` | Retrieval practice, multiplication, table arena | Hidden reviews or unequal subject discoverability | Repetition due reminder and original activities remain present; no rewriting their evidence model |
| \`#/cup\`, \`cup/*\` | Accountless network multiplayer and nicknames | Could be mistaken for general-purpose synchronous classroom | Clearly labelled "Cup" for separate-phone multiplication competition; preserve backend rate limits, short-lived rooms and auth boundaries |
| \`/lara\` | Swedish, English, study skills | Different profiles and ungrounded storage claims | Same grade/Joker/parent visual language; explicit disposable Joker entry |
| \`/lara/#/verkstad/{lang}/{id}\` | Real-authored passages, evidence, ordering, cloze, open answers, hints, pair/listening | Guest attempts were recorded as grade-level evidence and cloud capture | New **Guest / Joker** mode, memory-only results, exactly same deterministic tasks and a shareable accountless visitor URL |
| \`/tillsammans\` | Five topic banks, local solo, same-device secret-turn multiplayer | Permanent local profile needed for each player | Disposable guest inline with the participant list; session in tab-scoped sessionStorage if any disposable guest is present; remove on completion |
| \`/tillsammans/?text=...\` | Public original text | Separate-device users could only read, not easily answer | Direct link into the identical authored workshop questions, with \`guest=1\`; answer sharing remains manual |
| \`/tillsammans/live.html\` | Private cross-device secure authenticated rooms | Anonymous access could bypass strict membership and child protection | Do **not** disable \`auth.is_anonymous=false\`; current auth-only security remains intact |
| \`/study\`, \`/studera\` | Auth, mentors, tracked sessions | Visitors directed into account creation | Preserve separate logged-in path; no copying visitor answers into linked pupil accounts |
| \`/foralder\` | Parent oversight, PIN, imports/exports | Mixed spectator and grade history | Leave read-only model, PIN and backup contracts intact |
| \`/prov\`, \`/tabell\`, old direct links | Legacy paths and standalone activities | Dead-ends after home redesign | Keep old routes, deep links, tests and offline acceptance; no deleting instructional content |
| PWA/offline | Root and Lärande service workers | Old UI/JS active when guest mode is released | Explicit independent version bumps and shared CSS/model cache allowlist; release QA and rollback gates |

## 3. Exact user journeys

### A. Grade pupil starts solo
Open saved grade → "Kör själv" → five math problems; "Fortsätt" remains visible if a lesson was interrupted. Independent evidence stays in \`matteos.v5\`.

### B. Pupil brings a friend to the same phone
"Med kompis" → current grade and one existing Joker preselected → optionally add a **one-time Joker** directly by nickname → "Starta fem frågor". Round privacy stays: private handoff and no answer reveal before everyone submits. The temporary identity and answers live only in **tab-scoped sessionStorage**, are removed when the session ends, and never enter grade / learning / Supabase records. Existing permanent Joker backups are unchanged.

### C. A visitor wants to read and answer on their own phone
Open a Swedish/English original passage → "Dela gästlänk" → friend opens \`?guest=1#/verkstad/sv|en/<authored-id>\` → same source text, deterministic questions and option order → feedback without a saved response or account. Multiple phones can participate independently and compare verbally. **This is not synchronised realtime joint scoring**.

### D. Visitor chooses an immediate no-save profile
Profile chooser → "Hoppa in som Joker" → local Together start, without making a long-term profile. Friend can select Swedish, English, Study, Maths or multiplication, or join a same-phone group.

### E. Cross-device competition or private study
- Cup: accountless networked maths rooms, pseudonyms, scoped contest data.
- General reading: shared exact question link, no realtime state.
- Secure Live / mentor pass: authenticated users only; do not fake no-account server access.

## 4. Pedagogical design / teen experience

We recommend learning effects be pursued through **retrieval, spacing, scaffolds, explanations, choice and reflection**, not manipulative rewards:
- Keep feedback *after* a genuine answer; avoid showing correct answers before a partner turn.
- Keep hints non-punitive but separate attempts "with support" from independent mastery.
- Preserve saved lessons and spaced-review reminders visibly when relevant.
- Use a small invitation ("five questions") instead of an overwhelming course configuration.
- Offer meaningful autonomy: subject, solo/group, optional listening and explicit end.
- Celebrate effort/strategy and errors as information. Do not falsely certify mastery from a single guest pass.

Scientific references: EEF *Metacognition and Self-Regulated Learning*, second edition (2025) https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/Metacognition ; Dunlosky et al. (2013) *Improving Students' Learning with Effective Learning Techniques*, https://doi.org/10.1177/1529100612453266 . These justify broad principles; actual usability and educational effects **must be measured**, not asserted from a UI deploy.

Visual direction: editorial typography, purposeful complementary burgundy/indigo, mint/teal and plum/amber accents, 44+ px minimum main tap surfaces, dark mode, strong keyboard focus, restrained animation and \`prefers-reduced-motion\`. Avoid excessive emoji, competitive pressure, compulsory streaks and animations that obscure reading.

## 5. Privacy and threat model

**Protected:** \`matteos.v5\`, \`matteos.larande.v1\`, workshop \`matteos.sprak.v3\`, all Study Cloud/Live identities, parent exports, Cup security constraints.

**Ephemeral guests:** no record in \`matteos.guests.v1\`; no workshop \`recordTask\`, \`markText\` or \`MO_STUDY.capture\`; the transient group uses a tab-only store and does not write localStorage. A guest URL carries **content ID, not a name, token, address or answer**. Clear \`?dropin=1\` on initial entry to avoid repeated creation on reload. Guest answers may exist in memory during an active page and transient tab session during group pass: "no saving" means no durable history/cloud records, **not** that the active browser has zero temporary bytes. A browser's session restore may retain sessionStorage until the tab is finally discarded; explain this accurately, never promise forensic deletion.

**Known gates:** Real synchronised guest rooms for all subjects would need a separate server-side authorization/privacy/rate-limit/retention implementation and multi-device security review. Current authenticated Live may **not** be opened to anonymous users merely for convenience. The current shared-link approach does not imply realtime score sync.

## 6. Red-team, failure modes and rollback

- **Save leakage test:** guest answer then verify exact strings of all academic and guest localStorage entries unchanged and no Study Cloud capture.
- **Two-device parity:** independently open one exact guest link in Chromium and WebKit; verify task/option order and no authenticated account requirement.
- **Same-phone guests:** add one-time nickname, answer with a real grade participant, check that only sessionStorage holds transient IDs and that end clears it.
- **Long-lived profile safety:** permanent Jokers, existing backups, school results, stored lesson continuation and old deep links unchanged.
- **QA:** unit+content, live RLS Postgres, Cup Postgres+browser, mobile/upgrade, cross-engine. 5/5 green on exact SHA required before merge; verify Pages build/deploy SHA equals resulting main commit.
- **Rollback:** revert only the release commit; no schema/Auth changes were made. Old builds ignore the new tab-scoped \`matteos.together.dropins.tab.v1\` key and do not overwrite grade records. If a session is in progress, reverting UI may invalidate the short-lived session, but grade progress is unaffected.

## 7. Reality and measurement gates

[FA] Lower click counts and attractive color harmony should reduce friction for this audience, but there is not yet an empirical teen usability study. Test with two consenting users using *synthetic examples*: (1) start solo under 2 taps after grade selection, (2) invite a no-save Joker in one flow, (3) share a text to another phone and answer the first question without setup, (4) finish/restart without losing school progress, (5) locate accessibility controls and backup. Capture **counts** (taps, dead ends, errors), not personal reading answers. Hypothesis falsified if users cannot choose the correct path unaided.

**VERIFIERAT** — only fill after final GitHub CI, exact-commit merge and Pages deployment.  
**UTTRYCKLIGEN BEGRÄNSAT** — no real-teen observational study, physical VoiceOver/Safari proof or anonymous synchronized multi-subject realtime room was conducted. User account creation remains deferred.
