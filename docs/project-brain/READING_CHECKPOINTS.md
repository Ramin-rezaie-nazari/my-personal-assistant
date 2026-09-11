# Reading Checkpoints

Last updated: 2026-09-11
Review status: IN_PROGRESS

## Scope and evidence baseline
Scope actually read: current-main manifests/AppModule; complete identified Core source files; full Prisma schema; all 39 migration SQL files; complete Assistant TypeScript source/test scope; complete enumerated Brain; Food/Recipe/Nutrition/Meals/Recommendation/Budget; Shopping/Inventory/Shopping Intelligence and substantial Price Intelligence; Life/Health enumerated modules; Fitness/Workout/Calisthenics/Gym/Yoga and related Personal Brain fitness consumers; Platform/Test/CI enumerated manifests/E2E/workflows; substantial Mobile routes/clients/components; all seven Mobile component files; Mobile `lib/motion.tsx`; both Mobile scripts; remaining identified Mobile library/notification contract files; backend route/API/controller inventory and selected backend↔mobile consumer reconciliation; BATCH-0013 operational scripts; backend common/config/bootstrap/database/i18n/images; historical high-value PR/branch reconciliation; Mobile screen/domain client review; CI/release/onboarding/session lifecycle review; raw SQL/Destructive-operation sweep; Brain retention/deletion; account erasure; backend CI/E2E database lifecycle; duplicate UsersController and HealthController reconciliation; root repository docs (`docs/PR_FEATURE_VOICE.md`, `docs/branding.md`, `docs/food-entity-resolution.md`, `docs/recipe-image-data-architecture.md`), `docs/roadmap/C-visual-ux-roadmap.md`; Mobile package/config/README/env; Mobile app `_layout.tsx`, `assistant.tsx`, `auth.tsx`, `brain-overview.tsx`, `calendar.tsx`, `command-center-v2.tsx`, `daily.tsx`; Mobile notification registration/runtime and local Persian TTS; root package/workspace and a chunk of root lockfile; continued localization and cross-layer contract checks; additional Mobile route screens `habits.tsx`, `inventory.tsx`, `insights.tsx`, `language.tsx`, `meals.tsx`, `meal-builder.tsx`, `meal/[id].tsx`, `notifications.tsx`, `reminders.tsx`, `onboarding.tsx`, `price-history.tsx`, `recipe-match.tsx`, `shopping.tsx`, `smart-meals.tsx`, `supplements.tsx`, `yoga.tsx`; Mobile `lib/i18n.ts`; `tools/recipe-image-pipeline.ts`; `tools/recipes/quality-policy.md`; `tools/recipes/source-manifest.json`; continuation full reads of `apps/mobile/lib/assistant-api.ts`, `brain-execution.ts`, `brand.ts`, `branding.spec.ts`, `branding.ts`, `calendar-api.ts`, `command-actions.ts`, `design-system.ts`, `inventory-api.ts`, `onboarding.ts`, `price-api.ts`, `recipe-api.ts`, `shopping-api.ts`, `shopping-basket-api.ts`; backend `src/app.module.ts`, `app.controller.ts`, `app.service.ts`, `main.ts`, `bootstrap.ts`, `common/config/config.module.ts`, `common/config/env.validation.ts`, `common/config/app-config/app-config.service.ts`, `common/database/prisma.module.ts`, `common/database/prisma.service.ts`; Mobile components `BrandMark.tsx`, `BrandWordmark.tsx`; backend operational script inventory and continued line-level reads of fitness content balance, food resolvers/self-tests, localized food resolvers, recipe content audit/import, ingredient intelligence and guaranteed media mirror; mobile assets/branding canonical SVG/guide/readme; all identified GitHub workflows; root package/workspace; backend adaptive-learning; Project Brain security/control documents; continued active backend controller/consumer sweeps; Shopping service batch-write path; active Habits/Workout/Supplements/LifeExecution DTO/controller validation sweep; GitHub Actions run/job evidence for Recipe image import CI failure; Content module/service/type surfaces; Conversation Engine module/service/type surfaces; AppModule and PersonalBrainModule consumer graph; historical Git path query for the Audit Findings Appendix; current-main direct revalidation of recipe intelligence and operational script paths; current Prisma User cascade/ownership surface; current-main DB query/index reconciliation for Workout and UserBehavior.

Scope not yet fully closed: exhaustive repository-wide route↔DTO↔test↔mobile mapping, exhaustive DB reader/writer/relation/index/transaction matrix, complete security/privacy reconciliation, remaining common/platform/test/legacy operational source closure, runtime/device execution, deployed environment validation, safe full-file canonical Appendix merge/freeze.
Evidence roots: target `main` @ `e38d4d16b0cf6e6ea714fa0bcc048e80187bcb3b`; audit branch `audit/project-brain-2026-09-11`; `apps/backend/`; `apps/mobile/`; `.github/workflows/`; `docs/`; `docs/project-brain/`; `tools/`.
Confidence: HIGH for completed file reads and direct current-main checks; MEDIUM for cross-module conclusions; no runtime/device verification claim.

