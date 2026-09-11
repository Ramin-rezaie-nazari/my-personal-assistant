# Audit Findings Appendix

Last updated: 2026-09-11
Review status: IN_PROGRESS

## Findings PB-156 through PB-242

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
Locations: `bootstrap.ts`, `main.ts`, backend package manifest.

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

### PB-188 — Recipe content operational scripts use Prisma models absent from the final Prisma schema
Status: OPEN — DATA/BUILD/RUNTIME HIGH
Locations: `apps/backend/scripts/recipe-content-import.mjs`, `apps/backend/scripts/recipe-content-audit.mjs`, calls to `prisma.recipeStep.*` and `prisma.recipeMedia.*`.
Evidence: both recipe-content importer and recipe-content audit create a generated `PrismaClient` and call `recipeStep`/`recipeMedia` delegates. The audited final `schema.prisma` does not declare `RecipeStep` or `RecipeMedia`; the corresponding tables exist only in migration SQL. Impact: current generated Prisma client is not expected to expose these delegates, so the intended importer/audit operations cannot execute against the final schema. Root cause: operational content scripts and final Prisma schema are out of sync.

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
Location: `apps/backend/scripts/recipe-content-import.mjs`, main() and `const batch = dataset.slice(0, BATCH_SIZE)`.
Evidence: the importer always loads the full dataset and selects only indexes `0..BATCH_SIZE-1`; there is no offset, cursor, checkpoint file, persisted import-progress state, or environment variable that changes the starting index. Impact: a dataset larger than the batch cannot be advanced through repeat invocations using the wired command alone, and reruns repeatedly revisit the same first batch. This violates the MYPA background/batch restartability requirement.

### PB-193 — Recipe content importer performs related writes outside a transaction, allowing partial persistence on late failure
Status: OPEN — DATA INTEGRITY HIGH
Location: `apps/backend/scripts/recipe-content-import.mjs`, `importRecipe()`.
Evidence: recipe create/update, child deletes, `recipeIngredient` inserts and later `recipeStep`/`recipeMedia` operations are separate Prisma calls with no surrounding `prisma.$transaction`. Because PB-188 causes the generated Prisma client to fail when `recipeStep`/`recipeMedia` delegates are reached, earlier recipe/ingredient mutations can remain persisted even when that recipe import returns `failed`. Impact: one broken late-stage dependency can leave a partially imported recipe and repeated reruns can further churn that state.

### PB-194 — Recipe image operational scripts hard-limit assets to 60KB, diverging from the MYPA image-processing target
Status: OPEN — PRODUCT/ASSET CONTRACT
Locations: `apps/backend/scripts/recipe-image-dataset-import-v2.mjs`, `recipe-image-import.mjs`, `recipe-image-import-all-safe.mjs` (`MAX_BYTES = 60 * 1024`), plus `docs/recipe-image-data-architecture.md` processing contract.
Evidence: the inspected operational image import paths explicitly target WebP output at or below 60KB, and the root image-data architecture document also defines a hard maximum of 60KB, while the Master Prompt image-processing contract sets a target of approximately 100–150KB for mobile-friendly quality. Impact: the current operational/documented image cap is materially below the higher-level target and may force unnecessary quality/dimension degradation; the canonical image pipeline policy is not aligned across implementation documentation and project requirements.

### PB-195 — Multiple versioned country-intelligence implementations remain executable and only one is package-wired
Status: OPEN — OPERATIONAL/ARCHITECTURE DRIFT
Locations: `apps/backend/scripts/recipe-country-intelligence.mjs`, `recipe-country-intelligence-v2.mjs`, `recipe-country-intelligence-v3.mjs`, `recipe-country-intelligence-v4.mjs`, `recipe-country-intelligence-v5.mjs`, `recipe-country-intelligence-v6.mjs`, `recipe-country-intelligence-v7-source.mjs`, `recipe-country-intelligence-v8-source-evidence.mjs`, `recipe-country-intelligence-final.mjs`, and `apps/backend/package.json`.
Evidence: the script directory contains a sequence of independently maintained country-intelligence implementations, while `apps/backend/package.json` exposes only `recipe-intelligence:country` mapped to `recipe-country-intelligence-final.mjs`. No canonical retirement/archive marker is encoded in the script directory itself. Impact: operators can manually execute legacy variants with behavior different from the wired command, making reproducibility and operational ownership ambiguous. This is an audit finding until the variants are reconciled, archived, or explicitly designated.

