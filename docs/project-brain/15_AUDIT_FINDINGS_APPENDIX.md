# Audit Findings Appendix

Last updated: 2026-09-11
Review status: IN_PROGRESS
Purpose: append-only register for findings discovered after the original issue catalog snapshot. This is supporting evidence; `12_OPEN_WORK.md` remains the intended authoritative issue catalog after consolidation.
Scope actually read: selected LifeTasks, Recommendation Intelligence, Goal Intelligence, Content, Dashboard/Daily Command Center, Auth/JWT, Mobile notification/voice/native/test/runtime and related wiring files.
Scope not yet read: remaining repository-wide source/tests/consumers, full matrices, runtime execution, complete security/privacy reconciliation.
Evidence roots: corresponding source paths under `apps/backend/src/modules/`, `apps/mobile/`, `.github/workflows/`.
Confidence: HIGH for source-level findings below unless explicitly marked validation-needed.

## Correction log

### PB-112 — NOT_APPLICABLE
Earlier audit text said Mobile Brain `execute-next`/feedback routes were missing. That was disproven. `apps/backend/src/modules/personal-brain/controllers/decision-execution.controller.ts` exposes `POST /personal-brain/decision/execute-next` and `POST /personal-brain/decision/confirm`, both JWT guarded. `apps/backend/src/modules/personal-brain/controllers/decision-feedback.controller.ts` exposes `POST /personal-brain/decision/feedback`, also JWT guarded. No repair is required for the original PB-112 route-existence claim; the catalog must retain it only as NOT_APPLICABLE/corrected false finding.

## New findings

### PB-156 — LifeTasksModule is source-present but not runtime-wired
Status: OPEN — ARCHITECTURE/FEATURE
Locations: `apps/backend/src/modules/life-tasks/life-tasks.module.ts`, `apps/backend/src/app.module.ts`.
Evidence: `LifeTasksModule` exists with `LifeTasksController`/`LifeTasksService`, but `AppModule` does not import it; search for `LifeTasksModule` found only its own module declaration. No external consumer was found.
Impact: `/tasks` source/API is not active in the audited Nest application even though the feature exists in source.

### PB-157 — LifeTasks and LifeExecution are parallel task-domain implementations
Status: OPEN — ARCHITECTURE/CONTRACT DRIFT
Locations: `apps/backend/src/modules/life-tasks/*`, `apps/backend/src/modules/life-execution/*`, migrations for `LifeTask*`/legacy task tables.
Evidence: both domains implement task CRUD/dependencies/events/next-best semantics over overlapping task concepts; LifeTasks uses `LifeTaskDependency`/`LifeTaskEvent`, while LifeExecution uses legacy `TaskDependency`/`TaskEvent`.
Impact: parallel semantics can diverge and the inactive module can become stale or be wired accidentally later.

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
Evidence: repository search for `RecommendationIntelligenceModule` found only its own declaration. No active module imports it.
Impact: Recommendation Intelligence services are not part of the audited runtime dependency graph.

### PB-162 — RecommendationIntelligenceController is an empty shell; documented food endpoint is not exposed
Status: OPEN — API CONTRACT HIGH
Location: `apps/backend/src/modules/recommendation-intelligence/controllers/recommendation-intelligence.controller.ts`.
Evidence: controller contains only `@Controller('recommendation-intelligence')` and no methods.
Impact: documented `POST /recommendation-intelligence/food` is not provided by this controller in the audited commit.

### PB-163 — Current State documentation falsely describes Recommendation Intelligence food endpoint as implemented
Status: OPEN — DOCUMENTATION/ARCHITECTURE
Locations: `apps/backend/docs/05_CURRENT_STATE.md`, `recommendation-intelligence/controllers/recommendation-intelligence.controller.ts`, module wiring.
Impact: engineering docs give a stronger runtime-completeness claim than the actual controller/wiring supports.

### PB-164 — GoalIntelligenceModule is source-present but not runtime-wired
Status: OPEN — ARCHITECTURE/FEATURE
Location: `apps/backend/src/modules/goal-intelligence/goal-intelligence.module.ts` and module import graph.
Evidence: search for `GoalIntelligenceModule` found only its own declaration; no active importer was found.

### PB-165 — Goal Intelligence service cluster is placeholder-level and disconnected
Status: OPEN — ARCHITECTURE/DESIGN
Locations: `goal-intelligence/services/goal-analysis.service.ts`, `goal-planning.service.ts`, `goal-progress.service.ts`.
Evidence: each service performs a resolved no-op and returns fixed `{ analyzed: true }`, `{ planCreated: true }`, or `{ progressTracked: true }` responses; no real domain inputs/outputs are modeled and no external consumer was found.

### PB-166 — Goal Intelligence has no direct service tests in inspected tree
Status: OPEN — TEST GAP
Locations: Goal Intelligence service files/module.

### PB-167 — ContentModule is orphaned from runtime wiring
Status: OPEN — ARCHITECTURE/FEATURE
Location: `apps/backend/src/modules/content/content.module.ts` and AppModule/module import graph.
Evidence: search for `ContentModule` found no active importer.
Impact: content recommendation source code is outside the active runtime graph.

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

## Reconciliation note
Several IDs above consolidate findings already present under PB-134, PB-135, PB-137, PB-138, PB-139, PB-140, PB-143, PB-144, PB-147, PB-148, PB-149, PB-150, PB-151, PB-152, PB-154 and PB-155 in the main catalog. During final consolidation, preserve the oldest canonical ID where the same issue is identical and use these appendix IDs only for genuinely new or more precise findings. Do not double-count consolidated duplicates.