## BATCH-0001 — baseline
Status: COMPLETE

## BATCH-0002 — Core
Status: COMPLETE

## BATCH-0003 — Database schema/migration baseline
Status: COMPLETE — `schema.prisma` + all 39 migrations + lock read.

## BATCH-0004 — Brain
Status: COMPLETE — FILE-READ SCOPE.

## BATCH-0005 — Food / Recipe / Nutrition / Shopping / Price
Status: COMPLETE — ENUMERATED FILE-READ SCOPE.

## BATCH-0006 — Life / Health
Status: COMPLETE — ENUMERATED FILE-READ SCOPE.

## BATCH-0007 — Fitness
Status: COMPLETE — ENUMERATED FILE-READ SCOPE.

## BATCH-0008 — Platform / Tests / CI
Status: COMPLETE — ENUMERATED FILE-READ SCOPE; runtime unverified.

## BATCH-0009 — Mobile main route/client/native scope
Status: COMPLETE — ENUMERATED FILE-READ SCOPE.

## BATCH-0010 — Mobile components / motion / scripts
Status: COMPLETE — FILE-READ SCOPE.

## BATCH-0011 — Mobile residual library contracts
Status: COMPLETE — FILE-READ SCOPE.

## BATCH-0012 — Backend route/API inventory and consumer reconciliation
Status: IN_PROGRESS
Scope completed so far: backend root startup/config/database/i18n/images; Auth controller/service/token/session; broad active controller inventory across Core, Brain, Food/Commerce, Life/Health, Fitness, Dashboard and Intelligence; AppModule wiring checks; selected Mobile route/consumer searches; historical PR/branch status checks; active-vs-orphan UsersController reconciliation; HealthController/HealthService active-vs-orphan reconciliation.
Findings added/reconciled: PB-186, PB-187, PB-171 narrowed, PB-182 re-confirmed, PB-205, PB-211, PB-213, PB-214.
Unresolved: full route DTO/output/error/test/mobile-consumer mapping; final duplicate-controller reconciliation beyond currently identified pairs; runtime HTTP validation.

## BATCH-0013 — Backend operational scripts and cross-layer continuation
Status: IN_PROGRESS
Completed so far: package-wired recipe/food/image/country scripts, duplicate/versioned resolver and country variants, image reprocessors, relevant recipe migrations, local guaranteed image pipeline variants, release workflow, Brain retention/deletion/account-erasure cross-checks, backend CI/E2E database lifecycle, continued Mobile screen/domain review, root docs/roadmap review, root/mobile package/config review, notification/voice/native review, localization cross-checks, tools/recipe policy/source manifest review.
Findings added: PB-188..PB-206, PB-207..PB-214, PB-215, PB-216, PB-217.
Documentation contract refinement: PB-194 now also cites `docs/recipe-image-data-architecture.md` because the documented hard 60KB cap is itself inconsistent with the higher-level 100–150KB image target.
Important corrections: PB-112 NOT_APPLICABLE; PB-167 NOT_APPLICABLE; PB-171 narrowed to active Fitness controller only; active Users controller uses `req.user.id`; active Health nested controller is profile/nutrition API while root public liveness controller is orphaned.
Unresolved: remaining operational scripts, exhaustive duplicate lineage, complete platform/common/test inventory, exact canonical/deprecated status, execution validation, remaining workflow entrypoints, exhaustive route/DB/security closure.

## BATCH-0014 — Mobile library + backend startup/config continuation
Status: IN_PROGRESS
Completed reads: Mobile domain/auth/branding/calendar/design-system/onboarding/command-action/price/recipe/shopping/inventory clients; backend AppModule/startup/config/database core; BrandMark/BrandWordmark; Mobile nested meal detail; Mobile root/config/assets/branding; backend operational script inventory continuation.
Findings/control: PB-218, PB-219, PB-220 added/reconciled. No production code changed.

## BATCH-0015 — CI/workflow + Adaptive Learning continuation
Status: IN_PROGRESS
Completed reads: main branch build/validation workflows, recipe image/ingest workflows, package/workspace manifests, adaptive-learning module/controller/DTO/service/test/provider files, Project Brain security document.
Findings/control: PB-221 and PB-222. Feedback-analysis/learning-memory remain placeholder/orphan candidates pending final consumer reconciliation.

## BATCH-0016 — Backend validation-contract + Goals/Calendar + Memory continuation
Status: IN_PROGRESS
Completed reads: bootstrap, Memory Intelligence, Goals, Calendar, Preferences/Settings/Onboarding, active Health profile DTO, Mobile Yoga/notification contracts.
Findings/control: PB-231..PB-235. Later reconciliation narrowed PB-232/PB-234/PB-237 because inline Object metatypes are not equivalent to decorated class DTOs under Nest ValidationPipe semantics.

## BATCH-0017 — Active Shopping batch-write transaction continuation
Status: IN_PROGRESS
Completed reads: Shopping service/controller and Recipe Food Operating Loop consumer; repeated auth/write-contract sweep.
Finding: PB-241.

