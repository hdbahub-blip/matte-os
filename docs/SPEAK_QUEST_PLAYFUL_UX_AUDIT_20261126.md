# Matte OS · Speak Quest – critical mobile UX & pedagogy audit

**Reviewed** 2026-11-26. **Source version:** PR #63 merge \`11b1097cbde65c5da4ccf5dbeb310c648d91a31a\`, English oral Speaking Lab 2.0. **Evidence:** owner's six iPhone Safari screenshots, actual source code and simulated browser journeys. **Scope:** English oral game and its English hub entry point; no new roles, products, credentials, Supabase writes or learner-record changes.

## 1. What the screenshots actually showed

- **An unnecessarily tall document**, not a game. The question, three-instruction row, three speaker modes, a full turn panel, two visually bulky four-part samples, a sentence-building launcher, five rescue cards, advanced settings and a footer were all stacked together. Mobile users must scroll repeatedly before reaching an actionable exercise.
- **Weak information hierarchy.** An option-heavy top screen puts "Själv/Två/Fyra" and controls next to the main objective. Each model is broken into four separate paragraphs with P/A/C/E labels, forcing rereading.
- **No playful interaction in the first viewport.** The first screen asks students to read and then tap "Klart" rather than to *do* a supported exercise. There is no visible short task-and-feedback loop.
- **A specific pedagogical hazard:** the former \`chosen\` array could combine a positive position with a negative reason/example from a contrasting exemplar. Technically the sentence-builder worked, but its output could be contradictory.
- **Generic help at the moment of need.** Some prompts described what to do without showing how to use the specific subject in the student's own oral answer.
- **Real strengths to preserve:** a verified bank of 49 original varied card topics, **98 topic-specific authored full replies**, optional teacher-like prompts, independent text-to-speech without recording, solo/pair/group, accessibility controls and separate offline cache.

## 2. Rebuilt experience

**Design rule: one question, one choice, one small feedback loop.** In "Speak Quest" the student sees an actual oral question straight away, without onboarding or account choices. Four short interactive steps are visible as P–A–C–E progress symbols:

1. **P – Position:** choose one of two genuine opening opinions for the actual card.
2. **A – Anledning:** recognise which authored reason continues the chosen opinion. Option order alternates per card/step/turn; reading matters, not remembering left or right.
3. **C – Concrete example:** connect a tangible situation with the same viewpoint.
4. **E – Engage:** select a follow-up that continues conversation. A short full response is constructed and read aloud optionally.

A mismatch explains **"Detta fortsätter den andra vinkeln..."** without punishment or ungrounded grade. The exercise tests *whether authored parts belong to the same storyline*, not real-world truth or oral language proficiency. A "Svara helt själv" path lets stronger or motivated students speak freely with zero mandatory game taps. **One button** advances to next partner or card. This prevents a false impression that a high score equals English national-test ability.

**Progressive disclosure:** Only the task and its two options are exposed by default. A single optional "Visa en ledtråd" shows compact *topic-specific* coaching for blank mind, boring topic, babbling or missing words. Another optional door reveals the existing two complete original answer examples, one at a time; all 98 remain available without forcing long initial reading. Modes, categories and day/night theme sit below one "Fler val" control.

**Visual rules:** restrained burgundy, navy, lavender and green; soft celebration only at the completed fourth step; one strong CTA at the base of the active game; 44px+ controls; light/dark mode; 320px and 390px phone layouts and 980px desktop two-column layout; reduced-motion support; no flashing, timers or forced leaderboard; clear back link to the original English hub. The new English hub link is labelled **"Speak Quest – spela och prata"**; other subjects, math/NP/Cup and parent/mentor flows are unaffected.

## 3. External design guidance (not effectiveness proof)

CAST's Universal Design for Learning Guidelines 3.0 support giving autonomy and meaningful choice, reducing distraction and threat, nurturing play, and offering timely action-oriented feedback:
- https://udlguidelines.cast.org/engagement/
- https://udlguidelines.cast.org/engagement/effort-persistence/feedback/
- https://udlguidelines.cast.org/engagement/interests-identities/biases-threats-distractions/

The chosen game uses these as **design principles**; this is not evidence that any specific child now learns more. School-led oral dialogue, pronunciation, actual language accuracy and performance require hearing/observing the person, which this no-recording app intentionally does not do.

## 4. Privacy, risk and operational release

- \`study_*\` records, student-mentor links, authentication, cookies, Supabase/RLS, payments, grades and logs are **untouched**.
- \`sessionStorage\` still holds the existing speaking deck, current topic and speaker only. Current in-page sentence choices and hints are **not stored**. No \`getUserMedia\`, transcription, microphone, or backend write.
- No confidential exam tasks are used. Cards are original practice, not claimed as official NP prompts or grades.
- All existing \`lara/speaking-lab-content.js\`, \`lara/speaking-lab-examples.js\` and \`lara/speaking-lab-core.js\` content remains. Legacy verbose UI assets remain in the repo for easy code rollback, but are not loaded by the current page.
- PWA cache changes only in the \`lara/\` service worker to \`matte-os-larande-5.5.0-speakquest\`, new \`speaking-play.css/js\`, and the English hub's versioned script.
- **Material limits:** visually inspected synthetic Chromium on 390px and automated 320/390/980 browser exercises; not a genuine pupil usability study, no physical iPhone VoiceOver, no human evaluated spontaneous conversation, and no validated learning outcome.

## 5. Acceptance checklist and rollback

Reproduce: \`node tests/speaking-lab-qa.js\`; \`node tests/speaking-lab-e2e.js http://127.0.0.1:8765/\`; \`node tests/language-studio-qa.js\`; all CI workflow jobs; independent private NP regression. Test a mismatched model piece *stays on the same step* with corrective feedback; matched pieces build a coherent full reply. Check optional free-speaking, both full examples, speaker handoff, category, dark mode and local reload. Inspect small phone screenshot at 390px; confirm the first real question and first two choices before the long optional content. Verify GitHub Pages deploy on **merge SHA** and the **public live route**.

**Rollback:** revert this frontend-only PR, let Pages redeploy. Do **not** clear pupil accounts, \`study_*\` tables, snapshots or learner progress. Verify the old Speaking Lab can still launch after cache renewal.
