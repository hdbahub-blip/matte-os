# Matte OS · Platform-wide learner experience audit & release QA

**Date** 2026-11-26 · **Baseline** \`f3a6169e63473595193218ab07d7e56893feefa1\` (PR #64). **Source** current GitHub project files, original owner-supplied 390px iPhone screenshots, 24 actual public route variants × 2 desktop/mobile visits (48), original curriculum content/tests and synthetic logged-out browser flows. **Status:** implemented frontend release candidate; deploy and live tests must be confirmed from CI and real GitHub Pages commit. **No production data or schema writes.**

## Mission & ownership

Aim: *keep academically appropriate 8th/9th-grade content while making the interface obvious to a child*: what am I doing now, what happens when I tap, what did I learn, where do I go next? All English-course instructional language should be English, with English accessibility semantics, without contaminating Swedish, Maths, login, account or mentor areas.

The user did not request new student accounts, roles, data collection, badges for grades, penalties, timers or leaderboards. Those would distract from learning and expand product/authority surface without evidence. **Games in this release are short voluntary practice, not diagnostic judgments or exam grades.** No storage writes in redesigned language interfaces; existing School/Study Cloud accounts and local study histories are preserved.

## Routes inspected, 390 px and 1000 px

| Area | Inspected variants | Findings and work |
|---|---|---|
| Landing, maths, access | root, legacy tabell, study login, parent overview, maths exam | Preserve existing compact start and account separation; unify keyboard-focus/touch conventions only, no auth/storage writes |
| Learning landing & Swedish | learning home, Swedish Studio, Swedish NP speaking | Preserve Swedish labels; compact Studio's first action, 2-column skill grid, hide secondary options behind an explicit disclosure |
| English learning | English Studio, Quick five, Match it, Put in order, Talk cards | **Verified defect:** English Studio included “Årskurs 9,” a Swedish featured CTA and Swedish footer. Now English language semantics from chrome through skills, game labels and grade |
| English speaking | Speak Quest and short guide | **Verified defect:** practically all help, steps, configuration and game feedback were Swedish. Full original visible UI rewritten in English, with all 49 cards and 98 concrete English examples retained |
| Other language games | English and Swedish debate | English debate sets \`html lang=en\`, labels Swedish-language option “Swedish,” Swedish debate remains Swedish |
| Group practice | Together, Together Live, study-together | **Verified defect:** selecting English changed only question content; buttons still “Lämna mitt svar” and other Swedish. A selective no-write UI translation is now applied in Together's home, solo round and group setup. Explicitly preserve Swedish on subject switch |
| Other subjects and study helpers | study tips, posters, updater and legacy routes | Public shells get shared focus/readability/small target design. Not redesigned at the pedagogical lesson level this release |

Technical inventory: 15 distinct public HTML document shells and 24 meaningfully distinct page/route variants, each observed on mobile 390px and desktop 1000px, total 48 initial observational visits. The inventory includes authenticated destinations as logged-out states only. Some routes have far more nested interactions than a one-visit audit can certify: this distinction is important.

## Highest-impact defects and independently discovered fixes

**P0 — Locale inconsistency.** The same English lesson had Swedish visible labels, Swedish screen reader language attributes, and Swedish parent-level navigation. Fixed at source in \`lara/language-studio.js\`, standalone \`lara/speaking-play.js\`, \`lara/app.js\` shared chrome, \`lara/debatt-app.js\`, and \`tillsammans/english-context.js\`. English labels and document \`lang=en\` are linked to active subject, not a new account-level language preference. Switching back to Swedish restores \`lang=sv\`.

**P1 — Too much navigation before play.** Four primary language minigames linked to a solo-vs-pair wizard before the actual game. Short, clear single-player links now open the activity directly. Pair remains available via the existing routes and a discreet *Play with a friend?* disclosure. English and Swedish hubs show two-column compact study tiles, and preserve all 6 Swedish/7 English curriculum strands, 39 language modules and all existing games. Three secondary/extra learning links now live behind *More ways to practise*; they are still accessible in one tap if wanted.

**P1 — Contradictory activity for a solo pupil.** 12 English talk prompts implicitly required a partner, text-swap or group when the child had actually selected solo. Added specific alternative prompts for actual solo use, preserving group/pair prompts in their own modes. Example: \`en-revise\` now asks the learner to read their own paragraph, improve one specific sentence and explain how; it no longer asks them to swap paragraphs with a missing partner.

**P1 — Cross-surface focus and reading effort.** Added intentionally modest \`css/unified-student-ui.css\` to 15 HTML shells: 44px minimum interactive controls, consistent keyboard focus, motion-reduction, forced-colours, clear text wrapping and mobile touch ergonomics. This does **not** make every existing page visually uniform; special exam/parent/login views keep their own visual identity and status.

**P1 — Offline regression risk.** The earlier search/replace of the learning offline \`index.html\` entry polluted the navigation-key expression (syntactically valid but wrong cache key). Caught by source inspection and corrected **before release**. Root and learning offline caches now versioned and reference new JS, Studio CSS and shared CSS. \`tillsammans\` English translation is offline-pre-cached by root worker. Isolated \`/prov/\` and \`/lara/\` service workers remain independently scoped.

**P2 — A11y semantics and dark mode.** \`html.lang\` is set to \`en\` for current English route, \`sv\` after switching; optional TTS/VoiceOver sees correct language. The new shared stylesheet has \`:focus-visible\`, disabled-target semantics, \`prefers-reduced-motion\` and forced-colour support. Actual physical iPhone Safari and VoiceOver are *not* yet tested.

## Psychological and instructional design

Use **agency without cognitive overload**: show one current task, provide a concrete answer/model only on request, and let students start a mini-game with one fewer tap. Respond to mistakes with a specific explanation, not a grade. Preserve a safe solo option and actual spoken practice; no automatic speaking score can assess real pronunciation or interaction without capturing/hearing the speaker. Do not equate time in app, points, number of taps or attractive gradients with improved learning.

Supporting design guidance for consideration, not claimed validation:
- CAST UDL 3.0 engagement / autonomy / play: https://udlguidelines.cast.org/engagement/
- CAST action-oriented feedback: https://udlguidelines.cast.org/engagement/effort-persistence/feedback/
- Nielsen Norman Group progressive disclosure: https://www.nngroup.com/articles/progressive-disclosure/
- Nielsen Norman Group UX research for teens: https://www.nngroup.com/articles/usability-of-websites-for-teenagers/

## Verification gates

1. **Static + safety**: \`node tests/platform-ux-qa.js\` checks all 15 public entrypoints, locale, explicit original prompts, 3 service worker caches, English Together, and no new private writes. Other existing suites must pass: maths, Swedish, English content, private NP, parent, account, Cup, Together, cross-browser and learning.
2. **Actual UI**: \`node tests/platform-ux-e2e.js http://127.0.0.1:8765/\` visits 24 route variants at 320px, 390px and 980px, checks no horizontal overflow/JS errors, English vs Swedish semantics, main quest direct launch, four minigames and short studio, actual Together solo game and locale switching. The Speak Quest-specific E2E validates game steps, models, correction, speaker handoff, return, dark mode and link guide.
3. **Production**: require five normal GitHub quality jobs + private NP job green on exact PR HEAD SHA, then merge and successful GitHub Pages deploy on exact merge SHA, then live HTTP and synthetic browsing checks. Preserve account and local progress, do not clear storage or reassign mentors to “repair” UI.

## Guardrails, residual issues, falsification & rollback

**Do not claim:** every mathematically distinct answer or every reading passage was rewritten, all individual buttons across signed-in content tested, a genuine teen usability study completed, physical iPhone Safari/VoiceOver signed off, professional academic/psychological effectiveness measured, or a full redesign of the mentor/administrator dashboard. This work concentrates on the cross-app interface and the English/student flows while protecting other functional surfaces; deeper education content and backend merit separate targeted audits, not a blanket unverified “100 years best” claim.

**Falsifiable pupil test:** On an actual iPhone, ask each learner to (a) open English, (b) start one mini-game, (c) finish a short round and start another, (d) return to English and pick another skill, (e) choose Swedish and make sure language changes. Observe without guiding them: if any step requires more than one unexplained navigation decision or a language mismatch appears, the UX gate **fails**, even if CI is green. For the mentor, read-only inspect current links and snapshots separately; no new “connect/approve/sync” obligation for pupils should be introduced.

**Rollback:** revert this frontend-only PR and Pages redeploy. Do **not** delete \`study_*\` records, student accounts, snapshots, local progress or mentor mappings. Confirm previous SW caches are upgraded via existing \`uppdatera.html\` flow; don't ask children to clear their data.