### PB-196 — Reprocess-quality LIMIT is positional, not restartable
Status: OPEN — OPERATIONAL/RESTARTABILITY
Location: `apps/backend/scripts/recipe-image-reprocess-quality.mjs`, existingRows() and main().
Evidence: `existingRows()` fetches all hero-image rows ordered by `recipe_id.asc` and, when `RECIPE_IMAGE_REPROCESS_LIMIT > 0`, returns only `rows.slice(0, LIMIT)`. There is no offset, stable checkpoint, cursor, or processed-state marker. Impact: a bounded rerun always targets the first N rows again; an operator cannot safely advance through successive bounded passes using the exposed limit alone. This is inconsistent with the project requirement that long-running work be batchable and restartable.

### PB-197 — Image importer family uses conflicting image_type/storage contracts across executable variants
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
Impact: the Meals screen can fail or behave unpredictably exactly when transitioning from its loading state to its loaded state. This is independent of the existing PB-216 localization finding and is a concrete runtime correctness issue. Runtime execution was not possible in this audit because the repo could not be run locally in this session.

### PB-218 — Mobile command action helper returns hardcoded English user-facing messages
Status: OPEN — LOCALIZATION/UX
Location: `apps/mobile/lib/command-actions.ts`, `runQuickCommand()`; consumer `apps/mobile/app/command-center-v2.tsx`.
Evidence: `runQuickCommand()` returns literal English user-facing messages for every action (`500 ml water logged.`, `20 min walk logged.`, `45 min strength workout logged.`, `Reminder created for 20:00.`). `command-center-v2.tsx` directly assigns `result.message` into `setActionMessage()`, so these strings bypass the shared `apps/mobile/lib/i18n.ts` translation layer even though the screen itself loads locale state. Impact: Persian users can see English action feedback inside an otherwise locale-aware command-center route, creating a second localization boundary violation outside PB-184's reusable visual components. This is distinct from PB-215 and PB-216 because it is rooted in the command-action domain helper/returned payload rather than the route's static UI copy.

### PB-219 — Mobile `brand.ts` is an apparently orphaned duplicate branding source
Status: OPEN — SOURCE HYGIENE/ARCHITECTURE
Locations: `apps/mobile/lib/brand.ts`, `apps/mobile/lib/branding.ts`, `apps/mobile/lib/branding.spec.ts`, `docs/branding.md`.
Evidence: `apps/mobile/lib/brand.ts` exports a complete `BRAND` object containing product name, scheme, colors, radius, spacing, and typography. Repository search for imports from `./brand` and for its distinctive exported symbol produced no matches, while the canonical branding implementation is `apps/mobile/lib/branding.ts`, which has an active test (`branding.spec.ts`) and is consumed by runtime branding components. Impact: the repository contains two branding sources with overlapping responsibilities, but only one is evidenced as active/canonical. An engineer updating `brand.ts` can create false confidence or leave stale visual/design values that are invisible to runtime; future feature code can also accidentally select the orphan source and reintroduce drift. This is source-hygiene/architecture debt; no direct runtime user failure was claimed.

### PB-220 — Recipe content audit orphan checks are logically non-functional
Status: OPEN — QA/LOGIC HIGH
Location: `apps/backend/scripts/recipe-content-audit.mjs`, initial `Promise.all()` orphan counters and the final gate.
Evidence: the script assigns `orphanMedia = await prisma.recipeMedia.count({ where: { recipeId: { not: undefined } } })`, which counts records having a defined/non-null recipeId rather than records whose referenced recipe is missing; it assigns `orphanSteps = await prisma.recipeStep.count()`, which counts all steps rather than orphan steps. The only subsequent validation is `if (orphanMedia < 0 || orphanSteps < 0) throw ...`, a condition that normal database counts cannot satisfy. Therefore the audit does not actually verify for orphaned recipe media/steps despite naming and printing those counters. Impact: even after PB-188's missing-model/schema issue is fixed, this audit gate could report success while real orphaned child rows remain, so the content-quality check is incomplete and can provide false assurance.

