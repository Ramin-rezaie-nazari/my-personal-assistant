# Project Brain Changelog

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: baseline + Core + complete Prisma schema and all 39 migrations + complete Assistant/Brain enumerated source/test scope + Food/Shopping/Life/Health/Fitness enumerated scopes + Platform/Test/CI enumerated manifests/E2E/workflows + substantial Mobile routes/clients/specs/native config + Mobile components/motion/scripts + residual Mobile library contracts/tests + continued BATCH-0013 operational recipe/food scripts + backend common/config/auth/fitness cross-contract review + historical branch/PR reconciliation + extended Mobile app/lib screen/domain-client consumer mapping + CI/release workflow and database raw-SQL ownership sweep.
Scope not yet read: remaining repository source outside current audited trees; remaining Fitness-adjacent source; exhaustive common/platform/test inventory; exhaustive repository-wide route/consumer/database matrices; full automated validation; full security/privacy closure; historical docs/branches beyond inspected high-value branches/PRs; remaining legacy/duplicate operational scripts.
Evidence roots: Project Brain documents; `apps/backend/src/`; `apps/backend/prisma/`; `apps/backend/scripts/`; `apps/mobile/`; `.github/workflows/`.
Confidence level: HIGH for completed file-level reads; MEDIUM for cross-module conclusions; no repository runtime execution claim.
Open questions: exact repository-wide inventory/line counts, live DB drift, complete model/table consumer graph, transaction boundaries, complete route/mobile mappings, full CI validation and device behavior, operational ownership of remaining legacy variants.

## 2026-09-11 — BATCH-0001
- Initialized durable Project Brain on `audit/project-brain-2026-09-11` without modifying `main`.

## 2026-09-11 — BATCH-0002
- Completed identified current-main Core source reads across Auth, Users, Profile, Preferences, Onboarding, Settings, Context and User Intelligence.

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
- Re-opened the canonical Project Brain state and continued the backend route/API and operational-script reconciliation from the existing checkpoint rather than rebuilding already-read green work.
- Confirmed PB-186..PB-190 are present in the canonical `15_AUDIT_FINDINGS_APPENDIX.md`.
- Created the required root-level `docs/05_CURRENT_STATE.md` because the protocol-mandated path was absent while a legacy/operational `apps/backend/docs/05_CURRENT_STATE.md` existed. The two documents still require deliberate reconciliation; this is tracked as PB-191.

