# Matte OS — FULLSPEC UX + Reliability release, 2026-11-09

## Owner intent
Keep the existing grade 8 / grade 9 learning product and all accumulated progress. Premium, calm, easy-to-find navigation in both day/night modes. Grade 9 burgundy; grade 8 navy and lavender. Reduce navigation friction without a new account, new app or cloud sync.

## Scope and code changes
- Root PWA cache cleanup excludes the distinct Learning cache so offline learning survives a root update.
- Maths export now includes Minnesknep status; old maths backup imports remain supported, with a confirmation before replacing data.
- Save failures surface an accessible, persistent warning.
- Learning navigation has five visible columns for five choices, current subject remains marked through deep routes, and the selected grade follows Maths.
- Maths, Learning and multiplication share calm day/night grade palettes and legible active states; reduced motion is respected.
- Prov has its own day/night control, returns directly to Maths, filters the displayed result history by grade, and aligns its shared maths JS resources to the current core while retaining an isolated SW scope.
- No student identifiers, results, user accounts, new backend migrations, RLS changes or server writes.

## Verification
- CI unit/content, emulated mobile, cross-engine and Cup backend all required before merge.
- NEW: tests/fullspec-release-qa.js for cache isolation, profiles, backup, theme, versions.
- NEW: tests/fullspec-release-e2e.js for 320px mobile navigation across Maths, Learning and Prov, both grades, deep reading route, day/night persistence and 5-column bottom nav.
- Verify Pages deploy and real public metadata only after merge.
- Physical Safari iPhone, full lesson/prov submission, teacher validation, 10-device Cup and user comprehension remain independent acceptance gates.

## Risk/rollback
Main must not change until green CI. Revert the FULLSPEC PR, keep localStorage and IndexedDB data untouched, and verify the Pages deployment and both SW cache namespaces. A historical backup import replaces local maths/Learning state only after clear user confirmation. Prov history remains separate. No auto sync or collection of minor's raw responses.

## Versions
- Main shell / CSS: 5.5.9, curriculum core: 5.5.6.
- Learning asset bundle: 3.1.1, workshop data-engine format remains 3.0.0 / store v3.
- Prov release: 1.2.5, shared maths asset pin 5.5.6.
