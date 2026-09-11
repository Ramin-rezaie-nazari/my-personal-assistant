# Audit Findings Appendix

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: selected LifeTasks, Recommendation Intelligence, Goal Intelligence, Content, Dashboard/Daily Command Center, Auth/JWT, Mobile notification/voice/native/test/runtime, Mobile components/motion/scripts, backend route/controller inventory, selected backend↔mobile consumers, initial BATCH-0013 operational recipe import scripts, active country-intelligence script, continued operational-script/legacy-variant review including recipe image reprocessors, food entity resolvers, recipe intelligence classify/profile/nutrition/score, relevant recipe migrations, local recipe-image pipeline variants, backend common/config/bootstrap/database/i18n/image boundary, historical high-value PR/branch reconciliation, continued Mobile domain-client review, CI/release/onboarding/session lifecycle review, raw-SQL destructive-operation sweep, Brain history/retention implementation and conversation persistence/deletion paths, account-erasure surface; backend CI/E2E database lifecycle; duplicate UsersController and HealthController reconciliation; root repository docs/roadmap; Mobile app/package/config/runtime entrypoints and selected route screens including assistant, auth, brain overview, calendar, command center v2, daily, plus mobile notification registration/runtime and local Persian TTS; additional Mobile routes habits, inventory, insights, language, meals, meal-builder, meal detail, notifications, reminders, onboarding, price-history, recipe-match, shopping, smart-meals, supplements, yoga; Mobile i18n contract.
Scope not yet read: remaining repository source outside current audited trees, full matrices, exhaustive operational scripts, runtime execution, complete security/privacy reconciliation.
Evidence roots: corresponding source paths under `apps/backend/src/modules/`, `apps/backend/prisma/`, `apps/backend/scripts/`, `apps/backend/`, `apps/mobile/`, `.github/workflows/`, `docs/`, `docs/project-brain/`.
Confidence: HIGH for source-level findings below unless explicitly marked validation-needed.

## Correction log

### PB-112 — NOT_APPLICABLE
Earlier audit text said Mobile Brain `execute-next`/feedback routes were missing. That was disproven. `apps/backend/src/modules/personal-brain/controllers/decision-execution.controller.ts` exposes `POST /personal-brain/decision/execute-next` and `POST /personal-brain/decision/confirm`, both JWT guarded. `apps/backend/src/modules/personal-brain/controllers/decision-feedback.controller.ts` exposes `POST /personal-brain/decision/feedback`, also JWT guarded. No repair is required for the original PB-112 route-existence claim.

### PB-167 — NOT_APPLICABLE
Earlier appendix text said `ContentModule` was orphaned. That was disproven by direct inspection of `apps/backend/src/app.module.ts`, which imports `ContentModule` in the active Nest `imports` array. The old PB-167 statement is not an open issue and must not be counted.

### PB-171 — CORRECTED SCOPE
The earlier PB-171 wording incorrectly included `apps/backend/src/modules/users/users.controller.ts` as an active affected controller. The active `UsersModule` imports `apps/backend/src/modules/users/controllers/users.controller.ts`, whose methods correctly read `req.user.id` under the current `JwtStrategy` return shape. The root-level `users.controller.ts` is a duplicate/orphan source file and is not the active controller. PB-171 therefore remains OPEN for `apps/backend/src/modules/fitness/controllers/fitness.controller.ts` only.

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

