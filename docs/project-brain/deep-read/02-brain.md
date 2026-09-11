# Brain Deep Read

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: complete Assistant TypeScript source/test scope; substantial Personal Brain production source; complete Brain Integration, Conversation Engine, Decision Engine, Adaptive Learning and Goal Intelligence source scopes; complete Memory Intelligence source/test scope as enumerated; additional Personal Brain notification/proactive/scheduling/action support services and selected specs.
Scope not yet read: remaining Personal Brain source/test files; repository-wide cross-consumers; full automated test execution; later non-Brain scopes.
Evidence roots: `apps/backend/src/modules/assistant/`; `apps/backend/src/modules/personal-brain/`; `apps/backend/src/modules/brain-integration/`; `apps/backend/src/modules/conversation-engine/`; `apps/backend/src/modules/decision-engine/`; `apps/backend/src/modules/adaptive-learning/`; `apps/backend/src/modules/goal-intelligence/`; `apps/backend/src/modules/memory-intelligence/`; `apps/backend/prisma/`.
Confidence level: HIGH for completed file-level reads; MEDIUM for end-to-end behavior because tests are read but not executed; LOW for repository-wide integration.
Open questions: finish Personal Brain residual files/tests; prove provider/adapter registration coverage; reconcile runtime persistence; execute validation; route/mobile/database consumer map.

## Assistant orchestration
Assistant uses deterministic local interpretation, contextual references, planning, Brain fallback, execution and persisted conversation turns. `/assistant` status is public while history/process/confirm are JWT guarded. Raw SQL persists `ConversationTurn`, which is migration-created but absent from final Prisma schema.

## Decision, execution and memory architecture
Personal Brain combines deterministic brain state/reasoning, unified decision ranking, hard constraints/conflict resolution, confirmation/guardrails/idempotency/rate limits, bounded retry/timeout policy, plan persistence and asynchronous audit/outcome learning. `DecisionOutcome` is another active raw-SQL dependency absent from final Prisma schema. Persistent plan state uses Prisma `PlanExecutionState`; execution state/history/idempotency/rate-limit/personalization/confirmation are largely process-local.

`Memory Intelligence` is file-level complete. Rich Memory governance metadata is not fully represented in durable `UserFact` persistence. Retrieval/ranking/governance/surface/consolidation exist, but several classification/scoring/consolidation primitives are minimal. Personal Brain's `MemoryManagerService` is a placeholder despite the separate durable Memory Intelligence path.

`BrainIntegration` is file-level complete. `BrainContextService` is a thin timestamp/source placeholder; `BrainGoalService` reads `UserProfile.primaryGoal`; `BrainMemoryService` delegates to Memory Intelligence and needs runtime call-path verification against required `userId` semantics. `ConversationEngine` is style-only. `DecisionEngine` has a guarded read endpoint plus rule/scoring services but its top-level `DecisionEngineService` is minimal. `AdaptiveLearning` provides deterministic seven-day insight analysis while feedback/memory subservices are placeholders. `GoalIntelligence` currently contains service placeholders and unvalidated DTO/controller surfaces.

## Personal Brain detailed findings

`DecisionReadinessService` produces a simple readiness score from context/memory/goals presence. `IntentionAnalysisService` always returns `unknown`, confirming another placeholder. `DecisionActionAdapterService` uses dynamic registration and can advertise supported actions through an optional `actions` property, but an empty registry means every candidate is unsupported.

`ActionConfirmationIntelligenceService` distinguishes destructive, financial, sensitive and external-impact actions and assigns five-minute confirmation expiry, but pending confirmations are in-memory only. Confirmation tokens are deterministic per user/candidate/action.

`DailyCapacityService` is a pure calculator. `PreferenceConflictResolverService` prioritizes hard constraints and otherwise ranks preference candidates using priority/confidence/score.

`SmartPlanningService`/`FullDaySchedulerService`/`ScheduleHealthService`/`ScheduleRecoveryService` form the proactive schedule stack. `NextBestActionService` exposes a selected life-task candidate plus alternatives/signals. `ProactiveCoachService` generates prioritized start/recovery/capacity/review actions with explanations. `ProactiveDecisionQualityService` suppresses low-value interruptions using relevance/urgency/benefit/interruption cost.

