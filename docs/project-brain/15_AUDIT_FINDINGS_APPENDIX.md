# Audit Findings Appendix

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: selected LifeTasks, Recommendation Intelligence, Goal Intelligence, Content, Dashboard/Daily Command Center, Auth/JWT, Mobile notification/voice/native/test/runtime, Mobile components/motion/scripts, backend route/controller inventory, selected backend↔mobile consumers, initial BATCH-0013 operational recipe import scripts, active country-intelligence script, and continued operational-script/legacy-variant review including recipe image reprocessors, food entity resolvers, recipe intelligence classify/profile/nutrition/score, and relevant recipe migrations.
Scope not yet read: remaining repository-wide source/tests/consumers, full matrices, exhaustive operational scripts, runtime execution, complete security/privacy reconciliation.
Evidence roots: corresponding source paths under `apps/backend/src/modules/`, `apps/backend/prisma/`, `apps/backend/scripts/`, `apps/backend/`, `apps/mobile/`, `.github/workflows/`, `docs/project-brain/`.
Confidence: HIGH for source-level findings below unless explicitly marked validation-needed.

## Correction log

### PB-112 — NOT_APPLICABLE
Earlier audit text said Mobile Brain `execute-next`/feedback routes were missing. That was disproven. `apps/backend/src/modules/personal-brain/controllers/decision-execution.controller.ts` exposes `POST /personal-brain/decision/execute-next` and `POST /personal-brain/decision/confirm`, both JWT guarded. `apps/backend/src/modules/personal-brain/controllers/decision-feedback.controller.ts` exposes `POST /personal-brain/decision/feedback`, also JWT guarded. No repair is required for the original PB-112 route-existence claim.

### PB-167 — NOT_APPLICABLE
Earlier appendix text said `ContentModule` was orphaned. That was disproven by direct inspection of `apps/backend/src/app.module.ts`, which imports `ContentModule` in the active Nest `imports` array. The old PB-167 statement is not an open issue and must not be counted.

## New findings

### PB-156 — LifeTasksModule is source-present but not runtime-wired
Status: OPEN — ARCHITECTURE/FEATURE
Locations: `apps/backend/src/modules/life-tasks/life-tasks.module.ts`, `apps/backend/src/app.module.ts`.
Evidence: `LifeTasksModule` exists with controller/service, but `AppModule` does not import it; search found no external consumer. Impact: its source/API is not active in the audited Nest application.

### PB-157 — LifeTasks and LifeExecution are parallel task-domain implementations
Status: OPEN — ARCHITECTURE/CONTRACT DRIFT
Locations: `apps/backend/src/modules/life-tasks/*`, `apps/backend/src/modules/life-execution/*`, related migrations.
Evidence: both domains implement overlapping task CRUD/dependency/event semantics; LifeTasks uses `LifeTaskDependency`/`LifeTaskEvent`, while LifeExecution uses legacy `TaskDependency`/`TaskEvent`. Impact: parallel semantics can diverge.

### PB-158 — LifeTasks DTOs lack runtime validation decorators
Status: OPEN — API CONTRACT
Locations: `apps/backend/src/modules/life-tasks/dto/create-life-task.dto.ts`, `update-life-task.dto.ts`, `task-event.dto.ts`.

### PB-159 — LifeTasksService has no direct automated service spec in inspected repository
Status: OPEN — TEST GAP
Location: `apps/backend/src/modules/life-tasks/services/life-tasks.service.ts`.

### PB-160 — LifeTasksService.update() resets completedAt on metadata-only edits to completed tasks
Status: OPEN — DATA/LOGIC HIGH
Location: `apps/backend/src/modules/life-tasks/services/life-tasks.service.ts`, `update()`.
Evidence: duplicate/unreachable `status === 'completed'` branch plus `status = dto.status ?? task.status` causes a completed task edited without a status change to receive a new completion timestamp.

### PB-161 — RecommendationIntelligenceModule is orphaned from runtime wiring
Status: OPEN — ARCHITECTURE/FEATURE HIGH
Location: `apps/backend/src/modules/recommendation-intelligence/recommendation-intelligence.module.ts` and import graph.

### PB-162 — RecommendationIntelligenceController is empty; documented food endpoint is not exposed
Status: OPEN — API CONTRACT HIGH
Location: `apps/backend/src/modules/recommendation-intelligence/controllers/recommendation-intelligence.controller.ts`.