### PB-171 — Active FitnessController reads req.user.sub although JWT strategy exposes a loaded User object
Status: OPEN — AUTH/SECURITY HIGH
Location: `apps/backend/src/modules/fitness/controllers/fitness.controller.ts`, compared with `apps/backend/src/modules/auth/strategies/jwt.strategy.ts`.
Evidence: `JwtStrategy.validate()` returns `UsersService.findById(payload.sub)`, i.e. the loaded User object; the active Fitness controller reads `req.user.sub`. Impact: the authenticated identity contract is inconsistent and can yield an undefined user ID in that controller until the strategy/request typing or controller access is unified. Exact runtime manifestation remains unvalidated because the repo could not be executed locally in this session.

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
Locations: `apps/backend/scripts/recipe-image-dataset-import-v2.mjs`, `apps/backend/scripts/recipe-image-import.mjs`, `apps/backend/scripts/recipe-image-import-all-safe.mjs` (`MAX_BYTES = 60 * 1024`), plus `docs/recipe-image-data-architecture.md` processing contract.
Evidence: the inspected operational image import paths explicitly target WebP output at or below 60KB, and the root image-data architecture document also defines a hard maximum of 60KB, while the Master Prompt image-processing contract sets a target of approximately 100–150KB for mobile-friendly quality. Impact: the current operational/documented image cap is materially below the higher-level target and may force unnecessary quality/dimension degradation; the canonical image pipeline policy is not aligned across implementation documentation and project requirements.

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
Locations: `apps/backend/scripts/recipe-image-import.mjs`, `recipe-image-import-all.mjs`, `recipe-image-import-all-safe.mjs`, `recipe-image-dataset-import-v2.mjs`, `apps/backend/package.json`.
Evidence: the wired `recipe-images:import` script uses `image_type='primary'` and storage key `recipes/<recipeId>/primary.webp`; the wired dataset importer uses `image_type='hero'` and `recipes/<recipeId>/hero.webp`; legacy `recipe-image-import-all.mjs` also writes `primary`, while `recipe-image-import-all-safe.mjs` writes `hero`. They also use materially different candidate matching and pass semantics. Impact: manually running a different executable importer can create a second image contract for the same recipe and leave both primary/hero records, making downstream selection ambiguous. This is not yet shown to cause a live user failure because runtime DB state was not executed/inspected in this session.

### PB-198 — Final food-intelligence self-test exists but is not package/CI-wired in the inspected operational scripts
Status: OPEN — TEST/QA
Locations: `apps/backend/scripts/food-intelligence-final-self-test.mjs`, `apps/backend/package.json`. Evidence: the final self-test directly imports `food-entity-resolver-final.mjs` and `localized-food-entity-resolver-final.mjs` and checks canonical IDs, localized aliases and quantity normalization. The inspected package manifest wires the production-facing intelligence scripts but does not expose a corresponding script command for this final self-test, and no CI invocation was observed during this scope. Impact: the strongest direct resolver regression suite exists but is not automatically exercised by the normal package/CI path, allowing final resolver regressions to escape routine validation.

### PB-199 — Recommendation quality score normalization conflicts with the ingest score scale
Status: OPEN — LOGIC HIGH
Locations: `apps/backend/scripts/recipe-ingest.mjs`, `scoreRecipe()`/`quality_score` write, and `apps/backend/scripts/recipe-recommendation-score.mjs`, `scoreRecipe()` quality calculation.
Evidence: `recipe-ingest.mjs` computes `quality.score` as a bounded fractional value and writes that value directly to `recipes.quality_score`. The recommendation scorer later computes `const quality = Number(recipe.quality_score) > 0 ? clamp(Number(recipe.quality_score) / 100) : 0.6;`. A stored value such as `0.82` therefore becomes `0.0082`, effectively turning the quality component into a near-zero signal. Root cause: producer/consumer disagree on the quality score unit (fraction versus percentage). Impact: verified recipe quality has almost no effect on deterministic ranking when a positive stored score exists.

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

### PB-203 — Local guaranteed-v8 recipe image pipeline references missing executable scripts
Status: OPEN — OPERATIONAL/BUILD HIGH
Location: `apps/backend/scripts/recipe-images-local-guaranteed-v8.mjs`, `main()` calls to `./scripts/recipe-images-local-strict-v3.mjs`, `./scripts/recipe-images-local-gallery-upgrade-v1.mjs`, and `./scripts/recipe-images-local-status.mjs`.
Evidence: the v8 orchestrator invokes these three relative script paths. Direct branch reads for all three exact paths returned `Not Found`, while `recipe-images-local-guaranteed-v7.mjs` does exist. Because `run()` rejects on the child `error` event and `allowFailure=true` only handles non-zero child exit codes, a missing script path produces a rejected promise and stops the pipeline before completion. Impact: the v8 pipeline is not executable to completion from the audited repository state; this is a concrete broken operational entrypoint, not merely documentation drift.

