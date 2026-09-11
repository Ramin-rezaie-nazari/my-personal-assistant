# Audit Findings Appendix

Last updated: 2026-09-11

## Reconciliation rule

Preserve the oldest canonical ID when the same root cause appears on multiple surfaces. Correction-only IDs remain `NOT_APPLICABLE`. New findings require exact location, concrete evidence, and impact. Findings discovered during the Master Prompt audit remain open until separately remediated and validated.

### PB-001 — Memory governance metadata is not persisted
Status: OPEN
Location: `apps/backend/src/modules/memory-intelligence/models/memory.model.ts`, `models/memory-governance.model.ts`, `repositories/prisma-memory.repository.ts`, Prisma `UserFact`.

### PB-002 — Brain memory integration does not satisfy required user-id contract
Status: OPEN
Location: `apps/backend/src/modules/brain-integration/services/brain-memory.service.ts`, Memory Intelligence service/repository.

### PB-003 — Personal Brain MemoryManager is placeholder-level
Status: OPEN
Location: `apps/backend/src/modules/personal-brain/services/memory-manager.service.ts`.

### PB-004 — DecisionOutcome raw SQL runtime contract absent from final Prisma model
Status: OPEN
Location: `personal-brain/services/decision-outcome-learning.service.ts`, decision-outcome migrations, `schema.prisma`.

### PB-005 — ConversationTurn raw SQL runtime contract absent from final Prisma model
Status: OPEN
Location: `assistant/services/conversation-history.service.ts`, conversation-turn migration, `schema.prisma`.

### PB-006 — WorkoutPerformance raw SQL runtime contract absent from final Prisma model
Status: OPEN
Location: `personal-brain/services/workout-performance-memory.service.ts`, workout-performance migration, `schema.prisma`.

### PB-007 — Other migration-only tables need reconciliation
Status: OPEN
Locations: `apps/backend/prisma/migrations/`, `schema.prisma`.

### PB-008 — Notification intelligence can select unsupported channels
Status: OPEN
Locations: `personal-brain/services/notification-channel-intelligence.service.ts`, `notification-delivery-provider.service.ts`.

### PB-009 — Notification dedupe is process-local and approved decisions are not marked sent in observed controller path
Status: OPEN
Locations: `notification-deduplication.service.ts`, Personal Brain notification/delivery controller paths.

### PB-010 — Device disable endpoint lacks ownership check
Status: OPEN — SECURITY HIGH
Locations: `personal-brain/controllers/personal-brain.controller.ts`, `notification-device-registry.service.ts`.

### PB-011 — Multiple adaptive/decision/notification state stores are process-local
Status: OPEN
Locations: notification and decision process-local services.

### PB-012 — Personal Brain controller bodies frequently use inline/any contracts rather than DTO validation
Status: OPEN
Locations: Personal Brain controllers.

### PB-013 — Coach cue explanation accepts empty/unbounded message semantics
Status: OPEN
Location: Personal Brain coach cue path.

### PB-014 — Workout implicit date can use UTC instead of user-local date
Status: OPEN
Location: `personal-brain/services/workout-action-adapter.service.ts`.

### PB-015 — Decision execution dependency graph is broader than semantic predecessors
Status: OPEN
Location: `decision-execution-planner.service.ts`.

### PB-016 — Adaptive/scheduling/scenario behavior is strongly rule-based despite broader adaptive naming
Status: OPEN / DESIGN REVIEW
Locations: scheduling/scenario/adaptive services.

### PB-017 — UserUnderstanding/IntentionAnalysis placeholders
Status: OPEN
Locations: `user-understanding.service.ts`, `intention-analysis.service.ts`.

### PB-018 — Goal Intelligence placeholders
Status: OPEN
Locations: `goal-intelligence/services/*`.

### PB-019 — Brain Integration context is thin placeholder
Status: OPEN
Location: `brain-integration/services/brain-context.service.ts`.

### PB-020 — Decision Engine top-level service is placeholder-level while logic is split
Status: OPEN
Locations: Decision Engine services.

### PB-021 — Adaptive Learning write path incomplete
Status: OPEN
Location: `adaptive-learning/`.

