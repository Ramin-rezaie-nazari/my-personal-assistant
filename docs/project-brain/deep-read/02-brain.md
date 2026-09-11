# Brain Deep Read

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: complete Assistant TypeScript source/test scope; substantial Personal Brain production source; complete Brain Integration, Conversation Engine, Decision Engine and Adaptive Learning source scopes; complete Goal Intelligence source scope (module/controller/DTO/services); complete Memory Intelligence source and test scope as enumerated; selected Personal Brain tests.
Scope not yet read: remaining Personal Brain source/test files; repository-wide cross-consumers; full automated test execution; later platform/mobile/food/shopping/life-health/fitness scopes beyond the Brain integrations already observed.
Evidence roots: `apps/backend/src/modules/assistant/`; `apps/backend/src/modules/personal-brain/`; `apps/backend/src/modules/brain-integration/`; `apps/backend/src/modules/conversation-engine/`; `apps/backend/src/modules/decision-engine/`; `apps/backend/src/modules/adaptive-learning/`; `apps/backend/src/modules/goal-intelligence/`; `apps/backend/src/modules/memory-intelligence/`; `apps/backend/prisma/`.
Confidence level: HIGH for modules marked complete at file-level; MEDIUM for end-to-end behavior because tests are read but not executed; LOW for repository-wide integration until remaining audit scopes are read.
Open questions: finish Personal Brain residual files/tests; verify all module imports/providers; reconcile runtime contracts; execute tests; route/mobile/database consumer map.

## Assistant orchestration
`AssistantModule` imports Prisma + Personal Brain and wires deterministic language understanding, contextual follow-up, planning, conversation persistence, provider routing and action execution. `AssistantController` exposes public status and guarded history/process/confirm endpoints. `AssistantService` uses local deterministic interpretation first, Brain fallback second, then action execution and persisted turns. Evidence: `apps/backend/src/modules/assistant/assistant.module.ts`, `controllers/assistant.controller.ts`, `services/assistant.service.ts`.

The local parser normalizes Persian/Arabic characters/digits, extracts common entities and maps a fixed local intent set. `ContextualCommandService` adds previous-resource references, clause splitting, conflict detection and confidence. Local basket action uses hard-coded food aliases and direct `FoodItem`/`ShoppingItem` access. Evidence: corresponding Assistant services/adapter/specs.

## Personal Brain orchestration
`PersonalBrainModule` wires a large graph spanning state, decisions, scheduling, fitness, goals, memory, execution, adapters and learning. `BrainOrchestratorService` builds reasoning context, runs a decision pipeline and can compare scenarios. `BrainStateService` loads context, memory, goals, daily/weekly state, nutrition, workout and life context concurrently. Evidence: `personal-brain.module.ts`, `brain-orchestrator.service.ts`, `brain-state.service.ts`.

`BrainDecisionService` uses deterministic pattern/rule logic for daily/weekly/workout/habit/reminder/supplement/nutrition status. `BrainDecisionPipelineService` adds historical explanation and outcome-learning adjustment before producing a decision explanation. Evidence: the corresponding service files.

## Unified decision / execution
`UnifiedDecisionEngineService` filters unsafe/expired candidates, gives hard constraints priority, resolves conflicts and ranks candidates with priority/confidence/score plus goal alignment/downside. `DecisionConflictResolutionService` handles time/budget/capacity/health/goal conflicts, but its final pairwise preference recomputes utility with an empty context, dropping urgency from that comparison. Evidence: `unified-decision-engine.service.ts`, `decision-conflict-resolution.service.ts`.

`DecisionSafetyGuardService`, `DecisionGuardrailService`, `DecisionIdempotencyService` and `DecisionRateLimiterService` provide action caps, blocked domains, idempotency and per-user/domain rate limiting. Idempotency/rate state is process-local with a 24-hour default for idempotency. Evidence: those service files.

`DecisionExecutionCoordinatorService` applies policy/confirmation, guardrails, adapter execution, history/feedback and asynchronous audit/outcome-learning. `DecisionExecutionPolicyService` bounds timeout/retries. `DecisionExecutionStateService` and `DecisionExecutionHistoryService` are in-memory, while `PersistentPlanStateService` persists plan state through Prisma `PlanExecutionState`. Evidence: corresponding services and Prisma schema.

`PlanExecutionService` serializes selected candidates into dependent steps, resumes persisted state, stops on failed/blocked/pending-confirmation steps and returns `nextStep`. `DecisionExecutionPlannerService` currently makes each later step depend on all earlier steps, not only semantically required predecessors. Evidence: those files.

## Audit / learning / adaptation
`DecisionAuditService` uses Prisma `DecisionAuditEntry` when available and an in-memory fallback otherwise. `DecisionExplanationMemoryService` derives recent/trend signals from audit history. `DecisionFeedbackLoopService` writes personalization signals and `DecisionOutcomeLearningService` records outcome data and confidence adjustments.

`DecisionOutcomeLearningService` uses parameterized raw SQL against migration-created `DecisionOutcome`, confirming an active runtime dependency on a table absent from final Prisma schema. Evidence: `personal-brain/services/decision-outcome-learning.service.ts`, migration history and final schema.

`PersonalizationEngineService` is process-local and blends scores by confidence. `AdaptiveReplanningService` uses `DynamicReplanningService` + full-day schedule validation to decide whether execution requires replanning. `SmartPlanningService` and `FullDaySchedulerService` combine LifeTask/Goal/Reminder/Supplement/Habit state with user learning signals; Smart Planning also calls outcome adjustments. Evidence: corresponding services.

