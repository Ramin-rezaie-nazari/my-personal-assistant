# Open Work / Issue Catalog

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: baseline; Core; Prisma schema + all 39 migrations; Assistant; complete Brain file-level scope; Food/Recipe/Nutrition/Meals/Recommendation/Budget; Shopping/Inventory/Shopping Intelligence; substantial Price Intelligence; Life/Health enumerated modules; Fitness/Workout/Calisthenics/Gym/Yoga and Personal Brain fitness consumers; Platform/Test/CI enumerated manifests/E2E/workflows; substantial Mobile route/client/component scope; Mobile components/scripts; selected Content, Dashboard, Daily Command Center and Auth/JWT cross-contract files; Mobile notification/voice/runtime/native files.
Scope not yet read: remaining Fitness-adjacent source; remaining Mobile route/component/library files; exhaustive platform/common/test inventory; repository-wide route/consumer/database matrices; runtime/device validation; full security/privacy closure; historical docs/branches.
Evidence roots: `apps/backend/src/modules/`; `apps/backend/prisma/`; `apps/mobile/`; `.github/workflows/`; `docs/project-brain/`.
Confidence level: HIGH for exact issues below; MEDIUM for cross-module impact until all consumers/runtime are reconciled.
Open questions: deployed schema drift; remaining Mobile routes/components; physical-device behavior; runtime test/build results; full repo route/reader-writer/transaction coverage.

## Issue catalog

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

### PB-028 — BrainStateAnalyzer treats empty goal/memory arrays as available
Status: OPEN
Location: `brain-state-analyzer.service.ts`.

### PB-029 — Full-day scheduler uses legacy TaskDependency + server-local time semantics
Status: OPEN — DATA/TIMEZONE HIGH
Location: `full-day-scheduler.service.ts`.

### PB-030 — Recipe nutrition totals assume undefined FoodItem base quantity/unit
Status: OPEN — DATA INTEGRITY HIGH
Locations: `recipes.service.ts`, FoodsService, Prisma `FoodItem`.

### PB-031 — Food Operating Loop and RecipeInventoryMatcher use incompatible inventory unit semantics
Status: OPEN — DATA INTEGRITY HIGH
Locations: `food-operating-loop.service.ts`, `recipe-inventory-matcher.service.ts`.

### PB-032 — Package/unitless inventory cannot be meaningfully compared in FoodOperatingLoop
Status: OPEN
Location: `food-operating-loop.service.ts`.

### PB-033 — Recipe meal-plan endpoint ignores recipe mealTypes
Status: OPEN
Location: `recipes.controller.ts` `GET /recipes/meal-plan`.

### PB-034 — Country code lacks explicit supported-set validation
Status: OPEN
Locations: Recipe country endpoints.

### PB-035 — Controller serving-count contract differs from DTO/service
Status: OPEN
Location: Recipes controller serving parser vs DTO/service.

### PB-036 — Recipe presentation reads migration-only RecipeStep raw SQL
Status: OPEN
Location: `recipe-presentation.service.ts`, RecipeStep migration, `schema.prisma`.

### PB-037 — Recipe create/update does not manage RecipeStep/RecipeMedia lifecycle
Status: OPEN
Locations: Recipes service/presentation + migrations.

### PB-038 — Meal nutrition repeats undefined FoodItem base-unit assumption
Status: OPEN — DATA INTEGRITY HIGH
Locations: `meals.service.ts`, Prisma FoodItem/MealItem.

### PB-039 — Budget MealPlanningService ignores countryCode and inventory/cuisine constraints
Status: OPEN
Location: `budget-intelligence/services/meal-planning.service.ts`.

### PB-040 — Recommendation Intelligence placeholder/disconnected from Recipe flow
Status: OPEN
Locations: recommendation-intelligence services.

### PB-041 — Budget Intelligence top-level plan/cost services placeholders
Status: OPEN
Locations: budget/food-cost services.

### PB-042 — Budget plan endpoint public while DTO unused/unvalidated
Status: OPEN — SECURITY/API CONTRACT
Locations: budget controller/DTO.

### PB-043 — Nutrition and Meals dateKey defaults UTC-based
Status: OPEN — TIMEZONE HIGH
Locations: nutrition/meals services.