### PB-221 — Adaptive Learning defaults and weekly window are UTC-based rather than user-local
Status: OPEN — TIMEZONE/BEHAVIOR
Location: `apps/backend/src/modules/adaptive-learning/services/adaptive-learning.service.ts`, `getInsights()`, `dateKey` default and date-range helpers.
Evidence: when the caller omits `dateKey`, the service defaults to `new Date().toISOString().slice(0, 10)`, which uses UTC. The seven-day window then constructs `end` with `${dateKey}T23:59:59.999Z`, derives `start` with UTC calendar arithmetic, and converts it back through `toISOString().slice(0, 10)`. The service does not read the user's persisted timezone from `UserSettings` or another profile source before determining the current day/window. Impact: for users whose local date differs from UTC, Adaptive Learning can generate a seven-day insight window that is shifted across local midnight, causing daily-log/workout/meal records near the boundary to be attributed to the wrong day. This duplicates the broader timezone risk class seen in PB-168 but is a separate module-level implementation that needs its own correction.

### PB-222 — One-time mobile typecheck repair workflow is self-mutating and lacks its own toolchain setup
Status: OPEN — CI/SECURITY/OPERATIONS HIGH
Locations: `.github/workflows/mypa-mobile-typecheck-repair-once.yml`.
Evidence: the workflow grants `permissions: contents: write`, runs on pushes to `agent/mypa-autonomous-control-plane`, directly edits `apps/mobile/app/reminders-localized.tsx`, deletes itself, and pushes the resulting commit back to the branch. However, the job contains no `pnpm/action-setup`, `actions/setup-node`, dependency install, or Expo/Node toolchain setup before invoking `pnpm --filter @my-personal-assistant/mobile typecheck`. Its trigger is path-scoped only to changes in the workflow file itself. Impact: the workflow is not a normal validation job; it is an autonomous repository mutator that depends on an undeclared pre-existing runner environment for `pnpm`, and a malformed change to the repair script can automatically write code to the branch without a conventional review gate. This is distinct from the ordinary branch-validation workflow because that workflow has its own explicit toolchain setup and does not grant repository-write permission.

### PB-223 — Adaptive Learning provider stubs are registered but orphaned from the active learning flow
Status: OPEN — ARCHITECTURE/FEATURE
Locations: `apps/backend/src/modules/adaptive-learning/services/feedback-analysis.service.ts`, `apps/backend/src/modules/adaptive-learning/services/learning-memory.service.ts`, `apps/backend/src/modules/adaptive-learning/adaptive-learning.module.ts`, `apps/backend/src/modules/adaptive-learning/services/adaptive-learning.service.ts`, `apps/backend/docs/04_ARCHITECTURE_ATLAS.md`.
Evidence: `FeedbackAnalysisService.analyzeFeedback()` accepts no input, performs only `await Promise.resolve()`, and returns the literal `{ message: 'Feedback analyzed' }`. `LearningMemoryService.storeLearningEvent()` likewise accepts no event payload, performs only `await Promise.resolve()`, and returns `{ message: 'Learning event stored' }`. Both providers are registered in `AdaptiveLearningModule`, but the inspected `AdaptiveLearningController` and `AdaptiveLearningService` never inject or call either service. Repository search finds their symbol references only in their own files, the module registration, and architecture documentation, with no active business consumer. Impact: the repository presents feedback analysis and learning-memory capabilities as part of the Adaptive Learning architecture, but the registered implementations are non-functional stubs and disconnected from the actual insight-generation flow. This can create false confidence about learning/feedback persistence and is separate from PB-221, which concerns timezone-based insight-window correctness.

### PB-224 — Budget Intelligence root plan endpoint exposes a placeholder result instead of a real budget plan
Status: OPEN — FEATURE/API CONTRACT
Locations: `apps/backend/src/modules/budget-intelligence/controllers/budget-intelligence.controller.ts`, `apps/backend/src/modules/budget-intelligence/services/budget-intelligence.service.ts`.
Evidence: `GET /budget-intelligence` is exposed without `JwtAuthGuard` and directly calls `BudgetIntelligenceService.createPlan()`. That service accepts no user, budget, country, nutrition, or other context and returns only `{ message: 'Smart food budget plan created', budget: null, suggestions: [] }`. The same module has a real user-scoped `meal-plan` endpoint, so the root budget route is not merely a status endpoint; it presents itself as a budget plan API while returning no plan data. Impact: callers can receive a successful response that semantically claims a smart budget plan exists while carrying no budget or suggestions, creating a false-positive feature contract. The public exposure also prevents user-specific authorization/context from being applied to this placeholder route. Runtime HTTP manifestation remains unvalidated.

