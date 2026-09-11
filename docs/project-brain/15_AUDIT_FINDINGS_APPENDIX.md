# Audit Findings Appendix

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: selected LifeTasks, Recommendation Intelligence, Goal Intelligence, Content, Dashboard/Daily Command Center, Auth/JWT, Mobile notification/voice/native/test/runtime, Mobile components/motion/scripts, backend route/controller inventory, selected backend↔mobile consumers, and initial BATCH-0013 operational recipe import scripts.
Scope not yet read: remaining repository-wide source/tests/consumers, full matrices, exhaustive operational scripts, runtime execution, complete security/privacy reconciliation.
Evidence roots: corresponding source paths under `apps/backend/src/modules/`, `apps/backend/prisma/`, `apps/backend/scripts/`, `apps/mobile/`, `.github/workflows/`, `docs/project-brain/`.
Confidence: HIGH for source-level findings below unless explicitly marked validation-needed.

## Correction log

### PB-112 — NOT_APPLICABLE
Earlier audit text said Mobile Brain `execute-next`/feedback routes were missing. That was disproven. `apps/backend/src/modules/personal-brain/controllers/decision-execution.controller.ts` exposes `POST /personal-brain/decision/execute-next` and `POST /personal-brain/decision/confirm`, both JWT guarded. `apps/backend/src/modules/personal-brain/controllers/decision-feedback.controller.ts` exposes `POST /personal-brain/decision/feedback`, also JWT guarded. No repair is required for the original PB-112 route-existence claim; the catalog retains it only as NOT_APPLICABLE/corrected false finding.

### PB-167 — NOT_APPLICABLE
Earlier appendix text said `ContentModule` was orphaned. That was disproven by direct inspection of `apps/backend/src/app.module.ts`, which imports `ContentModule` in the active Nest `imports` array. The old PB-167 statement is not an open issue and must not be counted.

## New findings

### PB-156 — LifeTasksModule is source-present but not runtime-wired
Status: OPEN — ARCHITECTURE/FEATURE
Locations: `apps/backend/src/modules/life-tasks/life-tasks.module.ts`, `apps/backend/src/app.module.ts`.
Evidence: `LifeTasksModule` exists with controller/service, but `AppModule` does not import it; search found no external consumer. Impact: `/tasks` source/API is not active in the audited Nest application.

### PB-157 — LifeTasks and LifeExecution are parallel task-domain implementations
Status: OPEN — ARCHITECTURE/CONTRACT DRIFT
Locations: `apps/backend/src/modules/life-tasks/*`, `apps/backend/src/modules/life-execution/*`, related migrations.
Evidence: both domains implement overlapping task CRUD/dependency/event semantics; LifeTasks uses `LifeTaskDependency`/`LifeTaskEvent`, while LifeExecution uses legacy `TaskDependency`/`TaskEvent`. Impact: parallel semantics can diverge and the inactive module can become stale or be wired accidentally later.

### PB-158 — LifeTasks DTOs lack runtime validation decorators
Status: OPEN — API CONTRACT
Locations: `apps/backend/src/modules/life-tasks/dto/create-life-task.dto.ts`, `update-life-task.dto.ts`, `task-event.dto.ts`.

### PB-159 — LifeTasksService has no direct automated service spec in inspected repository
Status: OPEN — TEST GAP
Location: `apps/backend/src/modules/life-tasks/services/life-tasks.service.ts`.

### PB-160 — LifeTasksService.update() resets completedAt on metadata-only edits to completed tasks
Status: OPEN — DATA/LOGIC HIGH
Location: `apps/backend/src/modules/life-tasks/services/life-tasks.service.ts`, `update()`.
Evidence: `completedAt` calculation contains a duplicate/unreachable `status === 'completed'` branch. Because `status = dto.status ?? task.status`, editing an already-completed task without changing status assigns `new Date()` instead of preserving the previous completion timestamp.

### PB-161 — RecommendationIntelligenceModule is orphaned from runtime wiring
Status: OPEN — ARCHITECTURE/FEATURE HIGH
Location: `apps/backend/src/modules/recommendation-intelligence/recommendation-intelligence.module.ts`, AppModule/module import graph.
Evidence: search for `RecommendationIntelligenceModule` found only its own declaration. No active module imports it. Impact: Recommendation Intelligence services are not part of the audited runtime dependency graph.