## BATCH-0018 — Validation sweep + CI evidence + Project Brain inventory continuation
Status: IN_PROGRESS
Completed reads: active Habits/Workout/Supplements/LifeExecution DTO/controller surfaces; Project Brain inventory; full Appendix blob; Open Work catalog; Recipe image workflow and real Actions run evidence.
Findings/control: PB-242 confirmed by run `34613481370`; PB-243 remains reconciliation-dependent and overlaps historical DTO findings.

## Repository documentation checkpoint
Status: IN_PROGRESS
Completed reads: root docs inventory, voice/branding/food-resolution/recipe-image architecture docs, visual UX roadmap, Project Brain security/control docs.
Observation: 60KB recipe image policy discrepancy remains PB-194.

## Mobile route checkpoint
Status: IN_PROGRESS
Completed reads: major mobile routes and domain clients listed in prior checkpoint history, including daily, habits, inventory, insights, meals, meal-builder, meal detail, notifications, reminders, onboarding, price-history, recipe-match, shopping, smart-meals, supplements, yoga, calendar, command-center, assistant, auth, brain-overview.
Findings/control: PB-215, PB-216, PB-217, PB-219; runtime/device remains unverified.

## Historical reconciliation checkpoint
Status: IN_PROGRESS
Historical PR/branch status and Audit Appendix history were directly checked. Exact PB-001..PB-155 Appendix prose is not recoverable from exposed Git history; this is an evidence limitation, not grounds to invent historical text.

## BATCH-0022 — CI/workflow/package/runtime-evidence continuation
Status: IN_PROGRESS
Completed reads/checks: current backend/mobile package manifests versus CI commands; recipe-content release workflow; recipe-image workflow; actual Actions run `34613481370`; mobile route aliases; voice/TTS dependency surfaces.
Findings/control: PB-242 runtime CI evidence reconfirmed; PB-206 reconfirmed without duplication; no new unique CI finding.

## BATCH-0023 — Remaining module/source spot closure: Content + Conversation Engine
Status: IN_PROGRESS
Completed reads: Content and Conversation Engine module/service/type surfaces; AppModule/PersonalBrainModule graph; repository-wide consumer searches.
Findings/control: PB-252 remains provisional; PB-253 was withdrawn after current consumer verification showed ResponsePlanningService consumes ConversationStyleService.

## BATCH-0024 — DB/ownership/operational lineage continuation
Status: SUPERSEDED BY DIRECT REVALIDATION
Earlier provisional missing-script observations were rechecked directly against current main. PB-251/PB-256 were withdrawn and PB-255 merged into PB-203. The original batch note contains stale intermediate evidence; later direct checks are authoritative.

## BATCH-0025 — revalidation/control reconciliation
Status: COMPLETE — CONTROL RECONCILIATION
Completed: PB-250→PB-160 merge decision; PB-251 withdrawal; PB-255→PB-203 merge; PB-256 withdrawal; PB-253 withdrawal; PB-252 provisional status; PB-254 account-erasure closure item; historical PB-001..PB-155 evidence limitation; runtime/environment boundary.

## BATCH-0026 — current-main recipe intelligence + account-erasure schema revalidation
Status: COMPLETE — SOURCE-LEVEL REVALIDATION
Completed reads/checks: direct current-main `recipe-recommendation-score.mjs`, `recipe-nutrition-estimate.mjs`, package-declared retry script, guaranteed-v8/v7 relationship; current Prisma `User` model cascade relations; route/controller search continuation.
Findings/control: PB-199/PB-200/PB-204 reconfirmed as active logic/provenance findings; PB-251/PB-255/PB-256 remain withdrawn/merged as reconciled; PB-254 remains provisional pending migration-only/storage/external-Auth deletion inventory. No production code changed.

## BATCH-0027 — DB index + lifecycle/security closure continuation
Status: IN_PROGRESS
Completed reads/checks: final Prisma schema index surface; active Workout chronological query consumers; UserBehavior chronological learning query; current-main controller guard sweep; account-erasure searches for `prisma.user.delete`, `deleteUser`, and Supabase Auth admin deletion.
Finding added: PB-257 (Workout/UserBehavior user-time query patterns lack matching composite indexes in final Prisma schema; source-level performance finding requiring runtime query-plan/row-count validation before remediation sizing).
Control: no duplicate account-erasure finding created; PB-254/PB-211 remain canonical. No production code changed.

## Remaining Master Prompt closure gates
1. Complete exhaustive route↔DTO↔test↔mobile consumer matrix.
2. Complete exhaustive DB reader/writer/relation/index/transaction matrix, including migration-only tables.
3. Complete security/privacy/authorization/retention/secret/config closure.
4. Complete remaining common/platform/test/legacy operational source closure.
5. Safely reconcile the canonical Appendix, including PB-160/PB-250, PB-232/PB-234/PB-237 corrections, PB-243 historical overlaps, PB-244..PB-256 status decisions, and PB-257, plus the historical-text evidence limitation.
6. Synchronize File Review Index/checkpoints and produce a final validation ledger.
7. Freeze the duplicate-free canonical findings catalog only after gates 1–6 are directly evidenced.
8. Only then start remediation as a separate phase.
