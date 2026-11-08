# Matte OS — navigation audit and implementation · 2026-11-08

## Evidence / prior state
Inspected current code on GitHub main `87238ee9ad43640e75c0a5f24d5cefa3fbcec7e8` and production desktop UI. Source-supported issues: mathematics homepage recommended card plus overlapping paths to learning, games, language and progress; only three bottom-nav tabs (Hem, Förstå, Träna); selected multiplication self-test below ten individual tables; lesson-focused header used X with no visible destination wording; language home featured both a large Swedish/English hero and duplicate subject tiles; language logo navigated away to Maths.

## Applied corrections
1. Maths home surfaces the existing next step and **four** short choices: Förstå matte, Träna matte, Öva multiplikation, Svenska och engelska. Cup remains a compact visible direct shortcut, while school/prov planning stays in the optional "Prov och planering" section.
2. Bottom nav provides direct Hem, Förstå, Träna, Tabeller and Språk. Active state for Tabellarenan is Tabeller; focused tests/lessons remain free of distracting bottom navigation.
3. Lesson exit is visibly labeled **Tillbaka**, maintaining the existing return destination. Existing formula support and learning steps retained. Minnesknep is above the chapter cards. Training has one-tap access to multi-table self-testing.
4. Tabellarenan places "Välj flera tabeller" immediately above the ten individual table cards. Existing 10/20/full question modes, full mixed challenge, duels, Cup and per-grade progress remain.
5. Language hub shows Svenska, Engelska and Studieteknik as first choices, retains "Träna tillsammans" and makes optional Startkoll accessible under "Fler sätt att öva". Its logo now returns to language home, and bottom navigation includes a direct Matte link.
6. Main and language PWA caches/updated assets bumped; no data migrations, backend/schema changes, score clearing or feature removals.

## Verification and limits
- Run existing full Maths/geometry/Tabellarenan/Cup/prov/language content and browser suites; new navigation E2E tests verify both grade routes, selected-table access, visible lesson back, Lärande/Maths return and mobile width on Chromium/WebKit/Firefox.
- Require all four mandatory PR CI jobs green on exact final HEAD before merge, followed by Pages deploy + live production checks.
- The live audit was desktop browser plus code; real pupils, physical iOS/Android, and improvement in learning outcomes are not verified. Confirm by asking each student to reach lesson, table self-test and language reading unaided.
- Revert PR for rollback; profiles and saved progress remain in current local storage.

## Core acceptance
From the Home page, a learner reaches Maths explanation, Maths practice, Tabellarenan or language in **one click**; selected-table setup is visible before ten individual table tiles; there is one clear, labeled way back from focus mode; no broken paths or unexpected data changes.