### PB-163 — Current State documentation overstates Recommendation Intelligence implementation/wiring
Status: OPEN — DOCUMENTATION/ARCHITECTURE
Location: `apps/backend/docs/05_CURRENT_STATE.md` versus current source/module wiring.

### PB-164 — GoalIntelligenceModule is source-present but not runtime-wired
Status: OPEN — ARCHITECTURE/FEATURE
Location: `apps/backend/src/modules/goal-intelligence/goal-intelligence.module.ts` and import graph.

### PB-165 — Goal Intelligence service cluster is placeholder-level and disconnected
Status: OPEN — ARCHITECTURE/DESIGN
Locations: Goal Intelligence service cluster.

### PB-166 — Goal Intelligence has no direct service tests in inspected tree
Status: OPEN — TEST GAP

### PB-168 — Dashboard default date/weekly boundary is UTC-based
Status: OPEN — TIMEZONE HIGH
Location: `apps/backend/src/modules/dashboard/dashboard.service.ts` date normalization/range helpers.

### PB-169 — Daily Command Center current-day workout query has no upper date bound
Status: OPEN — TIME/LOGIC HIGH
Location: `apps/backend/src/modules/daily-command-center/daily-command-center.service.ts` workout query.

### PB-170 — Device Intelligence endpoint is publicly reachable without auth guard
Status: OPEN — SECURITY HIGH
Location: `apps/backend/src/modules/device-intelligence/controllers/device-intelligence.controller.ts`.

### PB-171 — Active FitnessController reads req.user.sub although JWT strategy exposes User.id
Status: OPEN — AUTH/SECURITY HIGH
Locations: `auth/strategies/jwt.strategy.ts`, active `fitness/controllers/fitness.controller.ts`.

### PB-172 — Refresh-token rotation leaves old refresh session valid after successful refresh
Status: OPEN — SECURITY HIGH
Locations: `auth/auth.service.ts`, `auth/services/session.service.ts`.

### PB-173 — Application-level auth rate limiting/security headers are not observed
Status: OPEN — SECURITY DESIGN REVIEW
Locations: `bootstrap.ts`, `main.ts`, backend package manifest. External reverse-proxy controls remain unknown.

### PB-174 — Mobile Price History ignores explicit snapshot currency and always renders تومان
Status: OPEN — DATA/UX HIGH
Location: `apps/mobile/app/price-history.tsx`.

### PB-175 — Mobile Price History chart fabricates zero as observed minimum
Status: OPEN — DATA PRESENTATION
Location: `apps/mobile/app/price-history.tsx`.

### PB-176 — Push registration helpers have no application lifecycle consumer
Status: OPEN — FEATURE/INTEGRATION HIGH
Location: `apps/mobile/lib/notifications/push-registration.ts`.

### PB-177 — Notification runtime bootstrap has no application lifecycle consumer
Status: OPEN — FEATURE/INTEGRATION HIGH
Location: `apps/mobile/lib/notifications/push-runtime.ts`.

### PB-178 — Notification action feedback builder has no active consumer/transport
Status: OPEN — FEATURE/INTEGRATION
Location: `apps/mobile/lib/notifications/notification-actions.ts`.

### PB-179 — Mobile TypeScript typecheck excludes test files
Status: OPEN — TEST/STATIC
Location: `apps/mobile/tsconfig.json`.

### PB-180 — Mobile voice/TTS imports undeclared expo-speech dependency
Status: OPEN — BUILD/DEPENDENCY
Locations: `apps/mobile/lib/voice.ts`, `apps/mobile/package.json`.

### PB-181 — Mobile Voice/TTS feature has no active app consumer
Status: OPEN — FEATURE/INTEGRATION
Location: `apps/mobile/lib/voice.ts`.

### PB-182 — Mobile auth tokens stored in AsyncStorage instead of secure credential storage
Status: OPEN — SECURITY HIGH
Location: `apps/mobile/lib/api.ts`.

### PB-183 — Mobile component layer contains duplicate/orphaned animation wrappers
Status: OPEN — ARCHITECTURE/INTEGRATION
Locations: `apps/mobile/components/AnimatedPressable.tsx`, `AnimatedSection.tsx`, `apps/mobile/lib/motion.tsx`.

### PB-184 — Mobile command-center visual components use hardcoded English outside global localization policy
Status: OPEN — LOCALIZATION
Locations: `apps/mobile/components/decision-trace-card.tsx`, `plan-status-card.tsx`.