`ProactiveEventEngineService` turns the primary coaching result into dedupable scheduled events and currently emits only the primary action event, recovery event or capacity-warning event. Event dedupe keys use the current ISO date, so timezone alignment remains an open review item.

Notification decisioning has multiple layers: preference/quiet-hours policy, adaptive resistance/engagement adaptation, deduplication, channel ranking, queueing, dispatch and feedback. `NotificationChannelIntelligenceService` ranks `push`, `in_app`, `email`, `web_push`, but `NotificationDeliveryProviderRegistry` currently implements only `in_app`; the other ranked channels therefore have no provider and dispatcher returns `No provider configured`. `NotificationDeliveryQueueService` is process-local with max three attempts and can return to queued before eventual failure. `NotificationDeduplicationService`, `NotificationFeedbackService`, `NotificationExperimentService`, and `NotificationDeviceRegistryService` are also process-local despite the database containing durable Notification/dedupe infrastructure. This is a significant runtime-vs-persistence gap to reconcile.

`NotificationOrchestratorService` applies preferences, minimum priority and quiet-hours rules, then proactive policy. Critical events bypass lead-window suppression. `AdaptiveNotificationDecisionService` can reduce frequency/shift timing, while critical events are protected from suppression.

`NotificationFeedbackService` computes resistance/engagement signals from recent in-memory client actions, which feed notification adaptation and channel intelligence. There is no durable store in the read scope for these feedback observations.

`NotificationDeviceRegistryService` stores user/device/push token/locale/timezone data only in memory. Because `NotificationDeliveryProviderRegistry` only supports in-app, the push-token lifecycle currently does not connect to a concrete delivery provider in this scope.

`NotificationExperimentService` performs simple multi-arm exploration/exploitation using in-memory success counts and random exploration. It has no durable experiment/observation store in the inspected service.

`CoachCueEngineService` generates Persian/English exercise-start/countdown/transition/safety/explanation cues. Cue IDs combine time and randomness, so they are not stable identifiers across calls.

`MultiScenarioSimulatorService` compares best/conservative/balanced candidate variations and returns up to five scenario plans. The conservative plan modifies candidate score/downside; balanced modifies confidence/alignment. This is simulation, not model-based probabilistic forecasting.

`LongTermDecisionImpactService` evaluates candidate impact against ranked goal hierarchy. Alignment inference is lexical over action/domain vs goal title/category, defaulting to 0.75 or 0.35, so it is deterministic keyword matching rather than semantic understanding.

`DynamicReplanningService`, `AdaptivePlanExecutionService` and `DecisionReplanPolicyService` form the replanning path; triggers include changed constraints, expired candidates, feedback, higher-priority action and context change. `AdaptivePlanExecutionService` executes persisted plan state and then evaluates whether replanning is required.

`BrainDailyStatusService` uses UTC-derived date keys. `BrainStateAnalyzerService` passes an empty query to `BrainStateService`. These are concrete indicators that user-local time and request context are not uniformly threaded through Brain APIs.

`CoachMessageService`, `UserUnderstandingService` and similar lightweight classes provide thin wrappers/placeholders; `PersonalBrainAdaptersRegistration` is a static documentation constant and runtime wiring remains in the module.

## Batch status

### BATCH-0004A — Assistant orchestration
COMPLETE for the exact files read.

### BATCH-0004B — Assistant complete
COMPLETE for all enumerated TypeScript source/test files under Assistant; non-source temp note is N/A.

### BATCH-0004C — Personal Brain / auxiliary Brain
IN_PROGRESS. Assistant, Brain Integration, Conversation Engine, Decision Engine, Adaptive Learning, Goal Intelligence and Memory Intelligence are file-level complete based on enumerated module trees. Personal Brain remains open until every service/source/test file in its directory has been fetched/read and recorded.

### Next
Finish every remaining Personal Brain file/test from the deterministic services listing, then finalize the Brain deep-read and support matrices. Proceed to Food, Shopping, Life/Health, Fitness, Platform/Tests and Mobile scopes. No production code changes are being made during the audit.
