# MYPA Autonomous Task Queue

Generated from a source-of-truth audit against `main` on 2026-09-05.

## P0 — Release/Crash blocker

### Voice native crash
- Current evidence: some local Persian voices work while others crash the Android process with native SIGABRT / destroyed pthread mutex.
- Required: root-cause isolation, native lifecycle/thread/resource audit, fix, physical-device retest, regression matrix for all voices.
- Do not mark voice stable until device evidence is green.

## P1 — Source-of-truth / architecture drift

### Recommendation Intelligence drift
`apps/backend/docs/05_CURRENT_STATE.md` describes a wired Recommendation Intelligence / Food Decision Brain, but `main` currently contains a stub `RecommendationEngineService`, stub `PersonalizationService`, an empty Recommendation controller, and `AppModule` does not import `RecommendationIntelligenceModule`.

Required decision:
1. Either integrate a real implementation through the existing canonical `FoodOperatingLoopService`, or
2. remove/retire the stale scaffold and update current-state documentation.

Do not duplicate the existing deterministic recipe recommendation logic without a deliberate architecture decision.

## P1 — Global market integration

- Global Market / Price Intelligence work exists on stacked PRs and is not on `main`.
- PR #48 has documented merge conflicts.
- Integrate only after dependency and regression review.

## P1 — Data / food intelligence

- canonical ingredient taxonomy
- region/cuisine normalization
- verified recipe corpus
- provenance/versioning
- allergens/dietary coverage

## P2 — Mobile product

- production auth UX
- onboarding
- home/dashboard
- nutrition journey
- recipe/cooking flow
- pantry/inventory
- shopping
- fitness stack
- habits/reminders/calendar/supplements
- Brain chat/coach
- global settings
- offline/local-first behavior
- accessibility/responsive polish
- physical-device validation

## P2 — Gender-aware theme

Implement persistent female visual theme after gender selection without forking business logic. Validate both default/male and female flows on physical devices.

## P1 — Production hardening

- authorization/RLS audit
- rate limits/abuse controls
- observability
- realistic database/performance testing
- background job reliability
- notifications reliability
- backup/restore
- disaster recovery
- privacy/data retention
- migration discipline
- deployment runbook
- cost/fallback policy

## P3 — Business / monetization

Implement only after core user journey is strong and release-ready.

## Agent rule

At each session read `apps/backend/docs/05_CURRENT_STATE.md` first, reconcile it against code, then choose the highest-priority unblocked item. Evidence beats status text.