### PB-185 — Mobile TTS preparation script downloads executable model assets without checksum verification
Status: OPEN — SUPPLY CHAIN
Location: `apps/mobile/scripts/prepare-khadijah-tts-model.cjs`. This is a specific surface of PB-129 and must not be double-counted.

### PB-186 — Mobile Brain Context helper targets an unexposed backend route
Status: OPEN — BACKEND↔MOBILE CONTRACT MEDIUM
Locations: `apps/mobile/lib/api.ts` `getBrainContext()`, `apps/backend/src/modules/brain-integration/controllers/brain-integration.controller.ts`.
Evidence: helper requests `/brain-integration/context`; controller has no route methods; repository search found no screen/component consumer beyond the helper. This is stale/unusable contract debt, not a proven currently user-triggered failure.

### PB-187 — Auth persisted refresh-session expiry is hard-coded to 30 days while refresh JWT lifetime is configurable
Status: OPEN — AUTH/CONFIG CONTRACT
Location: `apps/backend/src/modules/auth/auth.service.ts` versus `token.utils.ts`/`AppConfigService`.

### PB-188 — Recipe content importer uses Prisma models absent from final Prisma schema
Status: OPEN — DATA/BUILD/RUNTIME HIGH
Location: `apps/backend/scripts/recipe-content-import.mjs`, calls to `prisma.recipeStep.*` and `prisma.recipeMedia.*`.
Evidence: importer uses generated `PrismaClient`, while the audited final `schema.prisma` does not declare `RecipeStep` or `RecipeMedia`; those tables exist only in migration SQL. Impact: current generated client will not expose these delegates, so execution is expected to fail at these calls. Root cause: operational importer/schema drift.

### PB-189 — Recipe image dataset importer has a destructive global RESET path
Status: OPEN — OPERATIONAL SAFETY HIGH
Location: `apps/backend/scripts/recipe-image-dataset-import-v2.mjs`, `RESET`/`resetState()`.
Evidence: setting `RECIPE_IMAGE_RESET=1` causes the script to enumerate/delete Storage objects under `recipes`, then execute DELETE against all `recipe_images` rows with `image_type=eq.hero` and all `recipe_image_import_attempts` rows where `recipe_id` is not null. There is no interactive confirmation or environment safety gate. Impact: an operator can accidentally erase the complete hero-image dataset/attempt history before re-importing; this is especially dangerous because the script is operational and uses a Supabase service-role credential. Audit did not execute the reset path.

### PB-190 — Recipe country-intelligence LIMIT mode deletes prior global classification state before processing only the limited subset
Status: OPEN — DATA/OPERATIONAL HIGH
Location: `apps/backend/scripts/recipe-country-intelligence-final.mjs`, `LIMIT`, `DELETE FROM recipe_country_relations`, `DELETE FROM recipe_intelligence_profiles`.
Evidence: `LIMIT > 0` restricts `base`/temporary recipe selection, but the script deletes all rows whose `source` matches the final version and all matching intelligence profiles without applying the same LIMIT. It then re-inserts/updates only the selected subset. Impact: running the script with a bounded LIMIT as a batch/test can erase previously classified recipes outside that batch, leaving partial classification state. Root cause: global cleanup is not scoped to the limited work set.

### PB-191 — Canonical root Current State file was missing; active state document lives under backend subtree
Status: OPEN — DOCUMENTATION/SOURCE-OF-TRUTH
Locations: required `docs/05_CURRENT_STATE.md`; existing `apps/backend/docs/05_CURRENT_STATE.md`.
Evidence: direct read of the audit branch showed `docs/05_CURRENT_STATE.md` was absent while `apps/backend/docs/05_CURRENT_STATE.md` exists. Impact: the session protocol's canonical state path was not available and project state can split between root and backend documentation. Root file has now been created as a canonical audit location, but the two documents still require deliberate reconciliation and ownership cleanup; this finding is not considered closed.

### PB-192 — Recipe content importer has no dataset offset/checkpoint; each invocation reprocesses only the first batch
Status: OPEN — OPERATIONAL/RESTARTABILITY
Location: `apps/backend/scripts/recipe-content-import.mjs`, `main()` and `const batch = dataset.slice(0, BATCH_SIZE)`.
Evidence: the importer always loads the full dataset and selects only indexes `0..BATCH_SIZE-1`; there is no offset, cursor, checkpoint file, persisted import-progress state, or environment variable that changes the starting index. Impact: a dataset larger than the batch cannot be advanced through repeat invocations using the wired command alone, and reruns repeatedly revisit the same first batch. This violates the MYPA background/batch restartability requirement.