### PB-204 — Country preference scoring reads fields that its own relation query does not select
Status: OPEN — LOGIC HIGH
Locations: `apps/backend/scripts/recipe-intelligence-classify.mjs` `globalCultureFit()` and `main()`, `apps/backend/scripts/recipe-recommendation-score.mjs` `globalCultureFit()` and `main()`.
Evidence: both scripts define `globalCultureFit()` to match user `preferred_countries` / `countries` against `r.iso2` or `r.country`, and user `preferred_regions` against `r.region`. However, their `recipe_country_relations` query selects only `recipe_id,country_id,relation_type,confidence,evidence`; no `iso2`, `country`, or `region` fields are present on the returned relation objects. Therefore the direct country/region preference branches cannot hit from this result shape, and culture fit falls back to `recipe.is_global` or the neutral fallback rather than the user's selected country/region. Root cause: consumer selection shape does not satisfy the helper's data contract. Impact: the documented deterministic cultural-preference signal is silently ineffective in these scripts until the relation data is joined/enriched or the helper is changed to use the selected `country_id` with an explicit country lookup.

### PB-205 — Mobile domain API clients bypass canonical 401 refresh/retry policy
Status: OPEN — API CONTRACT HIGH
Locations: `apps/mobile/lib/recipe-api.ts`, `shopping-api.ts`, `shopping-basket-api.ts`, `inventory-api.ts`, `assistant-api.ts`; comparison baseline `apps/mobile/lib/api.ts`, `calendar-api.ts`, `price-api.ts`, and `brain-execution.ts`.
Evidence: the affected domain clients obtain the stored access token and issue their own `fetch()`/request helpers without a 401→refresh→retry path, while central/baseline clients implement refresh/retry behavior explicitly. Impact: after access-token expiry, recipe, shopping, inventory, or assistant actions can fail while other domain surfaces transparently recover, producing inconsistent session behavior. Root cause: multiple domain clients duplicated transport/auth logic instead of using one canonical request interceptor.

### PB-206 — Recipe content release workflow calls undefined backend package scripts
Status: OPEN — CI/RELEASE HIGH
Location: `.github/workflows/recipe-content-release.yml`, `Import recipe corpus` and `Audit recipe corpus` steps, compared with `apps/backend/package.json`.
Evidence: the workflow runs `pnpm recipe:content:import` and `pnpm recipe:content:audit` from `apps/backend`. The audited `apps/backend/package.json` defines recipe image and recipe intelligence scripts but contains no `recipe:content:import` or `recipe:content:audit` entries. Repository search for these exact script names finds only the workflow references, not package definitions. Impact: the declared recipe content release/import pipeline cannot execute its intended commands. This is distinct from PB-188 because PB-188 concerns the importer implementation/schema mismatch; PB-206 concerns the workflow-to-package entrypoint contract itself.

### PB-207 — Mobile onboarding state is local-only and does not synchronize with backend onboarding/profile contracts
Status: OPEN — CROSS-LAYER DATA/FEATURE HIGH
Locations: `apps/mobile/app/onboarding.tsx` `finish()`, `apps/mobile/lib/onboarding.ts` `setOnboardingState()`/`getOnboardingState()`, backend `apps/backend/src/modules/onboarding/`, `profile/`, and Prisma `UserOnboarding`/`UserProfile`/`HealthProfile`/`NutritionProfile`.
Evidence: the mobile onboarding `finish()` path calls only `setOnboardingState({ ...state, completed: true })`, and `setOnboardingState()` persists the full onboarding payload exclusively into AsyncStorage under `@my-personal-assistant/onboarding`. The backend separately exposes authenticated onboarding/profile contracts and persists `UserOnboarding`, `UserProfile`, `HealthProfile` and `NutritionProfile`, but no call from the mobile onboarding flow synchronizes those records. Impact: a user can complete onboarding locally while the authenticated backend account remains unaware of collected personalization context; reinstall/multi-device/account-state flows can therefore diverge. This is distinct from PB-182/PB-071 because the core defect here is missing cross-layer synchronization, not merely the local storage mechanism.