### PB-225 — Budget Intelligence FoodCostService is registered but has no active consumer and is placeholder-only
Status: OPEN — ARCHITECTURE/FEATURE
Locations: `apps/backend/src/modules/budget-intelligence/services/food-cost.service.ts`, `apps/backend/src/modules/budget-intelligence/budget-intelligence.module.ts`.
Evidence: `FoodCostService.estimateCost()` accepts no food/quantity/currency input, performs only `await Promise.resolve()`, and returns `{ message: 'Food cost estimated' }`. Repository search finds `FoodCostService` only in its own file and module registration; no controller or other production service injects or calls it. Impact: the module exposes a named cost-estimation capability at the architecture/provider level, but the implementation is a non-functional stub with no execution path. This can create false confidence about food-cost intelligence and is separate from PB-224, which concerns the public budget-plan endpoint.

### PB-226 — Assistant legacy Context/Reasoning/Recommendation providers are registered but disconnected from the active assistant flow
Status: OPEN — ARCHITECTURE/FEATURE
Locations: `apps/backend/src/modules/assistant/services/context.service.ts`, `reasoning.service.ts`, `recommendation.service.ts`, `apps/backend/src/modules/assistant/assistant.module.ts`, `apps/backend/src/modules/assistant/services/assistant.service.ts`, `apps/backend/docs/04_ARCHITECTURE_ATLAS.md`.
Evidence: `ContextService.buildContext()` accepts no context input and returns only `{ message: 'Context engine ready' }`. `RecommendationService.generateRecommendations()` accepts no input and returns `{ message: 'Recommendation engine ready' }`. `ReasoningService.analyze()` does contain a small local-plan implementation, but repository search finds no production consumer of `ReasoningService`; the active `AssistantService` instead uses `ContextualCommandService`, `PlanningService`, `LocalLanguageUnderstandingService`, and `BrainOrchestratorService`. `AssistantModule` still registers and exports these older providers, while the architecture atlas continues to list them as core Assistant services. Impact: the repository has a second, stale Assistant processing layer whose registered providers are not part of the active request path; future engineers can extend the wrong service or infer capabilities that are not actually wired. This is distinct from PB-223 because these providers belong to Assistant rather than Adaptive Learning, and from the active `PlanningService`/`ContextualCommandService` path.

### PB-227 — Decision Engine retains an unconsumed placeholder service and unused DTO beside the active decision path
Status: OPEN — ARCHITECTURE/API CONTRACT/TEST GAP
Locations: `apps/backend/src/modules/decision-engine/services/decision-engine.service.ts`, `apps/backend/src/modules/decision-engine/dto/create-decision.dto.ts`, `apps/backend/src/modules/decision-engine/decision-engine.module.ts`, `apps/backend/src/modules/decision-engine/controllers/decision-engine.controller.ts`.
Evidence: `DecisionEngineController.evaluate()` injects and calls `ActionDecisionService.generate()`, not `DecisionEngineService.makeDecision()`. The latter accepts no input and returns only `{ message: 'Decision generated', actions: [] }`; repository search finds `DecisionEngineService` references only in its own file, module registration, and architecture documentation. `CreateDecisionDto` contains `context` and `priority` fields but has no validation decorators and is not used by the active controller, which accepts only `dateKey`. There is also no direct `ActionDecisionService` spec or `RuleEvaluationService` spec in the inspected tree; only `DecisionScoringService` has a focused spec. Impact: the decision domain exposes stale placeholder service/DTO artifacts while the active controller uses a different service path, increasing maintenance ambiguity and leaving the active decision path with incomplete direct test coverage. This is not being treated as an active runtime failure of `GET /decision-engine`; it is an architecture/contract/test-quality finding.