### PB-193 — Recipe content importer performs related writes outside a transaction, allowing partial persistence on late failure
Status: OPEN — DATA INTEGRITY HIGH
Location: `apps/backend/scripts/recipe-content-import.mjs`, `importRecipe()`.
Evidence: recipe create/update, child deletes, `recipeIngredient` inserts and later `recipeStep`/`recipeMedia` operations are separate Prisma calls with no surrounding `prisma.$transaction`. Because PB-188 causes the generated Prisma client to fail when `recipeStep`/`recipeMedia` delegates are reached, earlier recipe/ingredient mutations can remain persisted even when that recipe import returns `failed`. Impact: one broken late-stage dependency can leave a partially imported recipe and repeated reruns can further churn that state.

### PB-194 — Recipe image operational scripts hard-limit assets to 60KB, diverging from the MYPA image-processing target
Status: OPEN — PRODUCT/ASSET CONTRACT
Locations: `apps/backend/scripts/recipe-image-dataset-import-v2.mjs`, `apps/backend/scripts/recipe-image-import.mjs`, `apps/backend/scripts/recipe-image-import-all-safe.mjs` (`MAX_BYTES = 60 * 1024`).
Evidence: the inspected operational image import paths explicitly target WebP output at or below 60KB, while the Master Prompt's image-processing contract sets a target of approximately 100–150KB for mobile-friendly quality. Impact: the current operational cap is materially below the defined target and may force unnecessary quality/dimension degradation; the canonical image pipeline policy is therefore not aligned across implementation and project requirements.

### PB-195 — Multiple versioned country-intelligence implementations remain executable and only one is package-wired
Status: OPEN — OPERATIONAL/ARCHITECTURE DRIFT
Locations: `apps/backend/scripts/recipe-country-intelligence.mjs`, `recipe-country-intelligence-v2.mjs`, `recipe-country-intelligence-v3.mjs`, `recipe-country-intelligence-v4.mjs`, `recipe-country-intelligence-v5.mjs`, `recipe-country-intelligence-v6.mjs`, `recipe-country-intelligence-v7-source.mjs`, `recipe-country-intelligence-v8-source-evidence.mjs`, `recipe-country-intelligence-final.mjs`, and `apps/backend/package.json`.
Evidence: the script directory contains a sequence of independently maintained country-intelligence implementations, while `apps/backend/package.json` exposes only `recipe-intelligence:country` mapped to `recipe-country-intelligence-final.mjs`. No canonical retirement/archive marker is encoded in the script directory itself. Impact: operators can manually execute legacy variants with behavior different from the wired command, making reproducibility and operational ownership ambiguous. This is an audit finding until the variants are reconciled, archived, or explicitly designated.

### PB-196 — Reprocess-quality LIMIT is positional, not restartable
Status: OPEN — OPERATIONAL/RESTARTABILITY
Location: `apps/backend/scripts/recipe-image-reprocess-quality.mjs`, `existingRows()` and `main()`.
Evidence: `existingRows()` fetches all hero-image rows ordered by `recipe_id.asc` and, when `RECIPE_IMAGE_REPROCESS_LIMIT > 0`, returns only `rows.slice(0, LIMIT)`. There is no offset, stable checkpoint, cursor, or processed-state marker. Impact: a bounded rerun always targets the first N rows again; an operator cannot safely advance through successive bounded passes using the exposed limit alone. This is inconsistent with the project requirement that long-running work be batchable and restartable.

### PB-197 — Image importer family uses conflicting `image_type`/storage contracts across executable variants
Status: OPEN — OPERATIONAL/ARCHITECTURE DRIFT
Locations: `apps/backend/scripts/recipe-image-import.mjs`, `apps/backend/scripts/recipe-image-import-all.mjs`, `apps/backend/scripts/recipe-image-import-all-safe.mjs`, `apps/backend/scripts/recipe-image-dataset-import-v2.mjs`, `apps/backend/package.json`.
Evidence: the wired `recipe-images:import` script uses `image_type='primary'` and storage key `recipes/<recipeId>/primary.webp`; the wired dataset importer uses `image_type='hero'` and `recipes/<recipeId>/hero.webp`; legacy `recipe-image-import-all.mjs` also writes `primary`, while `recipe-image-import-all-safe.mjs` writes `hero`. They also use materially different candidate matching and pass semantics. Impact: manually running a different executable importer can create a second image contract for the same recipe and leave both primary/hero records, making downstream selection ambiguous. This is not yet shown to cause a live user failure because runtime DB state was not executed/inspected in this session.