### PB-208 — Refresh tokens are persisted in plaintext in the Session table
Status: OPEN — SECURITY HIGH
Locations: `apps/backend/src/modules/auth/services/session.service.ts`, Prisma `Session.refreshToken`, and `apps/backend/src/modules/auth/auth.service.ts` session creation path.
Evidence: `SessionService.create()` passes the caller-provided `refreshToken` directly into `this.prisma.session.create({ data })`; `Session.refreshToken` is a plain `String` field in the final Prisma schema. `AuthService.createAuthResponse()` creates the persisted session using the raw signed refresh token value. `findByRefreshToken()`, `deleteByRefreshToken()`, and `revokeSession()` subsequently query/delete sessions by that same raw token. No hashing or one-way token representation is applied before persistence. Impact: compromise or read access of the session table would expose currently valid bearer refresh tokens directly. This is distinct from PB-172 rotation weakness and PB-187 lifetime drift because it concerns at-rest secret protection.

### PB-209 — Session `expiresAt` is stored but not enforced during refresh-token lookup
Status: OPEN — AUTH LIFECYCLE HIGH
Location: `apps/backend/src/modules/auth/services/session.service.ts`, `findByRefreshToken()`.
Evidence: `findByRefreshToken(refreshToken)` queries `Session` with `where: { refreshToken }` only and does not include `expiresAt: { gt: new Date() }` or an equivalent expiry check. The `Session` model does persist `expiresAt`, and `AuthService.createAuthResponse()` sets it, but successful session lookup is not gated by the stored expiry. Therefore a session whose persisted `expiresAt` has passed can still be returned to the refresh flow when its signed JWT is otherwise accepted. This is distinct from PB-187, which concerns the hard-coded 30-day persisted lifetime versus configurable JWT lifetime; PB-209 concerns failure to enforce the persisted expiry invariant at the database lookup boundary.

### PB-210 — Brain history retention policy is process-local and has no observed durable enforcement path
Status: OPEN — SECURITY/PRIVACY HIGH
Locations: `apps/backend/src/modules/personal-brain/services/decision-history-retention.service.ts`, `apps/backend/src/modules/assistant/services/conversation-history.service.ts`, and the related Brain architecture documentation.
Evidence: `DecisionHistoryRetentionService` stores per-user policies in an in-memory `Map<string, HistoryRetentionPolicy>` and exposes only policy lookup, cutoff calculation, and `isExpired()` evaluation. Repository search found no production consumer of `setPolicy()` beyond the service test, and the persisted `ConversationHistoryService` provides explicit `deleteAll()`/`deleteSince()` methods but does not consult the retention service. The architecture documentation itself describes the retention service as a conceptual policy layer and states that durable retention deletion still needs explicit database cleanup wiring. Impact: a configured retention policy is lost on process restart and, more importantly, there is no observed production path that automatically deletes persisted conversation history when the policy expires. This weakens the project's privacy/retention contract for long-lived Brain history. No cleanup job execution was observed during the audit.

### PB-211 — No authenticated user-account erasure orchestration is exposed
Status: OPEN — SECURITY/PRIVACY HIGH
Locations: `apps/backend/src/modules/users/controllers/users.controller.ts`, `apps/backend/src/modules/users/users.service.ts`, and the persisted user-data model set.
Evidence: the active `UsersController` exposes only `GET /users/profile` and `PATCH /users/profile`, both behind `JwtAuthGuard`; there is no delete-account route. `UsersService` provides lookup/profile update/create methods only and no account-erasure method. Repository search for account deletion/erasure did not identify a user-facing deletion orchestration. Impact: there is no observed authenticated application path that can atomically or systematically erase a user's account and associated persisted personal data. This is distinct from PB-210: PB-210 is automatic history retention enforcement, while PB-211 is the absence of an end-user erasure workflow.

