# MYPA Current State

Last updated: 2026-09-12
Review status: MASTER PROMPT DEVELOPMENT IN PROGRESS

## Canonical ownership

This root file is the canonical repository-wide current-state document. `apps/backend/docs/05_CURRENT_STATE.md` is a compatibility pointer and must not contain a competing project-state snapshot.

## Repository state

- Repository: `Ramin-rezaie-nazari/my-personal-assistant`
- Working branch: `audit/project-brain-2026-09-11`
- Current branch head: `19eceeb3f7af8aa253b3aff2666f2cd738fb67fc`
- Validation PR: #70 (validation-only; do not merge automatically)
- Base: `main`

## Appendix/remediation status

The canonical Appendix finding set is reconciled through PB-257. Recoverable concrete findings have been remediated/reclassified and the historical PB-001..PB-155 limitation is explicitly preserved without fabricated text. Prior full Backend and Mobile remediation CI was green.

## Master Prompt development progress

`MASTER-0001` baseline reconciliation: COMPLETE.

`MASTER-0002` deterministic local Brain context: VERIFIED BY CI.

Implemented and verified:
- local Persian/English normalization;
- intent classification for core assistant actions;
- quantity, household-size, budget amount/currency, protein, calorie, time and duration extraction;
- dietary preference and allergy detection;
- local/contextual entity merge into PlanningService;
- propagation of structured entities into executable plan steps;
- recommendation action registration in the central decision-action adapter registry;
- Brain→Food Operating Loop connection for supported nutrition constraints;
- fail-closed behavior when allergy/diet constraints cannot yet be proven safe from canonical recipe data;
- direct unit coverage for local understanding, planner propagation and recommendation adapter behavior.

## Validation evidence

Backend CI run `34686237627` completed successfully: dependency installation, Prisma validation/generation, all migrations plus idempotence, food-intelligence self-test, backend build, 427/427 backend unit tests and API E2E all passed.

Mobile CI run `34686237631` completed successfully: dependency installation, TypeScript typecheck, mobile source tests, committed Jest specs, Expo validation and Android JavaScript bundling.

## Current architectural boundary

The Brain can now carry structured nutrition constraints into the Food Operating Loop, but allergy/dietary hard filtering is intentionally not claimed complete because the canonical recipe/ingredient data model does not yet provide sufficient verified allergen/diet semantics for every recommendation. Unsupported hard constraints therefore stop recommendation execution rather than being silently ignored.

## Next workstream

`MASTER-0003`: establish a verified recipe/ingredient safety-taxonomy contract that can support hard allergy/diet filters without weakening correctness. This requires mapping canonical `FoodItem`/`RecipeIngredient` records to deterministic safety flags with explicit unknown-state behavior, then integrating those flags into Food Operating Loop filtering and tests. Schema changes will only be made if source evidence shows the existing contract cannot represent the required data safely.

## Environment boundary

The local container cannot clone the repository because direct GitHub network access is unavailable. GitHub connector evidence is used for repository inspection and CI state. Production/deployed DB/RLS/storage configuration, physical-device UX, push delivery and external provider quotas are not claimed verified.