### PB-228 — Personal Brain response planning ignores persisted user language and forces Persian
Status: OPEN — CROSS-LAYER LOCALIZATION/BEHAVIOR HIGH
Locations: `apps/backend/src/modules/conversation-engine/services/conversation-style.service.ts`, `apps/backend/src/modules/personal-brain/services/response-planning.service.ts`, `apps/backend/src/modules/personal-brain/types/response-planning-input.types.ts`, `apps/backend/src/modules/personal-brain/services/brain-orchestrator.service.ts`, `apps/backend/src/modules/personal-brain/services/brain-orchestrator.service.spec.ts`, persisted `UserSettings.language` contract.
Evidence: `ConversationStyleService.getDefaultStyle()` always returns `language: 'fa'`. `ResponsePlanningService.createPlan()` only receives `ResponsePlanningInput`, calls `getDefaultStyle()`, and writes `style.language` into the response plan. The active orchestrator path does not inject or pass the authenticated user's persisted `UserSettings.language` into response planning. The planner also contains English fallback strings, so the response can combine Persian language metadata with English message text. The `BrainOrchestratorService` spec mocks the response-planning service rather than asserting locale behavior. Impact: the active Personal Brain response layer is not aligned with the user's selected backend language preference and lacks a regression test for that contract. This is distinct from the Mobile route localization findings because it occurs in the active backend Brain response-generation path.

### PB-229 — Assistant MemoryService is registered as a non-functional orphan provider
Status: OPEN — ARCHITECTURE/FEATURE
Locations: `apps/backend/src/modules/assistant/services/memory.service.ts`, `apps/backend/src/modules/assistant/assistant.module.ts`, `apps/backend/docs/04_ARCHITECTURE_ATLAS.md`.
Evidence: `MemoryService.storeMemory()` accepts no memory payload and returns only `{ message: 'Memory engine ready' }`; `getMemories()` accepts no user/context and always returns `[]`. `AssistantModule` registers the provider, and the architecture atlas lists it as an Assistant component, but repository search found no active controller/service consumer of `MemoryService`. The active Assistant/Brain stack uses separate context, Brain-memory, and conversation-history services. Impact: the registered Memory capability is non-functional and disconnected from the live Assistant flow, creating stale architecture and false confidence about memory behavior. This is separate from PB-226 because PB-229 covers the dedicated memory provider and its empty storage/read implementation.

### PB-230 — Audit Findings Appendix is incomplete relative to the canonical Open Work catalog
Status: OPEN — PROJECT-BRAIN INTEGRITY HIGH
Locations: `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md`, `docs/project-brain/12_OPEN_WORK.md`.
Evidence: the current Appendix blob explicitly begins with `## Findings PB-156 through PB-229`, while the current `12_OPEN_WORK.md` contains canonical entries beginning at PB-001 and continues through later findings. Historical audit checkpoint records also refer to the earlier findings catalog, but the current Appendix version does not contain PB-001 through PB-155. Therefore the Project Brain has two incompatible issue catalogs: one retains the older IDs and the other omits them. Impact: the repository cannot currently serve as a complete, lossless audit source-of-truth; remediation planning or final closure based only on Appendix would silently lose 155 previously identified findings. This finding was not closed by reconstructing or inventing missing entries; exact historical Appendix text must be recovered from repository history before the catalog is considered frozen.

### PB-231 — Yoga pose pipeline can emit stale pose results after stop due to an uncancelled async analysis race
Status: OPEN — RUNTIME/CONCURRENCY MEDIUM-HIGH
Locations: `apps/mobile/lib/yoga-pose-pipeline.ts`, `apps/mobile/lib/yoga-pose-pipeline.spec.ts`.
Evidence: `YogaPosePipeline` subscribes to camera frames and calls `void this.process(frame, onPose)` for each frame. `process()` checks `this.stateValue.active` before `await this.provider.detect(frame)`, but it performs no active/session-token check after the await. `stop()` unsubscribes and marks `active:false`, but cannot cancel an already-running `detect()`. Therefore an analysis that was in flight before `stop()` can resolve afterward, mutate `analyzedFrames`, `lastConfidence`, and `lastCapturedAt`, and invoke `onPose` after the pipeline has been stopped. The existing `yoga-pose-pipeline.spec.ts` only verifies the unconfigured provider path and contains no stop/in-flight completion regression test. Impact: a stopped camera-analysis session can receive stale post-stop callbacks/state mutations, causing UI/session state to reflect frames that should no longer be accepted. Runtime execution was not available in this audit.

