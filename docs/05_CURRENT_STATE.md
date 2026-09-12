# MYPA Current State

Last updated: 2026-09-12
Review status: MASTER PROMPT DEVELOPMENT IN PROGRESS; SHOPPING UNIT INTEGRITY REMEDIATED AND CI VERIFIED

## Canonical ownership

This root file is the canonical repository-wide current-state document. `apps/backend/docs/05_CURRENT_STATE.md` is a compatibility pointer and must not contain a competing project-state snapshot.

## Repository state

- Repository: `Ramin-rezaie-nazari/my-personal-assistant`
- Working branch: `audit/project-brain-2026-09-11`
- Latest code tree verified by CI: `1f3f73601183779fbef865a82ce2ea3dee3f8c33`
- Validation PR: #70 (validation-only; do not merge automatically)
- Base: `main`

## Appendix/remediation status

The canonical Appendix finding set is reconciled through PB-270. Recoverable concrete findings have been remediated/reclassified and the historical PB-001..PB-155 limitation is explicitly preserved without fabricated text. Master Prompt product findings are tracked in the same Appendix beginning at PB-258.

## Master Prompt development progress

`MASTER-0001` baseline reconciliation: COMPLETE.
`MASTER-0002` deterministic local Brain context: VERIFIED BY CI.
`MASTER-0003` recipe/ingredient safety-taxonomy contract: VERIFIED BY CI.
`MASTER-0004` Nutrition/Food → Pantry/Inventory → Shopping → Budget: RECIPE→BUDGET→SHOPPING + PRICE-EVIDENCE CORE VERIFIED BY CI; FULL VERTICAL IN PROGRESS.

Completed and verified in MASTER-0004:
- canonical user-scoped Shopping Intelligence behind JWT;
- explicit currency compatibility, sequential remaining-budget accounting and committed `buy_now` semantics;
- Inventory ownership of inventory intelligence with the real module cycle removed;
- deterministic `PriceProductKeyService` mapping with no fuzzy monetary matching;
- deterministic arbitrary recipe-item budget quoting with exact unit/currency compatibility, seven-day freshness and provenance;
- multi-source price selection prefers the freshest compatible source that is still fresh and fails closed when all compatible evidence is stale;
- explicit `within_budget`, `over_budget`, `partial_price_evidence`, `insufficient_price_data` states;
- deterministic next-action codes for blocked evidence, without fabricated alternative prices;
- canonical recipe scaling → inventory gaps → budget quote → budget-qualified Shopping insertion;
- authenticated recipe budget and budget-shopping routes with controller/API E2E coverage;
- Mobile Recipe Budget journey with loading/error/RTL/i18n handling and Smart Basket handoff;
- Mobile Shopping/Price clients reuse the canonical authenticated transport and aligned Persian product-key normalization;
- user-scoped offline Budget cache with fail-closed Shopping handoff while offline;
- Mobile Budget next-action rendering and native storage/Jest coverage;
- Shopping basket merges now convert compatible quantity units into the existing row's unit and reject incompatible unit kinds rather than corrupting numeric quantities (PB-270).

## Validation evidence

Verified code tree `1f3f73601183779fbef865a82ce2ea3dee3f8c33`:
- Backend CI `34691080753`: SUCCESS — Prisma validation/generation, migrations/idempotence, food self-test, build, unit tests, API E2E, diagnostics.
- Mobile CI `34691080764`: SUCCESS — install, TypeScript typecheck, source tests, committed Jest specs, Expo validation, Android JavaScript bundling.

## Current architectural boundary

The local Brain can recognize food-budget requests and execute the deterministic budget action. The recipe operating loop now scales first, derives actual missing quantities, resolves price evidence across sources, surfaces evidence quality, and can add only verified priced requirements into Shopping. Shopping now preserves numeric unit meaning when inventory/recipe sources converge on an existing basket row.

No implicit FX conversion, fuzzy monetary matching, stale-price-as-current behavior, or guessed costs are permitted. Incompatible quantity units are also not silently merged.

## Remaining MASTER-0004 work

- broaden price-source breadth and source health/failure semantics;
- complete Pantry↔Shopping lifecycle reconciliation and user-visible edits beyond the unit-integrity boundary;
- audit any remaining stale non-consuming Budget/Shopping artifacts;
- richer actionable explanations after evidence is blocked;
- continue end-to-end vertical hardening and only then move to the next vertical.

## Next workstream

Continue MASTER-0004 with Pantry↔Shopping lifecycle reconciliation, then broaden price-source coverage and audit remaining stale Budget/Shopping artifacts.

## Environment boundary

The local container cannot clone the repository because direct GitHub network access is unavailable. GitHub connector evidence is used for repository inspection and CI state. Production/deployed DB/RLS/storage configuration, physical-device UX, push delivery, external provider quotas and store-release validation are not claimed verified.