## 2026-09-11 — BATCH-0013
- Started with the package-wired operational scripts in `apps/backend/package.json`, then inspected their legacy/duplicate recipe and food variants.
- Inspected `recipe-content-import.mjs` against the final Prisma schema and the `RecipeStep` / `RecipeMedia` migrations; PB-188 was confirmed and the importer restartability/transaction findings PB-192/PB-193 were recorded.
- Inspected recipe image import, dataset import, reprocess-quality, retry, and legacy image variants; recorded PB-194, PB-196 and PB-197 around the 60KB asset contract, positional limit batching, and conflicting `primary`/`hero` image contracts.
- Inspected country-intelligence version family and confirmed PB-195 operational drift between multiple executable historical variants and the package-wired final implementation.
- Inspected Food Entity Resolver v1/v2/final and the available final self-test. Corrected the earlier assumption that the final self-test was absent; PB-198 now records the narrower issue that the final self-test is not exposed through package/CI automation observed in the inspected scope.
- Inspected recipe recommendation scoring and recipe ingest together; recorded PB-199 because the producer stores quality as a 0..1 fraction while the consumer divides it by 100.
- Inspected nutrition estimation; recorded PB-200 for missing source/version provenance on hard-coded nutrient constants and household-unit conversions. The estimator is explicitly marked as `estimated`, so this is a provenance/traceability issue rather than a claim of hidden verified data.
- Found two additional image-state issues: PB-201 (RESET only enumerates first 1000 Storage objects but globally deletes DB rows) and PB-202 (wired image importer only paginates recipe rows, not existing image/skip sets).
- Inspected local guaranteed image pipeline v7/v8 and verified PB-203: v8 references three script files that do not exist in the audited branch, causing a concrete broken orchestration path.
- Recorded PB-204 for country preference scoring reading fields that its own relation query does not select.
- Reviewed `apps/backend/src/common/` config/bootstrap/database boundaries and confirmed the environment validator requires `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`; getter defaults are therefore development fallbacks rather than an observed production secret-bypass.
- Re-checked Fitness↔Auth contract and confirmed `JwtStrategy.validate()` returns the loaded user object while the active Fitness controller reads `req.user.sub`; PB-171 remains a valid cross-contract finding.
- Reconciled high-value historical branches/PRs: PR #48 remains open/unmergeable, PR #49 is open/mergeable from the same Global Market workstream, and PR #66 is a draft autonomous control-plane/local-media workstream. None should be treated as merged into `main` without explicit merge evidence.
- Inspected PR #66 and confirmed its declared local media target (1–4 verified images per recipe, 20–150KB) is a branch-scoped design, not current `main` behavior; this reinforces the existing PB-194 contract-drift finding rather than creating a duplicate.
- Inspected `apps/mobile/lib/api.ts` again and confirmed the currently observed mobile auth/session implementation still stores access and refresh tokens in AsyncStorage and refreshes through the unauthenticated `/auth/refresh` path; existing PB-182 and PB-187 remain the canonical related findings.
- Reviewed current audit-branch CI status for the latest audit commit; no commit status checks are attached, so this session makes no new CI-green claim.
- Inspected `.github/workflows/mypa-mobile-typecheck-repair-once.yml`; it is an old self-mutating one-time workflow that can write/commit `apps/mobile/app/reminders-localized.tsx` and delete its own workflow file. It is not treated as a production defect yet because it targets `agent/mypa-autonomous-control-plane`, but it remains part of the historical/CI control-plane reconciliation scope.
- Extended the route↔mobile consumer pass across Brain, Meals/Nutrition, Calendar, Notifications, Habits, Supplements, Inventory, Shopping and Recipe Match screens; direct consumers were added to `CONTRACT_MATRIX.md` rather than inferred from helper names.
- Compared Mobile transport clients and found a concrete shared-contract defect: `recipe-api.ts`, `shopping-api.ts`, `shopping-basket-api.ts`, `inventory-api.ts`, and `assistant-api.ts` bypass the canonical 401→refresh→retry behavior implemented by `api.ts`, `calendar-api.ts`, `price-api.ts`, and `brain-execution.ts`. Recorded as PB-205 and kept as one cross-client root cause.
- Rechecked `apps/mobile/app/index.tsx` and `command-center.tsx`: both are deliberate re-export shims to the active `command-center-v2` screen; they are not treated as orphan features.
- Inspected `.github/workflows/recipe-content-release.yml` against `apps/backend/package.json`; workflow steps call `pnpm recipe:content:import` and `pnpm recipe:content:audit`, but those package scripts are not defined in the audited backend manifest. Recorded as PB-206, distinct from PB-188 because it is the workflow-to-package entrypoint contract itself.
- Swept raw-SQL consumers including GoalCheckin, TaskDependency, ConversationTurn, WorkoutPerformance and PriceTrackedProduct paths; existing PB-004..PB-007/PB-056..PB-061 remain canonical data-model/ownership findings, and no additional distinct root cause was added from the sampled consumers.
- Inspected remaining high-use Mobile domain screens (`auth.tsx`, `assistant.tsx`, `onboarding.tsx`, `daily.tsx`, `price-history.tsx`) and found no new independent correctness defect beyond existing localization, transport, price-history and auth findings.

## Next
- Continue Master Prompt with exhaustive database reader/writer/transaction/relation/index reconciliation and remaining backend↔mobile DTO/test mapping.
- Continue remaining common/platform/test and legacy operational source closure, plus security/privacy retention/deletion reconciliation.
- Close historical reconciliation only after remaining production-affecting divergence has been mapped against `main`.
- Only after the Master Prompt audit scope is fully closed begin the separate correction/remediation phase using the final canonical findings catalog.