### PB-232 — Memory Intelligence POST contract is incompatible with the global ValidationPipe
Status: OPEN — API/RUNTIME HIGH
Locations: `apps/backend/src/modules/memory-intelligence/controllers/memory-intelligence.controller.ts`, `apps/backend/src/bootstrap.ts`.
Evidence: the active global `ValidationPipe` is configured with `whitelist: true` and `forbidNonWhitelisted: true`. The `MemoryIntelligenceController.remember()` endpoint accepts an inline `RememberMemoryBody` TypeScript interface rather than a decorated DTO; its `type`, `key`, `value`, and optional `importance` properties have no `class-validator` metadata. With `forbidNonWhitelisted`, request properties without validation metadata are treated as non-whitelisted. Consequently a normal `POST /memory-intelligence` body containing the documented memory fields is expected to be rejected by the global pipe before the controller handler can construct and persist the memory. Impact: the primary authenticated memory-write endpoint is effectively unusable until its body is represented by a validated DTO (or the validation policy is intentionally changed). This is distinct from PB-158 because it is a concrete runtime contract collision in the active Memory Intelligence endpoint, not merely a missing decorator audit on an inactive module.

### PB-233 — Active Goals write/check-in DTOs are incompatible with the global ValidationPipe
Status: OPEN — API/RUNTIME HIGH
Locations: `apps/backend/src/modules/goals/controllers/goals.controller.ts`, `apps/backend/src/modules/goals/dto/create-goal.dto.ts`, `update-goal.dto.ts`, `checkin-goal.dto.ts`, `apps/backend/src/bootstrap.ts`.
Evidence: `GoalsController` uses `@Body() CreateGoalDto`, `UpdateGoalDto`, and `CheckinGoalDto` for the active `POST /goals`, `PATCH /goals/:id`, and `POST /goals/:id/checkin` endpoints. All three DTO classes are plain TypeScript property declarations and contain no `class-validator` decorators. The global `ValidationPipe` enables `whitelist: true` and `forbidNonWhitelisted: true`, so ordinary request properties are not represented as allowed validation metadata and are expected to be rejected before reaching `GoalsService`. Impact: the primary Goals create/update/check-in write paths are effectively blocked by the project's own runtime validation policy until the DTOs are decorated/validated or the global policy is intentionally changed. This is grouped separately from PB-232 because the affected active domain and contracts are distinct.

### PB-234 — Active Calendar write endpoints have the same global ValidationPipe contract collision
Status: OPEN — API/RUNTIME HIGH
Locations: `apps/backend/src/modules/calendar/controllers/calendar.controller.ts`, `apps/backend/src/modules/calendar/dto/create-calendar-event.dto.ts`, `apps/backend/src/bootstrap.ts`.
Evidence: `CalendarController.createEvent()` binds `@Body() dto: CreateCalendarEventDto`, and the active `PATCH /calendar/:id` binds an inline body type directly. `CreateCalendarEventDto` contains only plain `title`, `type`, `startsAt`, and optional `endsAt` property declarations without `class-validator` metadata; the update body has no class DTO/validation metadata at all. The global `ValidationPipe` uses `whitelist: true` and `forbidNonWhitelisted: true`. Therefore normal calendar create/update body fields are expected to be rejected as non-whitelisted before the service receives them. Impact: active Calendar create/update routes are likely unusable under the project's own validation configuration until both write contracts are represented by validated DTOs (or the global policy is intentionally changed). Runtime HTTP execution is unverified in this session, so the finding is source-level with strong framework-contract evidence.