### PB-044 — Multiple meal-planning/recommendation implementations can diverge
Status: OPEN / DESIGN REVIEW
Locations: Recipe/Budget/FoodOperatingLoop/Recommendation Intelligence.

### PB-045 — Recipe nutrition estimate script uses separate Supabase/legacy schema contract
Status: OPEN — DATA INTEGRITY HIGH
Location: `apps/backend/scripts/recipe-nutrition-estimate.mjs`.

### PB-046 — Budget MealPlanningService ignores targetServings in scoring/plan math
Status: OPEN
Location: `budget-intelligence/services/meal-planning.service.ts`.

### PB-047 — Meal-created DailyLog and Nutrition summary use different source sets
Status: OPEN — DATA CONSISTENCY HIGH
Locations: MealsService, NutritionService, DailyLog/Meal/NutritionLog.

### PB-048 — Meal and NutritionLog ingestion lack shared event deduplication
Status: OPEN — DATA CONSISTENCY HIGH
Locations: MealsService, NutritionService.

### PB-049 — Shopping addToBasket does not enforce FoodItem visibility/ownership
Status: OPEN — SECURITY/DATA HIGH
Location: `shopping/shopping.service.ts` `addToBasket()`.

### PB-050 — Shopping Intelligence top-level service is placeholder-level
Status: OPEN
Locations: shopping-intelligence facade/list/purchase-analysis.

### PB-051 — Household consumption learning is process-local and not user/household scoped
Status: OPEN — DATA ISOLATION HIGH
Location: `household-consumption-learning.service.ts`.

### PB-052 — Inventory forecast assumes numeric quantities share one unit
Status: OPEN — DATA INTEGRITY HIGH
Location: `household-inventory-intelligence.service.ts`.

### PB-053 — Household purchase planner conflates safetyStock with purchase quantity
Status: OPEN / DESIGN REVIEW
Location: `household-purchase-planner.service.ts`.

### PB-054 — Shopping controller write bodies have no DTO validation
Status: OPEN
Location: `shopping/shopping.controller.ts`.

### PB-055 — Inventory adjustment body lacks DTO/finite-number validation
Status: OPEN
Location: `inventory/inventory.controller.ts`, `inventory.service.ts`.

### PB-056 — Shopping Intelligence controller unguarded and placeholder
Status: OPEN
Location: `shopping-intelligence/controllers/shopping-intelligence.controller.ts`.

### PB-057 — Price Intelligence controller unguarded including write/collection endpoint
Status: OPEN — SECURITY CRITICAL
Location: `price-intelligence/controllers/price-intelligence.controller.ts`.

### PB-058 — HTTP price normalization forces non-IRR currencies to IRT
Status: OPEN — DATA INTEGRITY CRITICAL
Location: `price-intelligence/services/http-price-source.adapter.ts`.

### PB-059 — Price analysis aggregates incompatible currency/unit/package/source observations
Status: OPEN — DATA INTEGRITY HIGH
Location: `price-intelligence.service.ts`, `price-persistence.service.ts`.

### PB-060 — Price analysis/history has duplicate service ownership
Status: OPEN / ARCHITECTURE
Locations: price-analysis/history/history-store/intelligence/market-analysis services.

### PB-061 — In-memory price history duplicates durable PriceSnapshot
Status: OPEN
Locations: `price-history-store.service.ts`, `price-persistence.service.ts`.

### PB-062 — Price scheduling timezone policy duplicated/hard-coded
Status: OPEN
Locations: three price scheduler services.

### PB-063 — Nightly attempts counter off-by-one reporting risk
Status: DESIGN/VALIDATION REVIEW
Location: `nightly-market-intelligence.service.ts` retry loop.

### PB-064 — Price source registry lacks health/capability/trust metadata
Status: OPEN / DESIGN
Location: `price-source-registry.service.ts`.

### PB-065 — Product matching does not explicitly penalize package-size variants
Status: OPEN / DESIGN REVIEW
Location: `product-matching.service.ts`.

### PB-066 — Shopping from-recipe path does not ownership-scope Recipe
Status: OPEN — SECURITY/DATA HIGH
Location: `shopping/shopping.service.ts` `addRecipeMissing()`.

