# MYPA Current State

Last updated: 2026-09-12
Review status: MASTER PROMPT DEVELOPMENT IN PROGRESS

## Canonical ownership

This root file is the canonical repository-wide current-state document. `apps/backend/docs/05_CURRENT_STATE.md` is a compatibility pointer and must not contain a competing project-state snapshot.

## Repository state

- Repository: `Ramin-rezaie-nazari/my-personal-assistant`
- Working branch: `audit/project-brain-2026-09-11`
- Current code tree verified by CI: `c493e3fb470f391d3b21cad28788046a57f5e570`
- Validation PR: #70 (validation-only; do not merge automatically)
- Base: `main`

## Appendix/remediation status

The canonical Appendix finding set is reconciled through PB-267. Recoverable concrete findings have been remediated/reclassified and the historical PB-001..PB-155 limitation is explicitly preserved without fabricated text. Master Prompt product findings are tracked in the same Appendix beginning at PB-258.

## Master Prompt development progress

`MASTER-0001` baseline reconciliation: COMPLETE.

`MASTER-0002` deterministic local Brain context: VERIFIED BY CI.

`MASTER-0003` recipe/ingredient safety-taxonomy contract: VERIFIED BY CI.

`MASTER-0004` Nutrition/Food → Pantry/Inventory → Shopping → Budget: BACKEND + MOBILE CORE SLICE VERIFIED BY CI; FULL VERTICAL IN PROGRESS.

Completed and verified in MASTER-0004:
- Shopping Intelligence delegates to canonical user-scoped ShoppingService and is JWT protected;
- shopping budget calculations enforce explicit currency compatibility, sequential remaining-budget accounting, and committed `buy_now` cost semantics;
- Inventory intelligence is owned by Inventory, removing the real module cycle;
- deterministic `PriceProductKeyService` mapping aligns price persistence and budget estimation without fuzzy money matching;
- `BudgetIntelligenceService` supports deterministic arbitrary recipe-item quotes with exact currency/unit compatibility, seven-day freshness and price provenance;
- budget states distinguish `within_budget`, `over_budget`, `partial_price_evidence`, and `insufficient_price_data`;
- the Food Operating Loop uses the canonical recipe scaling contract, derives scaled missing quantities, prices them through Budget, and inserts only verified `priced` items into canonical ShoppingService;
- authenticated recipe budget and budget-qualified shopping endpoints are covered by controller/API contracts;
- Mobile has an authenticated Recipe Budget journey with servings/budget/currency inputs, verified-vs-blocked price presentation, safe loading/error states, RTL/i18n, and Smart Basket handoff;
- Mobile Shopping and Price API clients reuse the canonical authenticated transport; Persian product-key normalization is aligned with backend;
- Mobile source smoke checks and Jest coverage protect the new Budget route/transport contract.

## Validation evidence

Code tree `c493e3fb470f391d3b21cad28788046a57f5e570`:
- Backend CI `34689456388`: SUCCESS — dependency installation, Prisma validation/generation, migrations/idempotence, food-intelligence self-test, backend build, unit tests, API E2E and diagnostics.
- Mobile CI `34689456439`: SUCCESS — dependency installation, TypeScript typecheck, source tests, committed Jest specs, Expo validation and Android JavaScript bundling.

The CI-covered code changes include the recipe missing-ingredient → deterministic price → budget impact → budget-qualified shopping bridge and the Mobile Budget journey.

## Current architectural boundary

The Brain can recognize a food-budget request and execute the deterministic budget action. The recipe path now scales ingredients first, resolves inventory coverage, prices only deterministic missing quantities, exposes evidence states, and can hand only verified purchasable items to Shopping.

No implicit FX conversion, fuzzy monetary matching, stale-price-as-current behavior, or guessed costs are permitted.

The remaining MASTER-0004 work is no longer the core recipe→budget→shopping bridge. Remaining work is broader price coverage/multi-source freshness, cleanup of non-consuming legacy artifacts if any remain, richer user-facing alternatives/explanations, deeper offline behavior, and the broader Food OS/mobile completion journey.

## Next workstream

Continue MASTER-0004 with price-source breadth/freshness and actionable alternatives, then finish Mobile offline/edge-state behavior before moving to Fitness/health and the wider Brain/global workstreams.

## Environment boundary

The local container cannot clone the repository because direct GitHub network access is unavailable. GitHub connector evidence is used for repository inspection and CI state. Production/deployed DB/RLS/storage configuration, physical-device UX, push delivery, external provider quotas and store-release validation are not claimed verified.
