# Project Brain Changelog

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: baseline + Core + complete Prisma schema + all 39 migration SQL files + complete Assistant/Brain enumerated source/test scope + Food/Shopping/Life/Health/Fitness enumerated scopes + Platform/Test/CI enumerated manifests/E2E/workflows + substantial Mobile routes/clients/specs/native config + Mobile components/motion/scripts.
Scope not yet read: remaining Mobile route/library/native files; remaining Fitness-adjacent source; exhaustive common/platform/test inventory; repository-wide route/consumer/database matrices; full automated validation; full security/privacy closure; historical docs/branches.
Evidence roots: Project Brain documents; `apps/backend/src/modules/`; `apps/backend/prisma/`; `apps/mobile/`; `.github/workflows/`.
Confidence level: HIGH for completed file-level reads; MEDIUM for cross-module conclusions; no repository runtime execution claim.
Open questions: exact repository-wide inventory/line counts, live DB drift, complete model/table consumer graph, transaction boundaries, route/mobile mappings, full CI validation and device behavior.

## 2026-09-11 — BATCH-0001
- Initialized durable Project Brain on `audit/project-brain-2026-09-11` without modifying `main`.

## 2026-09-11 — BATCH-0002
- Completed identified current-main Core source reads across Auth, Users, Profile, Preferences, Onboarding, Settings, Context, Device and User Intelligence.

## 2026-09-11 — BATCH-0003
- Read the complete Prisma schema and all 39 migration SQL files plus `migration_lock.toml`.
- Recorded migration-created/runtime raw-SQL tables that are absent from the final Prisma model contract.

## 2026-09-11 — BATCH-0004
- Completed enumerated Assistant and Brain source/test reads and recorded evidence-backed Brain issues.

## 2026-09-11 — BATCH-0005
- Completed enumerated Food/Recipe/Nutrition/Meals/Recommendation/Budget and Shopping/Inventory/Price source scopes.

## 2026-09-11 — BATCH-0006
- Completed enumerated Life/Health source scopes, including LifeTasks.
- Recorded LifeTasks orphan wiring, parallel task-domain drift, missing validation/tests and completedAt correctness issue.

## 2026-09-11 — BATCH-0007
- Completed enumerated Fitness/Workout/Calisthenics/Gym/Yoga scopes plus Personal Brain fitness consumers.

## 2026-09-11 — BATCH-0008
- Completed enumerated Platform/Test/CI source scopes and workflow inspection; no runtime execution claim.

## 2026-09-11 — BATCH-0009
- Completed enumerated high-use Mobile routes/clients/specs/native configuration.
- Recorded Mobile auth, localization, offline, notification, TTS, price-history, API-client and CI-gate findings.
- Corrected the earlier PB-112 false positive after verifying the backend exposes `/personal-brain/decision/execute-next`, `/confirm`, and `/feedback` with JWT guards.

## 2026-09-11 — BATCH-0010
- Read every file under `apps/mobile/components/` (7 files), `apps/mobile/lib/motion.tsx`, and both current `apps/mobile/scripts/*.cjs` files completely.
- Found duplicate animation wrapper exports in `components/AnimatedPressable.tsx` / `AnimatedSection.tsx` versus `lib/motion.tsx` and no observed external consumer of the component wrappers.
- Confirmed `DecisionTraceCard` and `PlanStatusCard` are active consumers in `command-center-v2`, while their text formatting contains localized/hardcoded English behavior outside the global i18n dictionary.
- Recorded PB-183..PB-185; PB-185 is a more precise supply-chain surface of existing PB-129 and must not be double-counted.
- Corrected PB-167: `ContentModule` is active because `apps/backend/src/app.module.ts` imports it; the earlier orphan claim is NOT_APPLICABLE.
- Updated `FILE_REVIEW_INDEX.md`, `READING_CHECKPOINTS.md`, `REVIEW_GAPS.md`, `12_OPEN_WORK.md`, and this changelog.

## Next
- Execute BATCH-0011: continue exhaustive Mobile `app/` and `lib/` inventory from remaining unreviewed files, then reconcile route/consumer/test/status matrices.
- Continue remaining Platform/common/test/Fitness-adjacent source, followed by repository-wide route/API, database reader-writer/transaction, security/privacy and historical reconciliation.
- Only after Master Prompt closure begin the separate correction phase using the final canonical issue catalog.