### PB-067 — Household consumption learning has no unit identity
Status: OPEN — DATA INTEGRITY HIGH
Location: `household-consumption-learning.service.ts`.

### PB-068 — Smart purchase basket can mix currencies against one numeric budget
Status: OPEN — DATA INTEGRITY HIGH
Location: `smart-purchase-basket.service.ts`.

### PB-069 — PurchasePlanService does not enforce item currency == plan currency
Status: OPEN — DATA INTEGRITY HIGH
Location: `purchase-plan.service.ts`.

### PB-070 — Shopping base module has no direct automated test
Status: OPEN — TEST GAP
Location: `apps/backend/src/modules/shopping/`.

### PB-071 — Price controller lacks direct controller test
Status: OPEN — TEST GAP
Location: `price-intelligence/controllers/price-intelligence.controller.ts`.

### PB-072 — Automatic price scheduler lacks direct service test
Status: OPEN — TEST GAP
Location: `price-intelligence/services/automatic-price-scheduler.service.ts`.

### PB-073 — Goals use raw SQL tables outside final Prisma model contract
Status: OPEN — DATA/SCHEMA HIGH
Locations: `apps/backend/src/modules/goals/services/goals.service.ts`, tables `Goal` and `GoalCheckin`, final `apps/backend/prisma/schema.prisma`.
Problem: goal create/find/update/checkin/delete all use raw SQL; Goal/GoalCheckin are not represented as final Prisma models.

### PB-074 — Goal check-in dateKey uses UTC without user timezone
Status: OPEN — TIMEZONE HIGH
Location: `goals.service.ts` `checkin()`.

### PB-075 — Goal DTOs have no runtime validation decorators
Status: OPEN
Locations: Goals create/update/checkin DTOs.

### PB-076 — Habit today/streak/weekly window is UTC-based rather than user-local
Status: OPEN — TIMEZONE HIGH
Location: `habits.service.ts`.

### PB-077 — Habit DTOs have no validation decorators
Status: OPEN
Location: `habits/dto/habit.dto.ts`.

### PB-078 — Habit weekly summary possible-count semantics are simplistic
Status: OPEN / DESIGN REVIEW
Location: `habits.service.ts` `getWeeklySummary()`.

### PB-079 — Calendar update endpoint uses inline unvalidated patch body and explicit UTC semantics
Status: OPEN
Locations: CalendarController/Service.

### PB-080 — Daily Update DTO allows arbitrary numeric values without non-negative/range constraints
Status: OPEN
Location: `daily/dto/update-daily.dto.ts`.

### PB-081 — AddWaterDto has no validation decorators
Status: OPEN
Location: `daily/dto/add-water.dto.ts`.

### PB-082 — Smart notification workout query has no end-of-day upper bound
Status: OPEN — TIME/LOGIC HIGH
Location: `notifications/services/smart-notification.service.ts`.

### PB-083 — Supplements contain conflicting duplicate CreateSupplementDto definitions
Status: OPEN — API CONTRACT
Locations: Supplements DTOs/controller/service.

### PB-084 — Life Execution dependency/event SQL uses legacy table contracts
Status: OPEN — DATA/SCHEMA HIGH
Location: `life-execution/services/life-execution.service.ts`.

### PB-085 — Life Execution DTOs lack runtime validation decorators
Status: OPEN — API CONTRACT
Location: `life-execution/dto/task.dto.ts`.

### PB-086 — Life Execution core service has no direct service spec in inspected tree
Status: OPEN — TEST GAP
Location: `life-execution/services/life-execution.service.ts`.

### PB-087 — Health module contains a duplicate legacy root controller/service/test surface
Status: OPEN — ARCHITECTURE/CONTRACT
Locations: root Health controller/service/specs versus active nested Health controllers/services.

### PB-088 — Active Health profile DTOs do not enforce domain ranges or enumerated values
Status: OPEN — DATA INTEGRITY
Locations: active Health DTOs/services.

### PB-089 — Fitness controller write bodies lack DTO/runtime validation
Status: OPEN — API CONTRACT
Location: `fitness/controllers/fitness.controller.ts`.