### PB-212 — Backend E2E preparation bypasses the CI migration path by using `prisma db push`
Status: OPEN — CI/DATABASE INTEGRITY HIGH
Locations: `.github/workflows/backend-ci.yml`, `apps/backend/test/prepare-e2e-db.cjs`.
Evidence: the backend CI job first runs `pnpm exec prisma migrate deploy` and a second idempotence deploy check against its Postgres service, then the `test:e2e` script invokes `test/prepare-e2e-db.cjs`. That preparation script executes `pnpm prisma db push` against `process.env.DATABASE_URL`; the repository does not contain the referenced `apps/backend/test/.env.test`, so the existing CI `DATABASE_URL` remains in effect rather than being replaced by a committed test-only database URL. Impact: the CI E2E phase can mutate the same database after the migration verification step using Prisma's schema-push mechanism instead of the migration history that production is expected to follow. This can mask migration/schema drift and means the E2E job does not validate the database state strictly produced by `prisma migrate deploy`. The finding is about the CI/database lifecycle contract; it is distinct from PB-188, which concerns an operational recipe importer using missing Prisma delegates.

### PB-213 — Duplicate orphan UsersController source exists beside the active UsersController
Status: OPEN — ARCHITECTURE/LEGACY DRIFT
Locations: `apps/backend/src/modules/users/users.controller.ts`, `apps/backend/src/modules/users/controllers/users.controller.ts`, `apps/backend/src/modules/users/users.module.ts`.
Evidence: the active `UsersModule` imports `./controllers/users.controller`, so `apps/backend/src/modules/users/controllers/users.controller.ts` is the runtime controller. A second `apps/backend/src/modules/users/users.controller.ts` defines another `UsersController` and exposes a different `/users/me` and `PATCH /users/me` contract, but the module does not import it and repository inspection found no active import consumer. Impact: two source files represent the same controller class name and domain with different route contracts and request-user typing, creating maintenance ambiguity and making stale contract discovery likely. The orphan file is not counted as active runtime behavior.

### PB-214 — Legacy root HealthController/HealthService is orphaned while roadmap still requires a public health endpoint
Status: OPEN — API/OPERATIONS HIGH
Locations: `apps/backend/src/modules/health/health.controller.ts`, `apps/backend/src/modules/health/health.service.ts`, `apps/backend/src/modules/health/controllers/health.controller.ts`, `apps/backend/src/modules/health/health.module.ts`, `apps/backend/docs/02_ROADMAP.md`.
Evidence: the repository retains a root `HealthController` exposing public `GET /health` and a matching `HealthService.check()` returning `{status:'ok', service:'My Personal Assistant API', timestamp}`. However, the active `HealthModule` imports only `./controllers/health.controller`, whose `/health` controller is JWT guarded and exposes `/health/profile` and `/health/nutrition` only. The roadmap explicitly lists a “Health endpoint” as a backend foundation requirement. Therefore the public liveness route represented by the root health controller is not registered by the active module, while a different protected health profile controller occupies the same route prefix. Impact: deployment/monitoring systems expecting the documented public `/health` endpoint may receive 401/not-found behavior instead of a liveness response, and the repository contains two competing health-controller concepts. Runtime HTTP behavior remains unvalidated in this session.

### PB-215 — Mobile Daily Command Center screen bypasses the app localization/RTL layer
Status: OPEN — LOCALIZATION/UX
Locations: `apps/mobile/app/daily.tsx`, compared with `apps/mobile/lib/i18n.ts` and the localization-aware screens such as `apps/mobile/app/calendar.tsx` and `apps/mobile/app/auth.tsx`.
Evidence: `apps/mobile/app/daily.tsx` does not import `getStoredLocale`, `AppLocale`, `isRTL`, or `t()` and instead hardcodes English labels/messages such as `TODAY`, `Your Command Center`, `Top priorities`, `Calories`, `Protein`, `Water`, `Habits`, `Supplements`, `Reminders`, `Retry`, and `Open calendar`. Its root `ScrollView`/layout has no locale-dependent RTL direction handling. In contrast, the mobile i18n layer provides persisted locale resolution and RTL support, and adjacent audited screens consume that layer. Impact: a user who selected Persian can be routed to the daily command-center surface while its headings/actions remain English and the layout does not adopt the application's RTL contract. This is separate from PB-184, which is specifically about the reusable command-center visual components; PB-215 covers the full daily route screen.

