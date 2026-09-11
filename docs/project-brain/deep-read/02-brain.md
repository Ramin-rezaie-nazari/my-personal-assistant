# Brain Deep Read

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: complete Assistant TypeScript source/test scope; Personal Brain module and a substantial production slice covering state/reasoning/orchestration, decision selection/conflict/safety/execution/audit/learning, plan persistence/execution, adaptive replanning, action adapters, and selected Memory Intelligence production/repository/services/tests.
Scope not yet read: remaining Personal Brain production/spec files; complete Memory Intelligence source/tests; `brain-integration`; `conversation-engine`; `decision-engine` (as a separate module if present); `adaptive-learning`; `goal-intelligence`; full cross-module consumer verification; full test execution.
Evidence roots: `apps/backend/src/modules/assistant/`; `apps/backend/src/modules/personal-brain/`; `apps/backend/src/modules/memory-intelligence/`; `apps/backend/prisma/schema.prisma`; relevant migrations.
Confidence level: HIGH for Assistant file-level scope; HIGH for the specifically listed Personal Brain and Memory files read; MEDIUM for end-to-end behavior because tests have been read but not executed; LOW for the complete Brain deep-read.
Open questions: finish remaining Brain modules; reconcile all execution/outcome persistence; prove route/controller ownership across every adapter; reconcile rich memory governance fields with durable storage; runtime test results.

## Assistant orchestration observed

`AssistantModule` imports `PrismaModule` and `PersonalBrainModule`, and wires assistant orchestration services including `AssistantService`, contextual command handling, planning, natural action execution, conversation context/history, local language understanding, a local intelligence provider, and a local basket adapter. Evidence: `apps/backend/src/modules/assistant/assistant.module.ts`.

`AssistantController` exposes public status, authenticated history, authenticated natural-language processing, and authenticated confirmation. `GET /assistant` is not guarded, while `/assistant/history`, `POST /assistant`, and `POST /assistant/confirm` use `JwtAuthGuard`. Evidence: `apps/backend/src/modules/assistant/controllers/assistant.controller.ts`; controller spec.

`AssistantService.process()` appends the user turn, resolves contextual references, runs local language understanding, builds a local plan, uses local deterministic intent mapping when confidence is sufficient, otherwise delegates to `BrainOrchestratorService`, then optionally executes the selected action via `NaturalActionExecutionService`, and finally appends the assistant turn with action/execution/resource references. Evidence: `apps/backend/src/modules/assistant/services/assistant.service.ts` and its tests.

## Deterministic local understanding

`LocalLanguageUnderstandingService` is a rule/regex based classifier that normalizes Persian/Arabic characters and digits, extracts common entities and maps a fixed local intent set. `ContextualCommandService` adds reference resolution, clause splitting, operation detection, contradictions and confidence scoring. Evidence: respective Assistant files and specs.

The food vocabulary is a small hard-coded bootstrap list. Evidence: `local-language-understanding.service.ts`.

## Action execution and safety gates

`NaturalActionExecutionService` creates decision candidates and delegates to `DecisionExecutionCoordinatorService`. It supports sequential plans, stops on pending confirmation/blocked/unsupported outcomes and bounded recovery. Cancellation requires confirmation through the planning/coordinator path. Evidence: Assistant execution/planning services and specs.

`LocalBasketActionAdapter` performs direct `FoodItem` lookup and `ShoppingItem` writes using a hard-coded alias map. Evidence: `apps/backend/src/modules/assistant/adapters/local-basket-action.adapter.ts`.

## Personal Brain orchestration

`PersonalBrainModule` imports Conversation Engine, Daily, Workout, Habits, Supplements, Brain Integration, Context Engine, Memory Intelligence, User Intelligence, Reminders, Calendar, Fitness, Yoga, Calisthenics and Gym modules. It registers and exports a very large service graph covering decisioning, scheduling, proactive coaching/notifications, execution, learning, explanations and action adapters. Evidence: `apps/backend/src/modules/personal-brain/personal-brain.module.ts`.

`BrainOrchestratorService` builds `BrainReasoningContext`, runs `BrainDecisionPipelineService`, detects scenario intent, and can compare a primary/deferred scenario using goal alignment plus simple budget/capacity signals. Evidence: `brain-orchestrator.service.ts`.