### PB-090 — Active persistent and inactive in-memory FitnessProfileService implementations coexist and direct tests cover the inactive implementation
Status: OPEN — ARCHITECTURE/TEST INTEGRITY
Locations: Fitness module/persistence/service/spec.

### PB-091 — Fitness profile normalization lacks semantic ranges/enums
Status: OPEN — DATA INTEGRITY
Location: `fitness-profile-persistence.service.ts`.

### PB-092 — Active/inactive Fitness natural-goal parsing diverges
Status: OPEN — CONTRACT DRIFT
Locations: both Fitness profile implementations.

### PB-093 — Workout patch/create contract lacks dedicated validated DTO and explicit invalid-date/empty-text rejection
Status: OPEN — API CONTRACT/DATA INTEGRITY
Locations: Workout controller/service/DTO.

### PB-094 — Workout weekly summary uses UTC calendar boundaries without explicit user-local conversion
Status: OPEN — TIMEZONE
Location: WorkoutService weekly/date helpers.

### PB-095 — Calisthenics session generator can exceed requested duration and has no input validation
Status: OPEN — LOGIC
Location: `calisthenics-session-generator.service.ts`.

### PB-096 — Gym session generator silently clamps duration and uses coarse workload fitting
Status: OPEN — LOGIC
Location: `gym-session-generator.service.ts`.

### PB-097 — Yoga controller inputs lack DTO/runtime validation
Status: OPEN — API CONTRACT
Location: `yoga/controllers/yoga.controller.ts`.

### PB-098 — Yoga motion analysis ignores per-landmark confidence and treats missing landmarks as angle=180
Status: OPEN — LOGIC/SAFETY
Location: `yoga-motion-analysis.service.ts`.

### PB-099 — Backend PoseProvider contract differs from Mobile PoseProvider contract
Status: OPEN — CROSS-PLATFORM CONTRACT
Locations: backend pose-provider model; Mobile pose pipeline/bridge.

### PB-100 — YogaCoachService consumes hold duration during enter phase, effectively skipping hold timing
Status: OPEN — LOGIC HIGH
Location: `yoga-coach.service.ts`.

### PB-101 — Fitness TrainingConstraint type is incompatible with FitnessDecisionPolicyService low-impact check
Status: OPEN — LOGIC/TYPE CONTRACT HIGH
Locations: Fitness model/policy/brain context.

### PB-102 — FitnessSessionOrchestrator ignores policy blockers/canDecide
Status: OPEN — SAFETY/LOGIC HIGH
Location: `fitness-session-orchestrator.service.ts`.

### PB-103 — FitnessSkillUnlock ownTrend path can unlock advanced skills without enforcing missing prerequisites
Status: OPEN — LOGIC
Location: `fitness-skill-unlock.service.ts`.

### PB-104 — Fitness natural-goal IDs generated from Date.now() are unstable/collision-prone
Status: OPEN — DATA IDENTITY
Location: `fitness-profile-persistence.service.ts`.

### PB-106 — E2E DB preparation uses prisma db push and can mask migration-chain drift
Status: OPEN — TEST/SCHEMA HIGH
Location: `apps/backend/test/prepare-e2e-db.cjs`.

### PB-107 — E2E unauthenticated/high-risk endpoint coverage is incomplete
Status: OPEN — SECURITY TEST GAP
Locations: E2E API/app specs and high-risk controllers.

### PB-108 — Mobile typecheck-repair workflow can mutate source and push commits automatically
Status: OPEN — GOVERNANCE/REPRODUCIBILITY
Location: `.github/workflows/mypa-mobile-typecheck-repair-once.yml`.

### PB-109 — Duplicate Android build workflows
Status: OPEN — CI ARCHITECTURE
Locations: `.github/workflows/android-build.yml`, `android-apk.yml`.

### PB-110 — ESLint static safety rules are weakened by broad any/unsafe warnings
Status: OPEN / DESIGN REVIEW
Location: `apps/backend/eslint.config.mjs`.

### PB-111 — Mobile onboarding is local-only and does not synchronize collected profile data to backend
Status: OPEN — DATA CONSISTENCY HIGH
Location: `apps/mobile/app/onboarding.tsx`, `lib/onboarding.ts`.

