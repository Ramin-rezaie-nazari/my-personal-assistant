# Brain Deep Read

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: complete Assistant TypeScript source/test scope; complete enumerated Personal Brain production/source/test scope; complete Brain Integration, Conversation Engine, Decision Engine, Adaptive Learning, Goal Intelligence and Memory Intelligence file-level scopes; Prisma schema/migration evidence; selected route/module wiring and cross-module consumers. Runtime execution not performed.
Scope not yet read: remaining repository-wide common/operational files; full route/consumer/database matrices; full automated validation; full security/privacy closure; historical docs/branches.
Evidence roots: `apps/backend/src/modules/assistant/`; `personal-brain/`; `brain-integration/`; `conversation-engine/`; `decision-engine/`; `adaptive-learning/`; `goal-intelligence/`; `memory-intelligence/`; `prisma/`; `app.module.ts`.
Confidence level: HIGH for file-level coverage recorded here; MEDIUM for cross-module behavior until final runtime and consumer reconciliation.
Open questions: runtime persistence/drift; final route/mobile/database map; full CI/test execution; complete security/privacy and historical reconciliation.

## Assistant orchestration
Assistant uses deterministic local interpretation, contextual references, planning, Brain fallback, execution and persisted conversation turns. `/assistant` status is public while history/process/confirm are JWT guarded. Raw SQL persists migration-created `ConversationTurn`, absent from final Prisma schema.

## Decision, execution and memory architecture
Personal Brain combines deterministic brain state/reasoning, decision ranking, hard constraints/conflict resolution, confirmation/guardrails/idempotency/rate limits, plan persistence and learning. `DecisionOutcome` is active raw SQL absent from final Prisma schema. Persistent plan state uses Prisma; several execution/notification/learning stores remain process-local.

`Memory Intelligence` is file-level complete. Rich Memory governance metadata is not fully represented in durable `UserFact` persistence. Personal Brain's `MemoryManagerService` remains placeholder-level despite separate durable Memory Intelligence services.

`BrainIntegration` is file-level complete. Its context service is thin; memory integration needs runtime call-path verification. `ConversationEngine` is style-only. `DecisionEngine` has a guarded read endpoint but a minimal top-level facade. `AdaptiveLearning` provides deterministic seven-day insight analysis while some feedback/memory pieces are placeholders.

`GoalIntelligence` has three placeholder services (`GoalAnalysisService`, `GoalPlanningService`, `GoalProgressService`) and an empty `GoalIntelligenceController`. More importantly, repository search found no active import of `GoalIntelligenceModule` outside its own module file, so this module is source-present but not runtime-wired in the audited target. No external consumer or direct service spec was found for the three services. The active goal domain is instead represented through `GoalsModule`/`GoalsService`, making Goal Intelligence a parallel/dead design path that can diverge from the active goals implementation.

## Personal Brain detailed findings

`DecisionReadinessService` produces a simple readiness score from context/memory/goals presence. `IntentionAnalysisService` returns `unknown`. `DecisionActionAdapterService` uses dynamic registration; an empty registry can make candidates unsupported.

`ActionConfirmationIntelligenceService` distinguishes destructive/financial/sensitive/external actions and assigns short expiry, but pending confirmations are in-memory and tokens are deterministic per user/candidate/action.

`DailyCapacityService` is pure calculation. Preference conflict resolution prioritizes hard constraints and otherwise ranks by priority/confidence/score.

`SmartPlanningService`/`FullDaySchedulerService`/`ScheduleHealthService`/`ScheduleRecoveryService` form the proactive schedule stack. `NextBestActionService` exposes selected life-task candidate plus alternatives/signals.

Notification decisioning has multiple layers: preference/quiet-hours, adaptation, dedupe, channel ranking, queueing and dispatch. Channel intelligence ranks push/in-app/email/web-push while the concrete provider registry only implements in-app. Notification queues/dedupe/adaptation/experiments/device registry are predominantly process-local.

`ProactiveEventEngineService` emits limited primary/recovery/capacity events; dedupe keys use ISO dates and inherit timezone concerns. `NotificationFeedbackService` computes feedback from process-local client actions without durable observation storage.

`MultiScenarioSimulatorService` mutates candidate score/downside/confidence heuristically for scenario variants, not model-based probabilistic forecasting. `LongTermDecisionImpactService` infers goal alignment lexically. These remain design-review items.

`BrainDailyStatusService` and `BrainWeeklyStatusService` use UTC-derived date keys. `FullDaySchedulerService` uses legacy `TaskDependency` and mixes local-time JS operations with UTC serialization.

`BrainReasoningContextService` computes quality from a narrow signal set and `BrainStateAnalyzerService` treats collection presence as readiness rather than meaningful/non-empty content. These can overstate usable context.

## File-level batch closure

### BATCH-0004A — Assistant orchestration
COMPLETE for exact enumerated files read.

### BATCH-0004B — Assistant complete
COMPLETE for enumerated Assistant TypeScript source/test files.

### BATCH-0004C/D — Brain deep-read
COMPLETE for the enumerated file-level scopes. This is **file-read completion**, not runtime verification. The issue catalog remains authoritative.

## Next
Continue repository-wide route/consumer and schema reconciliation, then finalize support matrices and runtime/test validation. No production code changes during audit.