### PB-235 — Goal check-in performs two related database writes without a transaction
Status: OPEN — DATA INTEGRITY HIGH
Locations: `apps/backend/src/modules/goals/services/goals.service.ts`, `checkin()`, and migration `apps/backend/prisma/migrations/20260812112000_add_goals/migration.sql`.
Evidence: `GoalsService.checkin()` first inserts/updates a `GoalCheckin` row and then separately updates the parent `Goal` row; neither operation is enclosed in `prisma.$transaction()`. The migration shows `GoalCheckin.goalId` has a foreign key with `ON DELETE CASCADE` and a unique `(goalId,dateKey)` key, so the child and parent represent one logical check-in state. A failure between the two independent operations can leave the persisted check-in history and the parent goal's `progressPercent`/`status` out of sync. Impact: retrying or auditing goal progress can observe a check-in record that was accepted while the parent aggregate was not updated (or vice versa if future ordering changes), violating aggregate consistency. Runtime failure injection was not executed in this audit.

### PB-236 — Weekly habits reuse a daily-consecutive streak algorithm
Status: OPEN — LOGIC/DESIGN REVIEW
Location: `apps/backend/src/modules/habits/services/habits.service.ts`, `stats()`; related `Habit.frequency`/`targetPerWeek` contract in `apps/backend/src/modules/habits/dto/habit.dto.ts`.
Evidence: `stats()` computes `streak` by iterating the last 14 calendar days and incrementing only while every consecutive day has a log. The same helper is used for both `daily` and `weekly` habits. A weekly habit can legitimately have a target such as `targetPerWeek=1`, but two valid weekly completions on non-consecutive days will produce a streak of 1 rather than measuring consecutive successful weeks; conversely, the current algorithm treats daily consecutive logs as the universal streak unit regardless of `frequency`. Impact: the habit API can report a misleading streak for weekly habits and the shared helper does not encode the frequency-specific semantics implied by the domain model. The repository contains the separate PB-078 review of weekly summary possible-count semantics; PB-236 is specifically the streak-calculation unit/algorithm mismatch.

### PB-237 — User Intelligence event-write body is inline/unvalidated under the global ValidationPipe
Status: OPEN — API/RUNTIME HIGH
Locations: `apps/backend/src/modules/user-intelligence/controllers/user-intelligence.controller.ts`, `apps/backend/src/bootstrap.ts`.
Evidence: active `POST /user-intelligence/events` accepts `@Body() body: { action: BehaviorAction; context?: BehaviorContext }` as an inline TypeScript type, not a decorated DTO. The global `ValidationPipe` is configured with `whitelist: true` and `forbidNonWhitelisted: true`. The request properties `action` and `context` therefore have no validation metadata defining them as whitelisted fields and are expected to be rejected before `LearningService.learnFromAction()` executes. Impact: the active event-ingestion path used to feed User Intelligence learning can be blocked by the application's own validation contract. Runtime HTTP execution remains unverified in this audit.

### PB-238 — User Intelligence learning falls back to server timezone when behavior event metadata lacks hour/weekday
Status: OPEN — TIMEZONE/BEHAVIOR
Location: `apps/backend/src/modules/user-intelligence/services/learning.service.ts`, `buildProfile()`.
Evidence: when stored behavior metadata lacks numeric `hour` or `weekday`, the service derives them with `event.createdAt.getHours()` and `event.createdAt.getDay()`, i.e. the backend process's local timezone. There is no lookup of the user's persisted `UserSettings.timezone` in this path. Impact: behavior patterns such as best hours and weekday completion can be assigned to the server's timezone instead of the user's actual local timezone, causing cross-timezone users to receive shifted learning signals. This is distinct from PB-221 because PB-238 is the User Intelligence event-level fallback rather than Adaptive Learning's current-day/weekly window.

### PB-239 — User Intelligence UserProfileService is a registered placeholder provider with no active consumer
Status: OPEN — ARCHITECTURE/FEATURE
Locations: `apps/backend/src/modules/user-intelligence/services/user-profile.service.ts`, `apps/backend/src/modules/user-intelligence/user-intelligence.module.ts`, `apps/backend/src/modules/user-intelligence/controllers/user-intelligence.controller.ts`.
Evidence: `UserProfileService.buildProfile()` and `updateProfile()` accept no user/profile input, perform only `await Promise.resolve()`, and return placeholder messages (`User profile built` / `User profile updated`). `UserIntelligenceModule` registers and exports `UserProfileService`, but `UserIntelligenceController` injects only `UserIntelligenceService` and `LearningService`; repository search found no other consumer of `UserProfileService`. The active `GET /user-intelligence` path instead calls `UserIntelligenceService.getProfile()`, which reads `UserFact`, `UserInsight`, and behavioral learning. Impact: the named user-profile intelligence capability is non-functional and disconnected from the active route, creating a stale provider/API architecture and false confidence about profile synthesis. No runtime behavior is claimed beyond the source-level wiring evidence.