### PB-112 — NOT_APPLICABLE — earlier Mobile Brain execute-next route mismatch was disproven
Status: NOT_APPLICABLE
Locations: Mobile `lib/brain-execution.ts`; Personal Brain `controllers/decision-execution.controller.ts`, `controllers/decision-feedback.controller.ts`.
Reason: audited backend exposes `POST /personal-brain/decision/execute-next`, `POST /personal-brain/decision/confirm`, and `POST /personal-brain/decision/feedback`, all JWT-protected. Keep this ID only as a correction trail; do not count it as an open contract break.

### PB-113 — Brain Overview ignores app locale and hardcodes English UI
Status: OPEN — LOCALIZATION
Location: `apps/mobile/app/brain-overview.tsx`.

### PB-114 — Mobile onboarding stored-state parser lacks runtime value/shape validation
Status: OPEN — DATA INTEGRITY
Location: `apps/mobile/lib/onboarding.ts`.

### PB-115 — Mobile localization and RTL handling are partial/inconsistent
Status: OPEN — UX/LOCALIZATION
Locations: Mobile i18n/language/screens.

### PB-116 — Daily screen generates smart notifications as a read-screen side effect
Status: OPEN — BEHAVIOR
Location: `apps/mobile/app/daily.tsx` loader.

### PB-117 — Mobile Meal Builder derives dateKey in UTC and can assign meals to wrong local day
Status: OPEN — TIMEZONE/DATA
Location: `apps/mobile/app/meal-builder.tsx`.

### PB-119 — Mobile Supplements mutations have no visible error handling or recovery state
Status: OPEN — UX/ROBUSTNESS
Location: `apps/mobile/app/supplements.tsx`.

### PB-120 — Mobile Yoga camera mode is unconfigured and feeds no pose frames to analysis
Status: OPEN — FEATURE GAP HIGH
Locations: `apps/mobile/app/yoga.tsx`, `lib/yoga-camera-bridge.ts`.

### PB-121 — Mobile reminder edit displays time using English locale regardless of current locale
Status: OPEN — LOCALIZATION
Location: `apps/mobile/app/reminders.tsx` `openEdit()`.

### PB-122 — No Mobile offline cache or mutation queue found
Status: OPEN / ROADMAP GAP
Locations: Mobile API/runtime.

### PB-123 — Duplicate EAS Android preview workflows
Status: OPEN — CI ARCHITECTURE
Locations: `.github/workflows/eas-android.yml`, `eas-preview.yml`.

### PB-124 — Command Center quick commands use hard-coded amounts/times independent of context
Status: OPEN / DESIGN REVIEW
Location: `apps/mobile/lib/command-actions.ts`.

### PB-125 — Mobile automated test coverage is limited and lacks screen/integration E2E setup
Status: OPEN — TEST GAP
Locations: Mobile package/tests.

### PB-126 — Mobile domain API clients duplicate authentication/request implementations
Status: OPEN — ARCHITECTURE/ROBUSTNESS
Locations: multiple Mobile API clients.

### PB-127 — Expo Router typedRoutes is disabled
Status: OPEN — STATIC SAFETY
Location: `apps/mobile/app.json`.

### PB-128 — Local Persian TTS imports undeclared runtime dependencies
Status: OPEN — BUILD/DEPENDENCY
Locations: `apps/mobile/lib/local-persian-tts.ts`, `apps/mobile/package.json`.
Problem: imports `expo-av`, `expo-file-system/legacy`, `react-native-sherpa-onnx`, none declared in Mobile manifest.

### PB-129 — Local Persian TTS model download lacks cryptographic integrity verification
Status: OPEN — SUPPLY CHAIN
Locations: `apps/mobile/lib/local-persian-tts.ts`, `apps/mobile/scripts/prepare-khadijah-tts-model.cjs`.

### PB-130 — Push-token refresh listener can reuse an expired access token
Status: OPEN — AUTH/ROBUSTNESS
Location: `apps/mobile/lib/notifications/push-registration.ts`.

### PB-131 — Mobile API default localhost:3000 is incompatible with physical-device access without env override
Status: OPEN — DEVICE/RUNTIME
Locations: Mobile API clients; `.env.example`, `apps/mobile/scripts/start-lan.cjs`.