### PB-198 — Final food-intelligence self-test exists but is not package/CI-wired in the inspected operational scripts
Status: OPEN — TEST/QA
Locations: `apps/backend/scripts/food-intelligence-final-self-test.mjs`, `apps/backend/package.json`.
Evidence: the final self-test directly imports `food-entity-resolver-final.mjs` and `localized-food-entity-resolver-final.mjs` and checks canonical IDs, localized aliases and quantity normalization. The inspected package manifest wires the production-facing intelligence scripts but does not expose a corresponding script command for this final self-test, and no CI invocation was observed during this scope. Impact: the strongest direct resolver regression suite exists but is not automatically exercised by the normal package/CI path, allowing final resolver regressions to escape routine validation.

### PB-199 — Recommendation quality score normalization conflicts with the ingest score scale
Status: OPEN — LOGIC HIGH
Locations: `apps/backend/scripts/recipe-ingest.mjs`, `scoreRecipe()`/`quality_score` write, and `apps/backend/scripts/recipe-recommendation-score.mjs`, `scoreRecipe()` quality calculation.
Evidence: `recipe-ingest.mjs` computes `quality.score` as a bounded fractional value (for example additions `0.12`, `0.06`, etc., with a maximum below 1) and writes that value directly to `recipes.quality_score`. The recommendation scorer later computes `const quality = Number(recipe.quality_score) > 0 ? clamp(Number(recipe.quality_score) / 100) : 0.6;`. A stored value such as `0.82` therefore becomes `0.0082`, effectively turning the 4% quality component into near-zero contribution. Root cause: producer/consumer disagree on the quality score unit (fraction versus percentage). Impact: verified recipe quality has almost no effect on deterministic ranking when a positive stored score exists.

### PB-200 — Nutrition estimation uses hard-coded nutrient constants/conversions without ingredient-data provenance
Status: OPEN — DATA QUALITY/PROVENANCE
Location: `apps/backend/scripts/recipe-nutrition-estimate.mjs`, `FOOD` table, `gramsFromLine()`, and `estimate()`.
Evidence: the script embeds fixed calories/protein/carbs/fat constants for named foods and fixed household-volume conversions such as `cup -> 150g`, `tbsp -> 14g`, `tsp -> 4.2g`; the resulting evidence records matched ingredient names and grams but does not retain a source identifier/version for those nutrient constants or conversion rules. The output is labeled `estimated:true` and has a confidence, so this is not being classified as a hidden verified-value issue. Impact: future recipe decisions cannot trace the numeric source/version used for an estimate, weakening the project's required nutrition provenance and making recalculation/audit difficult.

### PB-201 — Dataset importer RESET deletes global DB rows but only enumerates first 1000 Storage objects
Status: OPEN — OPERATIONAL/DATA INTEGRITY HIGH
Location: `apps/backend/scripts/recipe-image-dataset-import-v2.mjs`, `resetState()`.
Evidence: reset lists bucket objects once with `prefix: 'recipes'`, `limit: 1000`, `offset: 0`, deletes every returned Storage object, then issues global DELETE requests for all hero `recipe_images` and all non-null `recipe_image_import_attempts`. There is no pagination through subsequent Storage objects. Impact: with more than 1000 recipe objects, RESET can remove all corresponding DB records while leaving Storage files beyond the first 1000 orphaned, causing storage leakage and an inconsistent DB/Storage state. No reset execution was performed during the audit.

### PB-202 — Wired recipe image importer only inspects first 1000 existing images/skip attempts
Status: OPEN — DATA/OPERATIONAL HIGH
Location: `apps/backend/scripts/recipe-image-import.mjs`, `getMissingRecipes()`.
Evidence: `imageRows` is fetched from `recipe_images?select=recipe_id&image_type=eq.primary&limit=1000` and skipped attempts from `recipe_image_import_attempts?...&limit=1000`; neither query paginates, while the recipe scan itself paginates through `recipes`. Impact: once more than 1000 primary-image rows or skipped attempts exist, recipes represented only in later pages are treated as missing/unattempted and can be reprocessed; depending on unique constraints this can cause duplicate/failed writes and unnecessary external downloads. Root cause: asymmetric pagination between the source recipe list and existing-state sets.

## Reconciliation note
Preserve oldest canonical IDs when the same root cause already exists elsewhere. PB-112 and PB-167 are correction-trail IDs only. PB-185 is a specific surface of PB-129 and must not be double-counted.