`BrainStateService` concurrently loads context, memory, goals, daily/weekly status, nutrition targets, workout status and life context; it then builds additional Context Engine context and fuses life-context signals. Shopping, budget and wearable inputs in the fusion call are currently empty/zero-confidence placeholders in this layer. Evidence: `brain-state.service.ts`.

`BrainReasoningContextService` derives readiness signals and a life-context quality score before invoking the reasoning engine. Evidence: `brain-reasoning-context.service.ts`.

`BrainDecisionService` is deterministic keyword/regex decision logic for goal, nutrition-target, habit, reminder, supplement, workout, weekly and daily status requests. It produces explicit blockers and next actions when required context is missing. Evidence: `brain-decision.service.ts`.

`BrainDecisionPipelineService` combines fitness-aware or base decision output with historical explanation memory, a learning-policy confidence boost, and outcome-memory confidence adjustment, then creates a decision explanation. Evidence: `brain-decision-pipeline.service.ts`.

## Unified decision / execution layer

`UnifiedDecisionEngineService` filters excluded/expired/blocked candidates, gives hard constraints precedence, resolves pairwise conflicts, ranks candidates by priority/confidence/score and optionally goal alignment/goal downside, and emits human-readable rationale. Evidence: `unified-decision-engine.service.ts`.

`DecisionConflictResolutionService` detects time/budget/capacity/health/goal conflicts. A notable implementation detail is that conflict resolution's final `prefer_first`/`prefer_second` comparison calls `utility()` with an empty context, so context urgency used for the initial ranking is not used in that final pairwise preference. Evidence: `decision-conflict-resolution.service.ts`. This is a review finding, not yet a code change.

`DecisionSafetyGuardService` caps total actions and actions per domain and can block configured domains. Evidence: `decision-safety-guard.service.ts`.

`DecisionGuardrailService` composes in-memory idempotency and rate limiting before execution. Idempotency keys are `${userId}:${candidate.id}:${candidate.action}` with a 24-hour in-memory TTL by default. Evidence: `decision-guardrail.service.ts`, `decision-idempotency.service.ts`, `decision-rate-limiter.service.ts`.

`DecisionExecutionCoordinatorService` applies execution policy and confirmation first, then guardrails, adapter execution, feedback/history, asynchronous decision audit and asynchronous outcome learning. It distinguishes `completed`, `blocked`, `unsupported`, `failed`, `dry_run`, `pending_confirmation`, and `confirmation_invalid`. Evidence: `decision-execution-coordinator.service.ts`.

`DecisionExecutionPolicyService` applies domain-specific timeout/retry defaults, caps requested policy values and performs timed execution with bounded retries. Evidence: `decision-execution-policy.service.ts`.

`DecisionExecutionStateService` is in-memory only; it tracks pending/running/completed/failed/cancelled execution state by key. Evidence: `decision-execution-state.service.ts`.

`DecisionExecutionHistoryService` is also in-memory only, with a configurable retention policy defaulting to three months and bounded query/cleanup functions. Evidence: `decision-execution-history.service.ts`, `decision-history-retention.service.ts`.

`PersistentPlanStateService` persists multi-step plan state into the Prisma `PlanExecutionState` model and supports resume/clear. `PlanExecutionService` uses it to save running/partial/blocked/failed/completed states and resume unfinished work. Evidence: both plan-state services and final Prisma schema.

## Action adapters and ownership

`ReminderActionAdapter`, `CalendarActionAdapter`, `WorkoutActionAdapter`, `HabitActionAdapter` and `SupplementActionAdapter` all require a `userId` and pass it to their domain services while obtaining the target resource from contextual state. Their implementations are narrow, deterministic parsers rather than general LLM actions. Evidence: each adapter path.

`LifeTaskActionAdapter` uses raw SQL against `LifeTask`, requiring candidate ID + user ID, and performs an ownership-scoped lookup/update. Evidence: `life-task-action-adapter.ts`.

`WorkoutActionAdapter` uses the current UTC date (`toISOString().slice(0,10)`) when a time is supplied without a date, which is potentially inconsistent with a user's local timezone. Evidence: `workout-action-adapter.ts`. This remains a review finding only.