### PB-132 — MYPA branch-validation Mobile gate checks only typecheck and omits normal Mobile CI checks
Status: OPEN — CI COVERAGE
Locations: `.github/workflows/mypa-branch-validation.yml`, `.github/workflows/mobile-ci.yml`.

### PB-133 — BrandMark SVG asset loading lacks observed SVG transformer/rendering configuration
Status: OPEN — BUILD VALIDATION
Location: `apps/mobile/components/BrandMark.tsx` and Mobile config/manifest.

### PB-134 — Mobile auth tokens are stored in AsyncStorage rather than secure credential storage
Status: OPEN — SECURITY HIGH
Locations: `apps/mobile/lib/api.ts`, domain clients.

### PB-135 — ContentRecommendationService has no observed real consumer
Status: OPEN — ARCHITECTURE
Location: `apps/backend/src/modules/content/content-recommendation.service.ts` and module export.

### PB-136 — Content catalog media/license contract is richer than TypeScript candidate types
Status: OPEN — CONTRACT DRIFT
Locations: `content-catalog.schema.json`, `content.types.ts`.

### PB-137 — Dashboard user-day and weekly boundaries default to UTC rather than user timezone
Status: OPEN — TIMEZONE HIGH
Location: `dashboard.service.ts`.

### PB-138 — Daily Command Center treats future workouts as today's workouts
Status: OPEN — TIME/LOGIC HIGH
Location: `daily-command-center.service.ts` workout query.

### PB-139 — Device Intelligence health-data endpoint is public/unguarded
Status: OPEN — SECURITY/MODEL HIGH
Locations: `device-intelligence.controller.ts`, service, `app.module.ts`.

### PB-140 — Active FitnessController uses req.user.sub although JwtStrategy exposes a Prisma User with id
Status: OPEN — AUTH/SECURITY HIGH
Locations: `auth/strategies/jwt.strategy.ts`, `users/users.service.ts`, active `fitness/controllers/fitness.controller.ts`.
Problem: JWT validation returns a User object with `id`, while FitnessController accesses `req.user.sub`.

### PB-141 — ContentRecommendationService has no direct automated test in inspected tree
Status: OPEN — TEST GAP
Location: `content/content-recommendation.service.ts`.

### PB-142 — Dashboard and Daily Command Center boundary bugs lack future-activity regression tests
Status: OPEN — TEST GAP
Locations: dashboard and daily-command-center specs.

### PB-143 — Refresh-token rotation is not enforced; old refresh sessions remain valid after successful refresh
Status: OPEN — SECURITY HIGH
Locations: `auth.service.ts`, `services/session.service.ts`.
Problem: refresh creates a new session but does not revoke/delete the old refresh session.

### PB-144 — No application-level auth rate limiting/security middleware observed
Status: OPEN / SECURITY DESIGN REVIEW
Locations: `bootstrap.ts`, `main.ts`, backend package manifest.
Caveat: external WAF/ingress may provide compensating controls.

### PB-145 — Legacy root UsersController uses stale req.user.sub contract
Status: OPEN — ARCHITECTURE/CONTRACT
Locations: root `users.controller.ts` versus active nested controller, `users.module.ts`.

### PB-146 — Authentication/session service has no direct spec found at expected service test path
Status: OPEN — TEST GAP
Locations: `auth.service.ts`, `services/session.service.ts`.

### PB-147 — Mobile Price History hardcodes تومان and ignores snapshot currency
Status: OPEN — DATA/UX HIGH
Location: `apps/mobile/app/price-history.tsx` `money()` helper and price render calls.
Problem: Mobile `PriceSnapshot` includes `currency`, but the formatter always appends تومان.
Impact: non-IRR/non-toman observations can be displayed with a false unit; this compounds PB-058/PB-059.

### PB-148 — Mobile Price History chart legend forces a fabricated zero minimum
Status: OPEN — UI/DATA PRESENTATION
Location: `apps/mobile/app/price-history.tsx` `Math.min(...history.map(x=>x.amount),0)` and legend.
Problem: positive histories are displayed with a minimum of zero even when no zero-price observation exists.
Impact: the chart's range and legend can materially misrepresent observed market prices.

