# MYPA Current State

Last updated: 2026-09-12
Review status: MASTER PROMPT DEVELOPMENT IN PROGRESS

## Canonical ownership

This root file is the canonical repository-wide current-state document. `apps/backend/docs/05_CURRENT_STATE.md` is a compatibility pointer and must not contain a competing project-state snapshot.

## Repository state

- Repository: `Ramin-rezaie-nazari/my-personal-assistant`
- Working branch: `audit/project-brain-2026-09-11`
- Current branch head: `783eba290e4ec67bb4087ad1854b2faf1f89bc22`
- Validation PR: #70 (validation-only; do not merge automatically)
- Base: `main`

## Appendix/remediation status

The canonical Appendix finding set is reconciled through PB-257. Recoverable concrete findings have been remediated/reclassified and the historical PB-001..PB-155 limitation is explicitly preserved without fabricated text. Master Prompt product findings PB-258 through PB-260 are also tracked there with source-level remediation status; fresh CI verification is required for the latest HEAD after the newest module and shopping changes.

## Master Prompt development progress

`MASTER-0001` baseline reconciliation: COMPLETE.

`MASTER-0002` deterministic local Brain context: VERIFIED BY CI.

`MASTER-0003` recipe/ingredient safety-taxonomy contract: VERIFIED BY CI.

`MASTER-0004` Nutrition/Food → Pantry/Inventory → Shopping → Budget: IN PROGRESS.

Completed in MASTER-0004 so far:
- `ShoppingIntelligenceService` now delegates to canonical user-scoped `ShoppingService.smartList()` and `listBasket()` instead of returning placeholder output;
- `GET /shopping-intelligence` is JWT protected and derives the user id from the authenticated request;
- direct Shopping Intelligence service/controller tests were added;
- shopping/budget quote handling now preserves an explicit budget currency and hides incompatible quote values;
- Smart Purchase Basket applies the remaining budget sequentially and only committed `buy_now` choices consume budget;
- Inventory intelligence was moved into the Inventory domain and exported once;
- the real Inventory ↔ Shopping Intelligence circular module dependency was removed;
- compatibility re-export remains for legacy imports while canonical tests now target the Inventory-owned primitive.

## Validation evidence

Latest completed safety-taxonomy validation remains green:
- Backend CI `34686577253`: SUCCESS — dependency installation, Prisma validation/generation, migrations/idempotence, food-intelligence self-test, backend build, unit tests and API E2E.
- Mobile CI `34686577182`: SUCCESS — dependency installation, typecheck, source tests, committed Jest specs, Expo validation and Android JS bundle.

Fresh CI is queued/running for later MASTER-0004 changes and must not be treated as green until the corresponding current HEAD completes successfully.

## Current architectural boundary

The Brain can pass structured nutrition constraints into the Food Operating Loop, and recipe safety can enforce the supported canonical ingredient semantics with fail-closed unknowns.

Shopping Intelligence now orchestrates canonical Shopping/Inventory behavior rather than maintaining a parallel user-data implementation. Money calculations are currency-safe and do not implicitly convert prices without a fresh-rate contract.

A verified FoodItem→PriceTrackedProduct mapping does not yet exist. Recipe-cost budgeting therefore remains incomplete; fuzzy matching is explicitly forbidden for monetary estimates.

## Next workstream

`MASTER-0004` continues with an explicit persisted FoodItem→PriceTrackedProduct mapping contract, followed by recipe missing-ingredient costing, deterministic budget planning, shopping generation, and the corresponding mobile user journey with loading/empty/error/offline states.

## Environment boundary

The local container cannot clone the repository because direct GitHub network access is unavailable. GitHub connector evidence is used for repository inspection and CI state. Production/deployed DB/RLS/storage configuration, physical-device UX, push delivery, external provider quotas and store-release validation are not claimed verified.