### PB-022 — Duplicate incompatible NotificationChannel contracts
Status: OPEN
Locations: notification channel intelligence/provider.

### PB-023 — Proactive event -> delivery lifecycle incomplete
Status: OPEN
Locations: proactive event/dedupe/delivery.

### PB-024 — Confirmation tokens deterministic instead of high-entropy one-time secrets
Status: DESIGN/SECURITY REVIEW
Location: `action-confirmation-intelligence.service.ts`.

### PB-025 — Scenario simulator uses heuristic candidate mutations instead of explicit scenario models
Status: OPEN / DESIGN REVIEW
Locations: `multi-scenario-simulator.service.ts`, `scenario-planning.service.ts`.

### PB-026 — Brain daily/weekly/life-context boundaries are UTC-based
Status: OPEN
Locations: `brain-daily-status.service.ts`, `brain-weekly-status.service.ts`, `brain-life-context.service.ts`.

### PB-027 — Brain reasoning context quality ignores major context dimensions and freshness
Status: OPEN / DESIGN REVIEW
Location: `brain-reasoning-context.service.ts`.

### PB-028 — Brain planning and action execution identifiers do not form a stable cross-domain contract
Status: OPEN
Location: Personal Brain planning/execution services.

### PB-029 — Decision explanation memory can report stale/partial evidence
Status: OPEN / DESIGN REVIEW
Location: `decision-explanation-memory.service.ts`.

### PB-030 — Personal Brain daily/weekly summaries use process-local caches
Status: OPEN
Locations: summary/scheduling services.

### PB-031 — User behavior/insight writes lack bounded retention policy
Status: OPEN / PRIVACY REVIEW
Locations: `user-intelligence/`, Prisma `UserBehavior`, `UserInsight`.

### PB-032 — Memory retrieval can return records without source/confirmation metadata required by governance
Status: OPEN
Locations: Memory Intelligence repository/surface.

### PB-033 — Brain action receipts do not have a single persisted lifecycle model
Status: OPEN
Locations: action/decision execution services.

### PB-034 — Assistant action confirmation flow has duplicate contract layers
Status: OPEN
Locations: Assistant confirmation DTO/service and Personal Brain confirmation services.

### PB-035 — Local-date derivation is inconsistent across domain services
Status: OPEN
Locations: daily/workout/notification/calendar services.

### PB-036 — Notification scheduledAt semantics differ between persistence and delivery queue
Status: OPEN
Locations: Notification model, delivery queue/provider.

### PB-037 — Notification priority ordering is inverted/ambiguous across consumer and producer contracts
Status: OPEN
Locations: notification service/controller/mobile notification UI.

### PB-038 — Calendar event recurrence is not represented by a first-class model
Status: OPEN / DESIGN REVIEW
Location: calendar domain.

### PB-039 — Habit frequency model cannot represent several common recurrence patterns
Status: OPEN / DESIGN REVIEW
Location: `Habit.frequency`, habit service/DTOs.

### PB-040 — Supplement dosage is unstructured text
Status: OPEN / DESIGN REVIEW
Location: `Supplement.dosage`, supplement DTO/service.

### PB-041 — Nutrition logs store derived macro values without durable source/provenance link
Status: OPEN / DATA QUALITY
Location: `NutritionLog`, nutrition service.

### PB-042 — FoodItem global/user ownership model can duplicate canonical foods
Status: OPEN / DATA MODEL
Location: Prisma `FoodItem`, foods service.

### PB-043 — Recipe ownership/global visibility semantics are mixed in one model
Status: OPEN / DATA MODEL
Location: Prisma `Recipe`, recipes service.

### PB-044 — Inventory unit model remains free-form string at DB boundary
Status: OPEN / DATA QUALITY
Location: Prisma `InventoryItem.unit`.

### PB-045 — Shopping unit model remains free-form string at DB boundary
Status: OPEN / DATA QUALITY
Location: Prisma `ShoppingItem.unit`.

### PB-046 — Shopping uniqueness on completed status encodes lifecycle state into uniqueness key
Status: OPEN / DATA MODEL
Location: Prisma `ShoppingItem @@unique([userId, foodId, completed])`.