## Audit / explanation / learning

`DecisionAuditService` persists to Prisma `DecisionAuditEntry` when a Prisma service is provided, otherwise keeping in-memory fallback entries. Evidence: `decision-audit.service.ts` and the Prisma model.

`DecisionExplanationMemoryService` reads recent/trend data from `DecisionAuditEntry`, including repeated reasons and selected-action frequency. Evidence: `decision-explanation-memory.service.ts`.

`DecisionLearningPolicyService` adds a small confidence boost for stable repeated decision patterns. `DecisionFeedbackLoopService` writes personalization signals and outcome-learning records. Evidence: respective services.

`DecisionOutcomeLearningService` directly executes parameterized raw SQL against `DecisionOutcome`. It validates outcomes/scores, computes historical profiles/trends and per-decision confidence adjustments. This is an active runtime dependency on the migration-created `DecisionOutcome` table even though that table is absent from final `schema.prisma`. Evidence: `decision-outcome-learning.service.ts`; `apps/backend/prisma/migrations/...decision outcome...`; final Prisma schema.

A further observation is that `DecisionExecutionCoordinatorService.record()` writes outcome-learning rows for almost every receipt. In that mapping, completed/dry-run/blocked/pending/confirmation-invalid become `neutral`, while failed/unsupported become `negative`; direct feedback records separately map accepted/completed to positive. The effective learning signal therefore depends on which path records the outcome. Evidence: `decision-execution-coordinator.service.ts`; `decision-feedback-loop.service.ts`.

## Memory Intelligence

`MemoryIntelligenceModule` binds both in-memory and persistent repositories, but the active `MEMORY_REPOSITORY` and `PERSISTENT_MEMORY_REPOSITORY` providers point to `PrismaMemoryRepository`. Evidence: `memory-intelligence.module.ts`.

`Memory` is a rich contract with user ownership, type/key/value/importance plus optional governance fields for layer/source/visibility/confidence/retention/relationships/topics/confirmation/expiry. Evidence: `memory.model.ts`.

`PrismaMemoryRepository` maps durable Memory records to `UserFact` rows with source `brain-memory`, serializing `value` as JSON and clamping importance to a 0-100 integer. It scopes reads/writes/deletes by user ID. However, the richer optional governance fields are not written to `UserFact`; they are therefore not durably represented by this persistence adapter. Evidence: `prisma-memory.repository.ts`; `memory.model.ts`; final Prisma `UserFact` schema.

`MemoryRetrievalService` performs user-scoped retrieval by loading all user memories and filtering key/value by lowercase substring. `MemoryRankingService` then ranks by token match, exact phrase/key bonuses and importance. Evidence: corresponding services and ranking tests.

`MemoryGovernanceService` supports retention windows, expiry checks, reinforcement and confidence increases on confirmation; `MemorySurfaceService` applies visibility/confidence/importance thresholds for user/brain exposure. Evidence: their services.

`MemoryLifecycleService` composes classification, scoring and consolidation, but `MemoryClassificationService`, `MemoryScoringService`, and `MemoryConsolidationService` are currently minimal implementations. `MemoryManagerService` in Personal Brain is also a placeholder that returns a success message without storing anything itself. Evidence: the respective service paths.

## Batch status

### BATCH-0004A — Assistant orchestration
Status: COMPLETE for the exact orchestration files read.

### BATCH-0004B — Assistant module complete
Status: COMPLETE for all TypeScript source/test files enumerated under `apps/backend/src/modules/assistant/`. `__tmp_fix_note.md` is non-source/N/A.

### BATCH-0004C — Personal Brain + Memory Intelligence foundation
Status: IN_PROGRESS. Substantial production slice read and findings recorded. Full module completion is not claimed until every source/test file in the required scopes is actually read.

### Next
Continue deterministic reading of all remaining Personal Brain production/spec files, then finish Memory Intelligence, Brain Integration, Conversation Engine, Decision Engine, Adaptive Learning and Goal Intelligence. After all Brain source is read, reconcile cross-module contracts into the required matrices and run whatever validation is possible through available repository tooling.