### PB-240 — Price Intelligence controller exposes collection/mutation surfaces without authentication or user scoping
Status: OPEN — SECURITY HIGH
Location: `apps/backend/src/modules/price-intelligence/controllers/price-intelligence.controller.ts`.
Evidence: `PriceIntelligenceController` declares `@Controller('price-intelligence')` but does not apply `JwtAuthGuard` at the controller or method level. In addition to read endpoints, it exposes `POST /price-intelligence/nightly/run`, which invokes the scheduler's collection path, and `POST /price-intelligence/nightly/preview`, plus `POST /price-intelligence/match`; no authorization check is present at the controller boundary and the nightly collection route accepts caller-supplied `productKeys`/`sourceIds`. Impact: an unauthenticated caller can invoke operational price-collection work and influence scheduler input, while the other intelligence surfaces are likewise publicly reachable. This is distinct from PB-170 and PB-224 because it concerns the Price Intelligence controller's missing auth boundary and includes an operational POST action.

### PB-241 — Shopping recipe-missing batch can partially persist basket changes on mid-batch failure
Status: OPEN — DATA INTEGRITY HIGH
Location: `apps/backend/src/modules/shopping/shopping.service.ts`, `addRecipeMissing()` and `addToBasket()`.
Evidence: `addRecipeMissing()` validates the recipe and filters the requested items, then iterates `for (const item of valid) await this.addToBasket(...)`. `addToBasket()` performs independent `findUnique`/`findFirst`/`update` or `create` operations with no enclosing `prisma.$transaction()`. If a later item fails after earlier items have already been added/updated, the earlier basket mutations remain committed and the method returns an error rather than an all-or-nothing result. The active controller exposes this operation through the authenticated Shopping route, and the Recipe Food Operating Loop also consumes the same service method, so this is an active cross-domain write path rather than an orphan helper. Impact: a recipe's missing-ingredient batch can leave a partially populated shopping basket, making retries non-idempotent from the user's perspective and potentially producing duplicate quantity increments on repeated attempts. This is distinct from PB-235 because it concerns the Shopping aggregate and batch write path, not Goal check-in parent/child consistency.

### PB-242 — Recipe image CI cannot install the repository dependencies with the committed lockfile
Status: OPEN — CI/BUILD HIGH
Locations: `.github/workflows/recipe-image-import.yml`, root `pnpm-lock.yaml`, `apps/backend/package.json`; CI run `34613481370` on `main` at `e38d4d16b0cf6e6ea714fa0bcc048e80187bcb3b`.
Evidence: the `Recipe image import` workflow uses `pnpm install --frozen-lockfile`. The observed GitHub Actions run `34613481370` failed in its `Install dependencies` step before the image-import step, so the workflow could not reach the intended job. The failure log reported `ERR_PNPM_OUTDATED_LOCKFILE` and specifically identified `sharp@^0.34.2` as missing from the lockfile, while also reporting lockfile entries for `prisma`, `supertest`, and `typescript` that are absent from the current package manifest and additional specifier/version mismatches. The workflow's toolchain setup itself completed successfully before this install failure. Impact: the committed dependency graph is not reproducible under the repository's own frozen-lockfile CI policy, and the recipe-image automation is currently blocked before execution. This is distinct from feature-script defects such as PB-203/194 because it prevents dependency installation at the workflow level.

## Correction log
- PB-112: NOT_APPLICABLE; execute-next/confirm/feedback routes exist and are JWT guarded.
- PB-167: NOT_APPLICABLE; ContentModule is imported by active AppModule.
- PB-171 scope corrected: Users controller is not affected; active Fitness controller only.

## Audit control note
Do not start remediation until the Master Prompt audit closure is genuinely complete. Preserve all existing finding IDs and never invent historical IDs. Runtime/build/device validation is still unverified because the repository could not be executed locally in this session.