### PB-047 — Notification dedupe key uniqueness is user-scoped but retention/rotation semantics are unspecified
Status: OPEN
Location: Prisma `Notification.dedupeKey`.

### PB-048 — UserFact has no uniqueness contract for category/key
Status: OPEN / DATA MODEL
Location: Prisma `UserFact`.

### PB-049 — UserBehavior metadata is unbounded JSON without schema/version contract
Status: OPEN / DATA GOVERNANCE
Location: Prisma `UserBehavior.metadata`.

### PB-050 — UserInsight lacks explicit source/version provenance
Status: OPEN / DATA GOVERNANCE
Location: Prisma `UserInsight`.

### PB-051 — DecisionAuditEntry selected/rejected/blocked IDs are untyped JSON
Status: OPEN / DATA GOVERNANCE
Location: Prisma `DecisionAuditEntry`.

### PB-052 — PlanExecutionState step/completion/blocked/failed state is untyped JSON
Status: OPEN / DATA GOVERNANCE
Location: Prisma `PlanExecutionState`.

### PB-053 — FitnessProfileState is a JSON-only persistence boundary
Status: OPEN / DATA MODEL
Location: Prisma `FitnessProfileState.profile`.

### PB-054 — Several fitness domain contracts are serialized inside JSON/profile state instead of normalized models
Status: OPEN / DESIGN REVIEW
Locations: FitnessProfileState and related Personal Brain fitness services.

### PB-055 — Fitness/Workout lifecycle lacks explicit ownership/version fields for external performance facts
Status: OPEN
Locations: Workout and WorkoutPerformance integration.

### PB-056 — Goal and GoalCheckin are migration-only runtime SQL contracts
Status: OPEN
Locations: Goals service, goal migrations, `schema.prisma`.

### PB-057 — Life execution compatibility tables are migration-only runtime contracts
Status: OPEN
Locations: life execution services/migrations/schema.

### PB-058 — Raw SQL tables do not share Prisma-generated referential/type contracts
Status: OPEN
Locations: all migration-only tables and raw SQL consumers.

### PB-059 — Runtime raw SQL contract versioning is implicit rather than centrally registered
Status: OPEN
Locations: raw SQL services/migrations.

### PB-060 — Database reader/writer ownership for migration-only tables is fragmented
Status: OPEN
Locations: assistant, Personal Brain, fitness, goals, life execution.

### PB-061 — Transaction boundaries differ between equivalent CRUD paths
Status: OPEN
Locations: multiple domain services.

### PB-062 — API DTO validation coverage is inconsistent across source-only and active controllers
Status: OPEN
Locations: affected DTO/controller paths.

### PB-063 — Controller request user typing is inconsistent with actual Passport strategy result
Status: OPEN
Locations: Fitness and related controllers.

### PB-064 — Service-layer methods accept raw strings where domain IDs/UUIDs should be typed
Status: OPEN
Locations: multiple services.

### PB-065 — Error payload shapes are inconsistent across controller families
Status: OPEN
Locations: backend controllers/services.

### PB-066 — Mobile error handling often reduces structured API errors to generic strings
Status: OPEN
Locations: multiple Mobile screens/API clients.

### PB-067 — Mobile API clients duplicate transport concerns
Status: OPEN / DESIGN REVIEW
Locations: `apps/mobile/lib/api.ts`, `recipe-api.ts`, `shopping-api.ts`, `shopping-basket-api.ts`, `calendar-api.ts`, `inventory-api.ts` and related clients.

### PB-068 — Mobile transport clients are not uniformly aligned on refresh/retry semantics
Status: OPEN — API CONTRACT HIGH
Locations: `apps/mobile/lib/recipe-api.ts`, `apps/mobile/lib/shopping-api.ts`, `apps/mobile/lib/shopping-basket-api.ts`, compared with `apps/mobile/lib/api.ts` and `apps/mobile/lib/calendar-api.ts`.
Evidence: `recipe-api.ts` obtains only `getStoredAccessToken()` and calls `fetch()` directly for `/recipes/match` and `/shopping/from-recipe`; it has no 401→refresh→retry path. `shopping-api.ts` and `shopping-basket-api.ts` use local request helpers that similarly attach only the stored access token and throw on non-2xx. By contrast, central `apps/mobile/lib/api.ts` and `calendar-api.ts` implement refresh on 401 and clear the session when refresh fails. Impact: after access-token expiry, recipe matching and shopping/basket actions can fail while calendar/central API calls recover automatically, producing inconsistent user-session behavior. Root cause is transport logic duplicated outside the canonical API client without shared refresh middleware/interceptor.

