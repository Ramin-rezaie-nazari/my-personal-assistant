# Audit Findings Appendix

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: selected LifeTasks, Recommendation Intelligence, Goal Intelligence, Content, Dashboard/Daily Command Center, Auth/JWT, Mobile notification/voice/native/test/runtime, Mobile components/motion/scripts, backend route/controller inventory, selected backend↔mobile consumers, initial BATCH-0013 operational recipe import scripts, and active country-intelligence script.
Scope not yet read: remaining repository-wide source/tests/consumers, full matrices, exhaustive operational scripts, runtime execution, complete security/privacy reconciliation.
Evidence roots: corresponding source paths under `apps/backend/src/modules/`, `apps/backend/prisma/`, `apps/backend/scripts/`, `apps/mobile/`, `.github/workflows/`, `docs/project-brain/`.
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
Evidence: setting `RECIPE_IMAGE_RESET=1` causes the script to enumerate/delete Storage objects under `recipes`, then execute DELETE against all `recipe_images` rows with `image_type=hero` and all `recipe_image_import_attempts` rows where `recipe_id` is not null. There is no interactive confirmation or environment safety gate. Impact: an operator can accidentally erase the complete hero-image dataset/attempt history before re-importing; this is especially dangerous because the script is operational and uses a Supabase service-role credential. Audit did not execute the reset path.

### PB-190 — Recipe country-intelligence LIMIT mode deletes prior global classification state before processing only the limited subset
Status: OPEN — DATA/OPERATIONAL HIGH
Location: `apps/backend/scripts/recipe-country-intelligence-final.mjs`, `LIMIT`, `DELETE FROM recipe_country_relations`, `DELETE FROM recipe_intelligence_profiles`.
Evidence: `LIMIT > 0` restricts `base`/temporary recipe selection, but the script deletes all rows whose `source` matches the final version and all matching intelligence profiles without applying the same LIMIT. It then re-inserts/updates only the selected subset. Impact: running the script with a bounded LIMIT as a batch/test can erase previously classified recipes outside that batch, leaving partial classification state. Root cause: global cleanup is not scoped to the limited work set.

## Reconciliation note
Preserve oldest canonical IDs when the same root cause already exists elsewhere. PB-112 and PB-167 are correction-trail IDs only. PB-185 is a specific surface of PB-129 and must not be double-counted.