### PB-149 — Mobile push-registration helpers have no active application consumer
Status: OPEN — FEATURE/INTEGRATION HIGH
Location: `apps/mobile/lib/notifications/push-registration.ts`; repository-wide search for `registerForPushNotifications()` and `listenForPushTokenRefresh()` found only their definitions.
Problem: the app contains device registration logic and permission/token handling, but no inspected screen, root layout, hook or bootstrap path invokes it.
Impact: push token registration may never occur, so the backend can have no device token to deliver notifications even though the notification UI/runtime code exists.

### PB-150 — Mobile notification runtime bootstrap is not invoked by the app
Status: OPEN — FEATURE/INTEGRATION HIGH
Location: `apps/mobile/lib/notifications/push-runtime.ts`; repository-wide search for `startNotificationRuntime()` / `consumeLastNotificationResponse()` found only definitions inside that file.
Problem: foreground notification handler and notification-response listeners are implemented but not wired into app startup/navigation.
Impact: foreground receipt behavior and deep-link/action response handling may never activate; tapped-notification routing can be lost.

### PB-151 — Mobile notification action feedback has no active consumer or API transport
Status: OPEN — FEATURE/INTEGRATION
Locations: `apps/mobile/lib/notifications/notification-actions.ts`, backend `personal-brain/services/notification-feedback-adapter.service.ts`, `notification-feedback.service.ts`.
Problem: Mobile builds `{eventType,dedupeKey,action,snoozeUntil}` through `buildNotificationFeedback()`, but search found no caller. Backend has an adapter/service but no matching controller endpoint was found in inspected controller search.
Impact: `complete/snooze/dismiss/open` feedback cannot currently travel from notification interaction to the learning/feedback backend path.

### PB-152 — Mobile TypeScript typecheck excludes all test files
Status: OPEN — TEST/STATIC COVERAGE
Location: `apps/mobile/tsconfig.json` `exclude` array.
Problem: `**/*.spec.ts`, `**/*.spec.tsx`, `**/*.test.ts`, and `**/*.test.tsx` are excluded from the compiler input.
Impact: the already-small set of Mobile unit/contract tests is not even covered by the standard Mobile typecheck gate, allowing test-only type errors to remain hidden.

### PB-153 — Mobile retains duplicate legacy brand source alongside active branding source
Status: OPEN — ARCHITECTURE
Locations: `apps/mobile/lib/brand.ts`, `apps/mobile/lib/branding.ts`.
Problem: both export a `BRAND` object with overlapping identity/color/radius/typography values, but they have different values and shapes. The active inspected UI uses `branding.ts`; `brand.ts` has no observed consumer.
Impact: future components can import the legacy source and silently diverge from canonical product branding/design tokens.

### PB-154 — Mobile voice/TTS module imports undeclared expo-speech dependency
Status: OPEN — BUILD/DEPENDENCY
Locations: `apps/mobile/lib/voice.ts`, `apps/mobile/package.json`.
Problem: `voice.ts` imports `expo-speech`, but Mobile manifest does not declare `expo-speech`.
Impact: voice functionality depends on an undeclared runtime package and is not represented in the reproducible Mobile dependency graph.

### PB-155 — Mobile voice/TTS feature has no observed active consumer
Status: OPEN — FEATURE/INTEGRATION
Location: `apps/mobile/lib/voice.ts`.
Problem: repository search for `speakAssistantText`, `stopAssistantSpeech`, `getStoredVoiceProfile`, and `setStoredVoiceProfile` found only definitions in `voice.ts`.
Impact: voice profile persistence and assistant speech may not be activated by the current app, despite the implementation existing.

### PB-156 — LifeTasksModule is source-present but not runtime-wired
Status: OPEN — ARCHITECTURE/FEATURE
Locations: `apps/backend/src/modules/life-tasks/life-tasks.module.ts`, `apps/backend/src/app.module.ts`.
Evidence: `LifeTasksModule` exists with controller/service but AppModule does not import it; no external consumer was found.
Impact: `/tasks` source/API is not active in the audited Nest application.