### PB-216 — Multiple Mobile secondary routes bypass the app localization/RTL layer
Status: OPEN — LOCALIZATION/UX HIGH
Locations: `apps/mobile/app/habits.tsx`, `apps/mobile/app/inventory.tsx`, `apps/mobile/app/insights.tsx`, `apps/mobile/app/meals.tsx`, `apps/mobile/app/meal-builder.tsx`, `apps/mobile/app/meal/[id].tsx`, `apps/mobile/app/shopping.tsx`, `apps/mobile/app/smart-meals.tsx`, `apps/mobile/app/recipe-match.tsx`, `apps/mobile/app/supplements.tsx`, compared with `apps/mobile/lib/i18n.ts` and localization-aware routes such as `apps/mobile/app/calendar.tsx`, `apps/mobile/app/reminders.tsx`, `apps/mobile/app/notifications.tsx`.
Evidence: all listed inspected routes omit the mobile i18n contract (`getStoredLocale`, `AppLocale`, `isRTL`, or `t`) and hardcode English UI copy. Examples include `Build your rhythm`/`Add a daily habit`/`Remove habit` in habits, `Inventory`/`Need attention`/`Smart Basket` in inventory, `What I noticed`/`Try again` in insights, `Meals`/`Suggest`/`Log meal` in meals, `Build your meal`/`Find a food`/`Save meal` in meal-builder, `Meal Details`/`Ingredients`/`Back to meals` in the meal detail route, `Your basket`/`Running low` in shopping, `What should you eat next?`/`Retry`/`Open Inventory` in smart-meals, `Cook with what you have`/`Add missing ingredients` in recipe-match, and `Supplements`/`Add a supplement`/`Taken`/`Delete` in supplements. None of these routes applies the locale-dependent RTL direction that the shared i18n layer provides. Impact: Persian users can navigate from localized surfaces into major secondary features that remain English/LTR, producing inconsistent UX and violating the documented language contract that the assistant uses the selected language everywhere. The finding is grouped because the same route-level omission repeats across these screens; it remains separate from PB-215 (Daily screen) and PB-184 (reusable command-center components). `apps/mobile/app/yoga.tsx` was inspected separately: it mixes Persian and English UI but does not consume the shared i18n layer either; it remains a related localization candidate pending final route-policy consolidation.

### PB-217 — Mobile Meals route violates React Hook call-order invariant
Status: OPEN — RUNTIME/BUILD HIGH
Location: `apps/mobile/app/meals.tsx`, `MealsScreen()`.
Evidence: `useCallback`, `useEffect`, and `useState` are declared at the top of the component, but `useMemo(() => meals.filter(...), [meals, query])` is declared only after `if (loading) return <View ... />`. On the initial render `loading` is `true`, so the `useMemo` hook is skipped; after `load()` sets `loading` to `false`, the same component instance reaches `useMemo`. This changes the number/order of hooks between renders, violating React's Rules of Hooks and potentially producing a hooks-order runtime error or unstable state behavior.
Impact: the Meals screen can fail or behave unpredictably exactly when transitioning from its loading state to its loaded state. This is independent of the existing PB-216 localization finding and is a concrete runtime correctness issue. Runtime execution was not possible in this audit because the repository could not be run locally.

### PB-218 — Mobile command action helper returns hardcoded English user-facing messages
Status: OPEN — LOCALIZATION/UX
Location: `apps/mobile/lib/command-actions.ts`, `runQuickCommand()`; consumer `apps/mobile/app/command-center-v2.tsx`.
Evidence: `runQuickCommand()` returns literal English user-facing messages for every action (`500 ml water logged.`, `20 min walk logged.`, `45 min strength workout logged.`, `Reminder created for 20:00.`). `command-center-v2.tsx` directly assigns `result.message` into `setActionMessage()`, so these strings bypass the shared `apps/mobile/lib/i18n.ts` translation layer even though the screen itself loads locale state. Impact: Persian users can see English action feedback inside an otherwise locale-aware command-center route, creating a second localization boundary violation outside PB-184's reusable visual components. This is distinct from PB-215 and PB-216 because it is rooted in the command-action domain helper/returned payload rather than the route's static UI copy.

## Reconciliation note
Preserve oldest canonical IDs when the same root cause already exists elsewhere. Correction-only IDs remain NOT_APPLICABLE/COVERED_BY notes and must not be double-counted.
