# Project Brain Changelog

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: baseline + Core + complete Prisma schema + all 39 migration SQL files + complete Assistant/Brain enumerated source/test scope + Food/Shopping/Life/Health/Fitness enumerated scopes + Platform/Test/CI enumerated manifests/E2E/workflows + substantial Mobile routes/clients/specs/native config + Mobile components/motion/scripts + residual Mobile library contracts/tests + continued BATCH-0013 operational recipe/food scripts and relevant recipe migrations.
Scope not yet read: any Mobile source outside current audited trees if present; remaining Fitness-adjacent source; exhaustive common/platform/test inventory; repository-wide route/consumer/database matrices; full automated validation; full security/privacy closure; historical docs/branches; remaining legacy/duplicate operational scripts.
Evidence roots: Project Brain documents; `apps/backend/src/modules/`; `apps/backend/prisma/`; `apps/backend/scripts/`; `apps/mobile/`; `.github/workflows/`.
Confidence level: HIGH for completed file-level reads; MEDIUM for cross-module conclusions; no repository runtime execution claim.
Open questions: exact repository-wide inventory/line counts, live DB drift, complete model/table consumer graph, transaction boundaries, route/mobile mappings, full CI validation and device behavior, operational ownership of remaining legacy variants.

## 2026-09-11 — BATCH-0001
- Initialized durable Project Brain on `audit/project-brain-2026-09-11` without modifying `main`.

## 2026-09-11 — BATCH-0002
- Completed identified current-main Core source reads across Auth, Users, Profile, Preferences, Onboarding, Settings, Context, Device and User Intelligence.

## 2026-09-11 — BATCH-0003
- Read the complete Prisma schema and all 39 migration SQL files plus `migration_lock.toml`.
- Recorded migration-created/runtime raw-SQL tables absent from the final Prisma model contract.

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

## 2026-09-11 — BATCH-0011
- Read the remaining identified Mobile library contract files: `design-system.ts`, `motion-components.tsx`, `branding.ts`, `branding.spec.ts`, `notifications/notification-contract.ts`, and `notification-contract.spec.ts`.
- Confirmed `design-system.ts` and `motion-components.tsx` are actively consumed by multiple screens; they are not orphan layers.
- Confirmed the notification payload parser is versioned and has direct tests; producer/consumer parity with backend remains a repository-wide reconciliation task rather than a confirmed defect at this stage.
- Completed the currently inventoried `app/`, `lib/`, `components/`, and `scripts/` Mobile source boundary to the extent exposed by the current Git tree snapshots. No native `apps/mobile/android` or `apps/mobile/ios` directory was present at those paths in the audited branch.
- Updated `FILE_REVIEW_INDEX.md`, `READING_CHECKPOINTS.md`, `REVIEW_GAPS.md`, `12_OPEN_WORK.md`, `deep-read/08-mobile-deep-read.md`, and this changelog. No production code changes made.

## 2026-09-11 — BATCH-0012 continuation checkpoint
- Re-opened the canonical audit Project Brain state and continued the backend route/API and operational-script reconciliation from the existing checkpoint rather than rebuilding already-read green work.
- Confirmed PB-186..PB-190 are present in the canonical `15_AUDIT_FINDINGS_APPENDIX.md`.
- Created the required root-level `docs/05_CURRENT_STATE.md` because the protocol-mandated path was absent while a legacy/operational `apps/backend/docs/05_CURRENT_STATE.md` existed. The two documents still require deliberate reconciliation; this is tracked as PB-191.

## 2026-09-11 — BATCH-0013
- Started with the package-wired operational scripts in `apps/backend/package.json`, then inspected their legacy/duplicate recipe and food variants.
- Inspected `recipe-content-import.mjs` against the final Prisma schema and the `RecipeStep` / `RecipeMedia` migrations; PB-188 was confirmed and the importer restartability/transaction findings PB-192/PB-193 were recorded.
- Inspected recipe image import, dataset import, reprocess-quality, retry, and legacy image variants; recorded PB-194, PB-196 and PB-197 around the 60KB asset contract, positional limit batching, and conflicting `primary`/`hero` image contracts.
- Inspected country-intelligence version family and confirmed PB-195 operational drift between multiple executable historical variants and the package-wired final implementation.
- Inspected Food Entity Resolver v1/v2/final and current self-test; recorded PB-198 for missing direct coverage of final-wrapper behavior.
- Inspected recipe recommendation scoring and recipe ingest together; recorded PB-199 because the producer stores quality as a 0..1 fraction while the consumer divides it by 100.
- Inspected nutrition estimation; recorded PB-200 for missing source/version provenance on hard-coded nutrient constants and household-unit conversions. The estimator is explicitly marked as `estimated`, so this is a provenance/traceability issue rather than a claim of hidden verified data.
- Updated the canonical audit findings appendix through PB-200 and added the required root Current State document. No production-code or `main` changes made by this audit session.

## Next
- Continue BATCH-0013 through the remaining legacy/duplicate operational script families and any not-yet-read wired scripts.
- Then complete the remaining route↔DTO↔test↔mobile consumer reconciliation and repository-wide database/transaction/security/privacy matrices.
- Only after the Master Prompt audit scope is fully closed begin the separate correction/remediation phase using the final canonical findings catalog.