### PB-157 — LifeTasks and LifeExecution are parallel task-domain implementations
Status: OPEN — ARCHITECTURE/CONTRACT DRIFT
Locations: `apps/backend/src/modules/life-tasks/*`, `apps/backend/src/modules/life-execution/*`, related migrations.
Evidence: both domains implement overlapping task CRUD/dependency/event semantics; LifeTasks uses `LifeTaskDependency`/`LifeTaskEvent`, while LifeExecution uses legacy `TaskDependency`/`TaskEvent`.
Impact: parallel semantics can diverge and an inactive module can become stale or be wired accidentally later.

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
Evidence: search for `RecommendationIntelligenceModule` found only its own declaration. No active module imports it.
Impact: Recommendation Intelligence services are not part of the audited runtime dependency graph.

### PB-162 — RecommendationIntelligenceController is an empty shell; documented food endpoint is not exposed
Status: OPEN — API CONTRACT HIGH
Location: `apps/backend/src/modules/recommendation-intelligence/controllers/recommendation-intelligence.controller.ts`.
Evidence: controller contains only the route prefix and no methods.
Impact: documented `POST /recommendation-intelligence/food` is not provided by this controller in the audited commit.

### PB-163 — Current State documentation falsely describes Recommendation Intelligence food endpoint as implemented
Status: OPEN — DOCUMENTATION/ARCHITECTURE
Locations: `apps/backend/docs/05_CURRENT_STATE.md`, recommendation-intelligence controller, module wiring.
Impact: engineering docs give a stronger runtime-completeness claim than the actual controller/wiring supports.

### PB-164 — GoalIntelligenceModule is source-present but not runtime-wired
Status: OPEN — ARCHITECTURE/FEATURE
Location: `apps/backend/src/modules/goal-intelligence/goal-intelligence.module.ts` and module import graph.
Evidence: search for `GoalIntelligenceModule` found only its own declaration; no active importer was found.

### PB-165 — Goal Intelligence service cluster is placeholder-level and disconnected
Status: OPEN — ARCHITECTURE/DESIGN
Locations: `goal-intelligence/services/goal-analysis.service.ts`, `goal-planning.service.ts`, `goal-progress.service.ts`.
Evidence: each service resolves a fixed no-op style response (`{ analyzed: true }`, `{ planCreated: true }`, `{ progressTracked: true }`) and no external consumer was found.

### PB-166 — Goal Intelligence has no direct service tests in inspected tree
Status: OPEN — TEST GAP
Locations: Goal Intelligence service files/module.

### PB-183 — Mobile component layer contains duplicate/orphaned animation wrappers
Status: OPEN — ARCHITECTURE/INTEGRATION
Locations: `apps/mobile/components/AnimatedPressable.tsx`, `apps/mobile/components/AnimatedSection.tsx`, `apps/mobile/lib/motion.tsx`.
Evidence: `lib/motion.tsx` already exports `AnimatedPressable` and `AnimatedSection`; the component directory redefines wrappers with the same exported names. Repository search found no observed external consumer of the component-directory `AnimatedPressable`/`AnimatedSection` files.
Impact: two competing import surfaces can diverge in behavior/types, while the component wrappers add little contract value beyond the existing motion module.

### PB-184 — Mobile command-center visual components use hardcoded English/visual semantics outside the localization layer
Status: OPEN — LOCALIZATION
Locations: `apps/mobile/components/decision-trace-card.tsx`, `apps/mobile/components/plan-status-card.tsx`.
Evidence: `DecisionTraceCard` renders `Waiting`, `Stopped`, `Completed`, `Brain trace`, and `toLocaleString()` directly; `PlanStatusCard` contains its own small fa/en switch rather than consuming the app i18n dictionary.
Impact: Brain command-center UI can remain partially untranslated and formatting can vary from the global locale policy. `PlanStatusCard` is consumed by `command-center-v2`, so this is active UI rather than an unused component-only concern.

## Next deterministic work

1. Finish remaining Mobile route/component/library/native inventory and exhaustive backend-to-mobile consumer/route reconciliation.
2. Finish remaining Fitness-adjacent and Platform/common/test source inventory; reconcile support matrices and review gaps.
3. Complete repository-wide route/API, database reader/writer/transaction, security/privacy and historical reconciliation.
4. Record actual runtime/test/build/device execution only when executed; otherwise keep statuses as file-read or blocked.
5. Only after Master Prompt closure begin the separate correction phase using this issue catalog as the repair plan.
