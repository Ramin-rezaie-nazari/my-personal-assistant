# Project Brain Changelog

Last updated: 2026-09-12
Review status: SOURCE-LEVEL AUDIT RECONCILED; MASTER PROMPT DEVELOPMENT IN PROGRESS; APPENDIX REMEDIATION VERIFIED THROUGH PB-270; ENVIRONMENTAL VALIDATION BLOCKED
Scope actually read: baseline + Core + complete Prisma schema and all 39 migrations + complete recorded Assistant/Brain/Food/Shopping/Life/Health/Fitness/Platform/Test/CI/Mobile source scopes + route/consumer/DTO/guard/database reconciliation + operational scripts + historical Appendix reconciliation + focused Inventory/Recipe → Shopping unit reconciliation + remediation verification.
Scope not yet read: no known recoverable source gap remains in the recorded audit baseline; deployed runtime/device/external-provider validation remains unavailable.
Evidence roots: `docs/project-brain/`; `apps/backend/`; `apps/mobile/`; `.github/workflows/`; `apps/backend/prisma/`; GitHub Actions evidence.
Confidence level: HIGH for recorded source-level audit and remediation evidence; MEDIUM for deployment/runtime conclusions.
Open questions: production database/RLS/Storage/Auth configuration, physical-device behavior, external provider quotas and unrecoverable PB-001..PB-155 historical prose.

## 2026-09-12 — BATCH-0032 — Inventory/Recipe → Shopping unit reconciliation
- Revalidated the Inventory → Shopping and Recipe → Shopping quantity/unit boundary after the Budget → Shopping vertical was connected.
- Found PB-270: active `ShoppingItem` rows are unique by user/food/completion state, so merging by `foodId` without unit compatibility could corrupt numeric meaning (for example, adding grams to an existing pieces row).
- Remediated `ShoppingService` to convert compatible mass/volume/count units into the existing basket row's unit and reject incompatible units before update. Recipe-missing writes remain transactional.
- Added direct `ShoppingService` regression coverage for compatible conversion and fail-closed incompatible-unit behavior in both manual basket and recipe-missing paths.
- Backend CI `34691080753` and Mobile CI `34691080764` passed on `1f3f73601183779fbef865a82ce2ea3dee3f8c33`.
- Reconciled `15_AUDIT_FINDINGS_APPENDIX.md`, `00_PROJECT_OVERVIEW.md`, `READING_CHECKPOINTS.md`, `05_CURRENT_STATE.md`, and `deep-read/04-shopping.md`.

## 2026-09-12 — BATCH-0031 — Project Brain reconciliation after Appendix verification
- Synchronized `05_CURRENT_STATE.md` with the successful Backend/Mobile CI verification on remediation commit `46614b36040cb839d6062dae726dc74e51ab3b96`.
- Updated canonical Appendix verification boundary to record Backend CI and Mobile CI as green while preserving production/device limits.
- Reconciled `00_PROJECT_OVERVIEW.md`, `01_ARCHITECTURE_MAP.md`, `FILE_REVIEW_INDEX.md`, `READING_CHECKPOINTS.md`, `REVIEW_GAPS.md` and `13_DECISION_LOG.md` so they no longer present pre-remediation findings as current defects.
- Reconciled Core, Brain, Food, Shopping, Life/Health, Fitness, Platform/Test and Mobile deep-read documents with the current remediation baseline.
- Added the explicit distinction between source-audit completion, Appendix remediation completion and final MYPA product readiness.

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

## 2026-09-11 — BATCH-0012 through BATCH-0030
- Historical batch records retained in repository history. Final reconciliation is controlled by `FILE_REVIEW_INDEX.md`, `READING_CHECKPOINTS.md`, `REVIEW_GAPS.md` and the canonical Appendix.

## Verification boundary

The source-audit record and Appendix remediation closure do not imply production readiness. Runtime HTTP execution, deployed PostgreSQL/RLS/Storage/Auth state, physical-device UX, push delivery and external provider quotas remain environmental validation work.