A timezone review finding remains: `WorkoutActionAdapter` derives a date from UTC `toISOString().slice(0,10)` when only a time is given, which may disagree with user-local calendar date. Evidence: `workout-action-adapter.ts`.

## Fitness decisioning
`FitnessDecisionPolicyService` deterministically selects yoga/calisthenics/gym using user goal, equipment, constraints and stable decision history. `FitnessSessionOrchestratorService` generates a discipline-specific session and applies `FitnessProgressionService`. `FitnessProgressionService` moves between progress/stay/regress/deload based on form, completion, perceived difficulty and recovery. `FitnessSkillUnlockService` uses exercise trends/recovery/form to gate calisthenics skill unlocks. Evidence: corresponding Personal Brain services.

## Action adapters
Reminder, Calendar, Workout, Habit and Supplement adapters all require `userId` and use contextual target resource IDs. LifeTask adapter uses raw SQL with both task ID and user ID. Evidence: corresponding adapter files.

## Memory Intelligence — file-level complete
`MemoryIntelligenceModule` binds both in-memory and Prisma repositories, but the active providers point to `PrismaMemoryRepository`. `Memory` contains rich governance metadata, while persistence only stores id/userId/category/key/value/importance/source/timestamps in `UserFact`; layer/visibility/confidence/retention/relationship/topic/confirmation/expiry fields are not persisted. Evidence: `memory-intelligence.module.ts`, `models/memory.model.ts`, `models/memory-governance.model.ts`, `repositories/prisma-memory.repository.ts`, final Prisma `UserFact` schema.

Retrieval is user-scoped substring search over key/value and ranking uses token/phrase/key bonuses plus importance. Governance handles retention/expiry/reinforcement/confirmation. Surfacing filters on visibility, confidence and importance. Consolidation intelligence chooses the highest importance×confidence representative and records absorbed IDs, while the base classification/scoring/consolidation services remain minimal. Evidence: all respective Memory Intelligence service files and tests.

`MemoryIntelligenceController` is JWT guarded and uses authenticated user ID for create/read/key/delete; the controller spec explicitly tests ownership scoping. Evidence: controller and controller spec.

`MemoryManagerService` in Personal Brain is still a placeholder despite real Memory Intelligence persistence existing, creating an architectural split between intended Brain memory orchestration and actual CRUD persistence. Evidence: `personal-brain/services/memory-manager.service.ts`.

## Brain Integration — file-level complete
`BrainIntegrationModule` imports Memory Intelligence and exports three services. `BrainContextService` returns only timestamp/source, so it is a thin placeholder. `BrainGoalService` reads only `UserProfile.primaryGoal` and returns one general goal. `BrainMemoryService` delegates to Memory Intelligence but does not pass a user ID, so its `getMemories()` call can resolve through the repository's required-user-id guard and potentially fail at runtime. This is a concrete cross-module contract mismatch to investigate. Evidence: `brain-integration/services/brain-context.service.ts`, `brain-goal.service.ts`, `brain-memory.service.ts`, `memory-intelligence/services/memory-intelligence.service.ts`, `repositories/prisma-memory.repository.ts`.

## Conversation Engine — file-level complete
The module contains a single `ConversationStyleService`, with default style `{tone:'friendly', language:'fa', formality:'informal'}`. There is no conversation endpoint or persistence logic in this module itself. Evidence: `conversation-engine.module.ts`, `conversation-style.service.ts`, `types`.

## Decision Engine — file-level complete
`DecisionEngineModule` imports Personal Brain and exposes a guarded `GET /decision-engine` that calls `ActionDecisionService`. `ActionDecisionService` obtains `BrainLifeContext`, evaluates deterministic rules and ranks candidates. `DecisionEngineService` itself remains a placeholder. `RuleEvaluationService` creates goal/reminder/supplement/habit candidates and `DecisionScoringService` sorts by score. Evidence: module/controller/services/spec.

## Adaptive Learning — file-level complete
`AdaptiveLearningController` is JWT guarded and exposes `GET /adaptive-learning` and `GET /adaptive-learning/insights?dateKey=...`. `AdaptiveLearningService` reads seven days of date-aware DailyLog data plus workouts/meals and user profiles, and emits ranked rule-based insights. The service validates `YYYY-MM-DD` date keys. Auxiliary `FeedbackAnalysisService` and `LearningMemoryService` are placeholders; `CreateLearningEventDto` is a plain unvalidated shape and is not wired to a write endpoint in the current controller. Evidence: Adaptive Learning module/controller/DTO/services/spec.

## Goal Intelligence — file-level complete
The module contains a guardedness-free empty controller and three service placeholders: `GoalAnalysisService`, `GoalPlanningService`, `GoalProgressService`; `CreateGoalDto` is also an unvalidated data shape. Evidence: module/controller/DTO/services.

## Batch status

### BATCH-0004A — Assistant orchestration
COMPLETE for the exact files read.

### BATCH-0004B — Assistant complete
COMPLETE for all enumerated TypeScript source/test files under Assistant; non-source temp note is N/A.

### BATCH-0004C — Brain foundation
IN_PROGRESS. Assistant, Brain Integration, Conversation Engine, Decision Engine, Adaptive Learning and Goal Intelligence are now file-level complete based on their enumerated trees; Memory Intelligence is file-level complete; Personal Brain remains partially read because its large service graph still has unread files/tests.

### Next
Finish remaining Personal Brain files/tests, then close Brain support matrices. Proceed to Food/Shopping/Life-Health/Fitness/Platform/Tests/Mobile scopes and only then perform final repository-wide validation and completion checks.