### PB-162 — RecommendationIntelligenceController is an empty shell; documented food endpoint is not exposed
Status: OPEN — API CONTRACT HIGH
Location: `apps/backend/src/modules/recommendation-intelligence/controllers/recommendation-intelligence.controller.ts`.
Evidence: controller contains only the route prefix and no methods. Impact: documented `POST /recommendation-intelligence/food` is not provided by this controller in the audited commit.

### PB-163 — Current State documentation falsely describes Recommendation Intelligence food endpoint as implemented
Status: OPEN — DOCUMENTATION/ARCHITECTURE
Locations: `apps/backend/docs/05_CURRENT_STATE.md`, recommendation-intelligence controller, module wiring.
Impact: engineering docs give a stronger runtime-completeness claim than the actual controller/wiring supports.

### PB-164 — GoalIntelligenceModule is source-present but not runtime-wired
Status: OPEN — ARCHITECTURE/FEATURE
Location: `apps/backend/src/modules/goal-intelligence/goal-intelligence.module.ts` and module import graph. Evidence: search found only its own declaration; no active importer was found.

### PB-165 — Goal Intelligence service cluster is placeholder-level and disconnected
Status: OPEN — ARCHITECTURE/DESIGN
Locations: `goal-intelligence/services/goal-analysis.service.ts`, `goal-planning.service.ts`, `goal-progress.service.ts`. Evidence: fixed no-op style responses and no external consumer found.

### PB-166 — Goal Intelligence has no direct service tests in inspected tree
Status: OPEN — TEST GAP
Locations: Goal Intelligence service files/module.

### PB-168 — Dashboard default date/weekly boundary is UTC-based
Status: OPEN — TIMEZONE HIGH
Location: `apps/backend/src/modules/dashboard/dashboard.service.ts` date normalization/range helpers.

### PB-169 — Daily Command Center current-day workout query has no upper date bound
Status: OPEN — TIME/LOGIC HIGH
Location: `apps/backend/src/modules/daily-command-center/daily-command-center.service.ts` workout query.

### PB-170 — Device Intelligence endpoint is publicly reachable without auth guard
Status: OPEN — SECURITY HIGH
Location: `apps/backend/src/modules/device-intelligence/controllers/device-intelligence.controller.ts`, `apps/backend/src/app.module.ts`.

### PB-171 — Active FitnessController reads req.user.sub although JWT strategy exposes User.id
Status: OPEN — AUTH/SECURITY HIGH
Locations: `auth/strategies/jwt.strategy.ts`, `users/users.service.ts`, active `fitness/controllers/fitness.controller.ts`.

### PB-172 — Refresh-token rotation leaves old refresh session valid after successful refresh
Status: OPEN — SECURITY HIGH
Locations: `auth/auth.service.ts`, `auth/services/session.service.ts`.

### PB-173 — Application-level auth rate limiting/security headers are not observed
Status: OPEN — SECURITY DESIGN REVIEW
Locations: `bootstrap.ts`, `main.ts`, backend package manifest. External reverse-proxy/WAF controls remain an unknown.

### PB-174 — Mobile Price History ignores explicit snapshot currency and always renders تومان
Status: OPEN — DATA/UX HIGH
Location: `apps/mobile/app/price-history.tsx` money formatter/render calls.

### PB-175 — Mobile Price History chart fabricates zero as observed minimum
Status: OPEN — DATA PRESENTATION
Location: `apps/mobile/app/price-history.tsx` minimum/range calculation.

### PB-176 — Push registration helpers have no application lifecycle consumer
Status: OPEN — FEATURE/INTEGRATION HIGH
Location: `apps/mobile/lib/notifications/push-registration.ts`.

### PB-177 — Notification runtime bootstrap has no application lifecycle consumer
Status: OPEN — FEATURE/INTEGRATION HIGH
Location: `apps/mobile/lib/notifications/push-runtime.ts`.

### PB-178 — Notification action feedback builder has no active consumer/transport
Status: OPEN — FEATURE/INTEGRATION
Location: `apps/mobile/lib/notifications/notification-actions.ts` and backend notification feedback services/controllers.

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
Locations: `apps/mobile/components/AnimatedPressable.tsx`, `apps/mobile/components/AnimatedSection.tsx`, `apps/mobile/lib/motion.tsx`.
Evidence: `lib/motion.tsx` already exports `AnimatedPressable` and `AnimatedSection`; the component directory redefines wrappers with the same exported names. Repository search found no observed external consumer of the component-directory wrappers. Impact: two competing import surfaces can diverge in behavior/types.