### PB-069 — Mobile API base URL defaults to HTTP localhost
Status: OPEN / RELEASE RISK
Location: `apps/mobile/lib/api.ts` and several custom API clients.

### PB-070 — Mobile offline behavior is not uniform across domain clients
Status: OPEN
Locations: Mobile API/domain clients.

### PB-071 — Mobile local persistence has no centralized sensitive-data policy
Status: OPEN / PRIVACY REVIEW
Locations: AsyncStorage usages across Mobile.

### PB-072 — Mobile notification action transport is incomplete
Status: OPEN
Locations: notification contract/action feedback.

### PB-073 — Mobile push registration lifecycle is not centrally wired
Status: OPEN
Locations: push token registration helpers/bootstrap.

### PB-074 — Mobile voice/TTS stack has native/runtime lifecycle risk
Status: OPEN — RELEASE BLOCKER
Locations: voice/TTS provider and native integrations.

### PB-075 — Mobile voice assets lack integrity verification
Status: OPEN — SUPPLY CHAIN
Location: voice/TTS model preparation.

### PB-076 — Mobile image/asset caching policy is fragmented
Status: OPEN
Locations: media/image clients and screens.

### PB-077 — Mobile accessibility coverage is incomplete
Status: OPEN
Locations: multiple screens/components.

### PB-078 — Mobile RTL/layout semantics are not centrally enforced for all surfaces
Status: OPEN
Locations: Mobile i18n/design-system/screens.

### PB-079 — Mobile localization dictionary coverage is incomplete
Status: OPEN
Locations: `apps/mobile/lib/i18n.ts` and screens with hardcoded strings.

### PB-080 — Backend locale support is narrower than broader product globalization intent
Status: OPEN / ROADMAP
Location: `apps/backend/src/common/i18n/locale.ts`.

### PB-081 — DeviceIntelligence public endpoint has no explicit auth boundary
Status: OPEN — SECURITY
Location: `apps/backend/src/modules/device-intelligence/controllers/device-intelligence.controller.ts`.

### PB-082 — Device sync DTO lacks runtime validators
Status: OPEN — SECURITY
Location: `apps/backend/src/modules/device-intelligence/dto/create-device-sync.dto.ts`.

### PB-083 — App bootstrap has no explicit security-header middleware
Status: OPEN / DEPLOYMENT REVIEW
Location: `apps/backend/src/bootstrap.ts`.

### PB-084 — Application-level rate-limit policy is not visible in bootstrap
Status: OPEN / DEPLOYMENT REVIEW
Location: `apps/backend/src/bootstrap.ts`, public auth endpoints.

### PB-085 — Refresh session lifetime is hard-coded independently of JWT config
Status: OPEN — AUTH
Location: `apps/backend/src/modules/auth/auth.service.ts`, `createAuthResponse()`.

### PB-086 — Refresh token rotation does not revoke the presented token/session
Status: OPEN — SECURITY HIGH
Location: `apps/backend/src/modules/auth/auth.service.ts`, `SessionService`.

### PB-087 — Session lookup does not enforce persisted `expiresAt`
Status: OPEN — AUTH LIFECYCLE
Location: `apps/backend/src/modules/auth/services/session.service.ts`, `findByRefreshToken()`.

### PB-088 — Refresh/logout controller methods are intentionally public but abuse controls are external/unknown
Status: OPEN / SECURITY REVIEW
Location: `apps/backend/src/modules/auth/controllers/auth.controller.ts`.

### PB-089 — Fitness controller request identity contract mismatches JWT strategy shape
Status: OPEN
Location: `apps/backend/src/modules/fitness/controllers/fitness.controller.ts`, `auth/strategies/jwt.strategy.ts`.