### PB-184 — Mobile command-center visual components use hardcoded English/visual semantics outside the localization layer
Status: OPEN — LOCALIZATION
Locations: `apps/mobile/components/decision-trace-card.tsx`, `apps/mobile/components/plan-status-card.tsx`.
Evidence: `DecisionTraceCard` renders `Waiting`, `Stopped`, `Completed`, `Brain trace`, and `toLocaleString()` directly; `PlanStatusCard` contains its own fa/en switch rather than consuming the app i18n dictionary. Both are consumed by `apps/mobile/app/command-center-v2.tsx`. Impact: Brain command-center UI can remain partially untranslated and formatting can vary from the global locale policy.

### PB-185 — Mobile TTS preparation script downloads executable model assets without checksum verification
Status: OPEN — SUPPLY CHAIN
Location: `apps/mobile/scripts/prepare-khadijah-tts-model.cjs`.
Evidence: the script downloads `model.onnx`, `tokens.txt`, and a vocoder over remote URLs using curl and validates existence plus selected directory entries; no cryptographic hash/signature verification is performed. Impact: a compromised/replaced upstream asset could be accepted into the local native asset bundle. This is a more specific supply-chain surface of PB-129 and must not be double-counted.

### PB-186 — Mobile Brain Context helper targets an unexposed backend route
Status: OPEN — BACKEND↔MOBILE CONTRACT MEDIUM
Locations: `apps/mobile/lib/api.ts` `getBrainContext()`, `apps/backend/src/modules/brain-integration/controllers/brain-integration.controller.ts`.
Evidence: Mobile defines `getBrainContext(dateKey?)` and requests `/brain-integration/context`; backend `BrainIntegrationController` contains only `@Controller('brain-integration')` and no route methods. Repository search found no screen/component consumer beyond the helper itself, so this is a stale/unusable client helper contract rather than a proven currently user-triggered runtime failure. Impact: any future/hidden caller would receive a route-not-found response until the contracts are reconciled.

### PB-187 — Auth persisted refresh-session expiry is hard-coded to 30 days while refresh JWT lifetime is configurable
Status: OPEN — AUTH/CONFIG CONTRACT
Location: `apps/backend/src/modules/auth/auth.service.ts`, `createAuthResponse()` versus `token.utils.ts`/`AppConfigService`.
Evidence: persisted `Session.expiresAt` is set with `+ 30 * 24 * 60 * 60 * 1000`, while the refresh JWT expiry is read from `AppConfigService.jwtRefreshExpiresIn`. Impact: changing configured refresh JWT lifetime can desynchronize JWT validity from database session validity.

### PB-188 — Recipe content importer uses Prisma models that are absent from final Prisma schema
Status: OPEN — DATA/BUILD/RUNTIME HIGH
Location: `apps/backend/scripts/recipe-content-import.mjs`, calls to `prisma.recipeStep.*` and `prisma.recipeMedia.*`.
Evidence: the importer constructs a normal generated `PrismaClient` and directly calls `prisma.recipeStep.deleteMany/create` and `prisma.recipeMedia.deleteMany/create`. The audited final `apps/backend/prisma/schema.prisma` does not declare `RecipeStep` or `RecipeMedia`; those tables exist only in migration SQL. Therefore the generated Prisma client from the final schema does not expose those model delegates. Impact: executing this importer against the current generated client is expected to fail before the intended recipe step/media persistence can complete. Root cause: operational script and Prisma schema/migration contract are out of sync.

## Reconciliation note
Several IDs above consolidate findings already present under PB-129, PB-134, PB-135, PB-137, PB-138, PB-139, PB-140, PB-143, PB-144, PB-147, PB-148, PB-149, PB-150, PB-151, PB-152, PB-154 and PB-155. During final consolidation, preserve the oldest canonical ID where the same issue is identical. PB-112 and PB-167 are correction-trail IDs only and are not open issues. PB-185 is a specific surface of PB-129 and must not be double-counted.