### PB-090 — Daily/weekly domain boundaries are not uniformly user-timezone aware
Status: OPEN
Locations: Dashboard/Daily/Brain domain services.

### PB-091 — Dashboard workout latest query lacks explicit upper date bound in observed path
Status: OPEN
Location: `dashboard/dashboard.service.ts`.

### PB-092 — LifeTasksModule is source-present but not runtime-wired
Status: OPEN
Location: `apps/backend/src/modules/life-tasks/`, `app.module.ts`.

### PB-093 — LifeTasks and LifeExecution maintain overlapping task-domain contracts
Status: OPEN
Locations: life-tasks/life-execution modules.

### PB-094 — LifeTasks DTOs lack runtime validation decorators
Status: OPEN
Locations: life-tasks DTOs.

### PB-095 — LifeTasksService lacks direct service tests
Status: OPEN
Location: `life-tasks/services/life-tasks.service.ts`.

### PB-096 — LifeTasksService metadata-only updates can alter completedAt
Status: OPEN
Location: `life-tasks/services/life-tasks.service.ts`.

### PB-097 — RecommendationIntelligenceModule is not wired
Status: OPEN
Location: `recommendation-intelligence/`, `app.module.ts`.

### PB-098 — RecommendationIntelligenceController is empty
Status: OPEN
Location: `recommendation-intelligence/controllers/recommendation-intelligence.controller.ts`.

### PB-099 — Current State overstates Recommendation Intelligence implementation
Status: OPEN
Location: current-state documentation vs active module wiring.

### PB-100 — GoalIntelligenceModule is not wired
Status: OPEN
Location: `goal-intelligence/`, `app.module.ts`.

### PB-101 — Goal Intelligence service layer is placeholder-level/disconnected
Status: OPEN
Location: `goal-intelligence/services/*`.

### PB-102 — Goal Intelligence has no direct tests in identified scope
Status: OPEN
Location: `goal-intelligence/`.

### PB-103 — Dashboard uses UTC-derived date boundary in at least one path
Status: OPEN
Location: dashboard date handling.

### PB-104 — Daily Command Center workout query lacks upper bound
Status: OPEN
Location: `daily-command-center.service.ts`.

### PB-105 — DeviceIntelligenceController is public/source-level health-like endpoint
Status: OPEN — SECURITY
Location: `device-intelligence/controllers/device-intelligence.controller.ts`.

### PB-106 — Fitness↔Auth user object mismatch can break `req.user.sub`
Status: OPEN
Location: Fitness controller/JWT strategy.

### PB-107 — Refresh-token rotation leaves old session valid
Status: OPEN — SECURITY HIGH
Location: AuthService/SessionService.

### PB-108 — No visible application rate limiting/security headers
Status: OPEN / DEPLOYMENT REVIEW
Location: bootstrap/application.

### PB-109 — Mobile Price History hardcodes تومان
Status: OPEN
Location: `apps/mobile/app/price-history.tsx`.

### PB-110 — Mobile Price History represents missing low as zero
Status: OPEN / DATA QUALITY
Location: `apps/mobile/app/price-history.tsx`.

### PB-111 — Mobile push registration helper has no observed lifecycle consumer
Status: OPEN
Location: notification registration helper.

### PB-112 — Earlier false positive: Personal Brain execution endpoints absent
Status: NOT_APPLICABLE
Reason: later verification confirmed `/personal-brain/decision/execute-next`, `/confirm`, and `/feedback` exist with JWT guards.

### PB-113 — Notification runtime bootstrap has no lifecycle consumer
Status: OPEN
Location: Mobile notification runtime bootstrap.

### PB-114 — Notification action feedback builder has no consumer/transport
Status: OPEN
Location: Mobile notification action feedback.

### PB-115 — Mobile TypeScript typecheck excludes test files
Status: OPEN
Location: `apps/mobile/tsconfig.json` / package typecheck.

### PB-116 — Mobile Voice/TTS imports undeclared `expo-speech`
Status: OPEN
Location: Mobile TTS source/package manifest.

### PB-117 — Mobile Voice/TTS has no active screen consumer
Status: OPEN
Location: Mobile voice/TTS module.

### PB-118 — Mobile auth/session storage uses AsyncStorage for bearer credentials
Status: OPEN — SECURITY/PRIVACY
Location: `apps/mobile/lib/api.ts`.

### PB-119 — Duplicate/orphan Mobile animation wrappers
Status: OPEN
Locations: `apps/mobile/components/AnimatedPressable.tsx`, `AnimatedSection.tsx`, `apps/mobile/lib/motion.tsx`.

### PB-120 — Command-center decision cards contain hardcoded English
Status: OPEN
Locations: `apps/mobile/components/DecisionTraceCard.tsx`, `PlanStatusCard.tsx`.

### PB-121 — Mobile TTS preparation downloads model assets without checksum verification
Status: OPEN — SUPPLY CHAIN
Location: `apps/mobile/lib/tts-model-preparation.ts` / related script.

### PB-122 — Mobile `getBrainContext()` targets a backend route not exposed by active controller
Status: OPEN — API CONTRACT
Location: `apps/mobile/lib/api.ts`, `apps/backend/src/modules/brain-integration/controllers/brain-integration.controller.ts`.

### PB-123 — Auth persisted refresh-session expiry is hard-coded 30 days while JWT expiry is configurable
Status: OPEN — AUTH
Location: `apps/backend/src/modules/auth/auth.service.ts`.

### PB-124 — Root current-state source-of-truth file was missing
Status: OPEN — DOCUMENTATION
Location: `docs/05_CURRENT_STATE.md` vs `apps/backend/docs/05_CURRENT_STATE.md`.

### PB-125 — Recipe content importer is not aligned with final Prisma model contract
Status: OPEN — DATA/DB
Location: `apps/backend/scripts/recipe-content-import.mjs`, `apps/backend/prisma/schema.prisma`, recipe-step/media migrations.

### PB-126 — Recipe content importer has no offset/checkpoint input
Status: OPEN — OPERATIONAL
Location: `apps/backend/scripts/recipe-content-import.mjs`.

### PB-127 — Recipe content importer is not transactionally grouped across recipe/ingredient/step/media writes
Status: OPEN — DATA INTEGRITY
Location: `apps/backend/scripts/recipe-content-import.mjs`.

### PB-128 — Recipe image pipeline enforces <=60KB despite later 20–150KB local-media target
Status: OPEN — CONTRACT DRIFT
Locations: `apps/backend/src/common/images/recipe-image-pipeline.ts`, recipe image scripts, local-media design.

### PB-129 — Multiple executable country-intelligence variants have no canonical/deprecated policy
Status: OPEN — OPERATIONAL
Location: `apps/backend/scripts/recipe-country-intelligence*.mjs`.

### PB-130 — Recipe image reprocess LIMIT is positional, not checkpointed
Status: OPEN — OPERATIONAL
Location: `apps/backend/scripts/recipe-image-reprocess-quality.mjs`.

### PB-131 — Recipe image importer variants disagree on `hero` vs `primary` image contract
Status: OPEN — DATA CONTRACT
Locations: `recipe-image-import*.mjs`, `recipe_images` consumers.

### PB-132 — Final food-intelligence self-test exists but is not package/CI-wired
Status: OPEN — QA
Location: `apps/backend/scripts/food-intelligence-final-self-test.mjs`, `apps/backend/package.json`, CI.

### PB-133 — Recipe ingest quality-score unit mismatch
Status: OPEN — RANKING CORRECTNESS
Location: `apps/backend/scripts/recipe-ingest.mjs`, `recipe-recommendation-score.mjs`.
Evidence: ingest persists `quality_score: quality.score` where `score` is constructed as a 0..1 fraction; recommendation scorer later computes `clamp(Number(recipe.quality_score) / 100)`. A value such as 0.82 therefore becomes 0.0082 before weighting. Impact: quality ranking signal is effectively suppressed by ~100x. The scorer and producer must share one canonical unit.

### PB-134 — Nutrition estimator lacks source/version provenance for hard-coded constants
Status: OPEN — DATA PROVENANCE
Location: `apps/backend/scripts/recipe-nutrition-estimate.mjs`.
Evidence: `FOOD` embeds fixed kcal/protein/carbs/fat values and `gramsFromLine()` embeds fixed household-unit conversions such as cup→150g, tbsp→14g and tsp→4.2g; output only records matched names/grams plus estimator version/confidence, not the data source/version of these constants. Impact: estimated nutrition cannot be independently reproduced/audited when constants change. The output is explicitly `estimated:true`, so this is not classified as hidden verified data.

### PB-135 — Dataset image RESET deletes global DB state but enumerates only first 1000 Storage objects
Status: OPEN — OPERATIONAL/DATA INTEGRITY HIGH
Location: `apps/backend/scripts/recipe-image-dataset-import-v2.mjs`, `resetState()`.
Evidence: Storage listing uses `prefix:'recipes'`, `limit:1000`, `offset:0` once, then the script globally deletes all hero `recipe_images` and all import attempts. Impact: with >1000 recipe objects, DB rows can be removed while Storage objects beyond the first page remain orphaned. No destructive reset was executed during the audit.

### PB-136 — Wired recipe image importer only reads first 1000 existing images/skip attempts
Status: OPEN — DATA/OPERATIONAL HIGH
Location: `apps/backend/scripts/recipe-image-import.mjs`, `getMissingRecipes()`.
Evidence: existing primary-image rows and skipped-attempt rows are each fetched with `limit=1000` and no pagination while the recipe list is paginated. Impact: later rows can be treated as missing/unattempted and reprocessed, creating duplicate/failed writes or unnecessary external downloads.

### PB-137 — Local guaranteed-v8 image pipeline references missing scripts
Status: OPEN — EXECUTION BLOCKER
Location: `apps/backend/scripts/recipe-images-local-guaranteed-v8.mjs`.
Evidence: orchestration invokes `./scripts/recipe-images-local-strict-v3.mjs`, `./scripts/recipe-images-local-gallery-upgrade-v1.mjs`, and `./scripts/recipe-images-local-status.mjs`, but exact file lookups in the audited branch return 404/not-found. Impact: the v8 pipeline cannot complete in its declared form.

### PB-138 — Country preference scoring query does not select fields consumed by the scorer
Status: OPEN — RANKING CORRECTNESS
Location: `apps/backend/scripts/recipe-recommendation-score.mjs`, relation query in `main()` and `globalCultureFit()`.
Evidence: scorer requests `recipe_country_relations?select=recipe_id,country_id,relation_type,confidence,evidence`; `globalCultureFit()` then tests `r.iso2`, `r.country` and `r.region`. Those fields are absent from the query result. Impact: preferred-country/region signals cannot hit through this path even when relation rows exist.

### PB-139 — Mobile recipe/shopping API clients bypass canonical 401 refresh/retry policy
Status: OPEN — API CONTRACT HIGH
Location: `apps/mobile/lib/recipe-api.ts`, `apps/mobile/lib/shopping-api.ts`, `apps/mobile/lib/shopping-basket-api.ts`; comparison baseline `apps/mobile/lib/api.ts` and `apps/mobile/lib/calendar-api.ts`.
Evidence: `recipe-api.ts` calls `getStoredAccessToken()` then performs direct `fetch()` for `/recipes/match` and `/shopping/from-recipe`; `shopping-api.ts` and `shopping-basket-api.ts` also build local request helpers that attach only the stored access token and immediately throw on non-2xx. `api.ts` central request logic and `calendar-api.ts` instead retry once after a 401 by refreshing the persisted refresh token and clear the auth session when refresh fails. Impact: an expired access token can break recipe matching and shopping/basket actions while other app areas silently recover, creating inconsistent auth/session behavior and UX. Root cause: duplicated transport clients lack shared refresh middleware.

## Correction log

### PB-112
Status: NOT_APPLICABLE
Reason: verified endpoint exists with JWT guards.

### PB-167
Status: NOT_APPLICABLE
Reason: `ContentModule` is active in `AppModule`.

### PB-185
Status: COVERED_BY_PB-121/PB-075
Reason: exact Mobile TTS asset-integrity surface; retain canonical root cause only.

## Audit note

All findings above are audit observations, not remediation claims. Production fixes are intentionally deferred until the Master Prompt audit scope is fully closed, except for any immediate containment that would be required by a newly established safety-critical issue.
