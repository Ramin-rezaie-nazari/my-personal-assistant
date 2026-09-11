# File Review Index

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: current-main package manifests/AppModule; complete identified Core source files; full current Prisma schema; all 39 migration SQL files; complete Assistant TypeScript source/test files; substantial Personal Brain production source; complete Brain Integration source; complete Conversation Engine source; complete Decision Engine source; substantial Adaptive Learning source; Goal Intelligence service source; substantial Memory Intelligence source/tests.
Scope not yet read: remaining Personal Brain source/test files; remaining Adaptive/Goal Intelligence controller/DTO/spec files; any unlisted Memory Intelligence files not yet fetched; all other non-Brain deep-read scopes; repository-wide consumer mapping; full runtime validation.
Evidence roots: `main` at `e38d4d16b0cf6e6ea714fa0bcc048e80187bcb3b`; audit branch `audit/project-brain-2026-09-11`; `apps/backend/src/modules/`; `apps/backend/prisma/`.
Confidence level: HIGH for explicitly completed file-level batches, MEDIUM for cross-module integration conclusions, LOW for total repository completeness.
Open questions: exact repository-wide source count/line counts; live DB drift; remaining files and consumer mappings; test execution.

## Core source index

| Scope | Identified files | Status |
|---|---:|---|
| Auth | 11 | READ_COMPLETELY |
| Users | 5 | READ_COMPLETELY |
| Profile | 4 | READ_COMPLETELY |
| Preferences | 4 | READ_COMPLETELY |
| Onboarding | 4 | READ_COMPLETELY |
| Settings | 4 | READ_COMPLETELY |
| Context Engine | 7 | READ_COMPLETELY |
| Device Intelligence | 6 | READ_COMPLETELY |
| User Intelligence | 6 | READ_COMPLETELY |
| **Core total** | **51 identified support/source files** | **READ_COMPLETELY for identified scope** |

## Brain/AI source index

| Scope | Current status | Notes |
|---|---|---|
| Assistant | READ_COMPLETELY | All enumerated TypeScript source/test files; non-source `__tmp_fix_note.md` treated N/A |
| Personal Brain | IN_PROGRESS | Large module; orchestration/decision/execution/adaptive/scheduling/fitness core substantially read; remaining files/tests still open |
| Brain Integration | READ_COMPLETELY | Module, controller, services, types read |
| Conversation Engine | READ_COMPLETELY | Module + only service in its tree read |
| Decision Engine | READ_COMPLETELY | Module/controller/services/test in enumerated tree read |
| Adaptive Learning | IN_PROGRESS | Main service, module/controller/DTO/auxiliary services/spec read; verify any remaining support files |
| Goal Intelligence | IN_PROGRESS | Module + three service implementations read; controller/DTO/tests not yet completed |
| Memory Intelligence | IN_PROGRESS | Module/model/repository/controller/services/selected specs read; remaining files/tests open |

## Key evidence files read

### Assistant
- `apps/backend/src/modules/assistant/assistant.module.ts`
- `apps/backend/src/modules/assistant/controllers/assistant.controller.ts`
- `apps/backend/src/modules/assistant/services/assistant.service.ts`
- `apps/backend/src/modules/assistant/services/contextual-command.service.ts`
- `apps/backend/src/modules/assistant/services/conversation-context.service.ts`
- `apps/backend/src/modules/assistant/services/conversation-history.service.ts`
- `apps/backend/src/modules/assistant/services/local-language-understanding.service.ts`
- `apps/backend/src/modules/assistant/services/natural-action-execution.service.ts`
- `apps/backend/src/modules/assistant/services/planning.service.ts`
- `apps/backend/src/modules/assistant/services/reasoning.service.ts`
- `apps/backend/src/modules/assistant/adapters/local-basket-action.adapter.ts`

### Personal Brain / Decision
- `apps/backend/src/modules/personal-brain/personal-brain.module.ts`
- `apps/backend/src/modules/personal-brain/services/brain-orchestrator.service.ts`
- `apps/backend/src/modules/personal-brain/services/brain-state.service.ts`
- `apps/backend/src/modules/personal-brain/services/brain-reasoning-context.service.ts`
- `apps/backend/src/modules/personal-brain/services/brain-decision.service.ts`
- `apps/backend/src/modules/personal-brain/services/brain-decision-pipeline.service.ts`
- `apps/backend/src/modules/personal-brain/services/unified-decision-engine.service.ts`
- `apps/backend/src/modules/personal-brain/services/decision-execution-coordinator.service.ts`
- `apps/backend/src/modules/personal-brain/services/decision-execution-policy.service.ts`
- `apps/backend/src/modules/personal-brain/services/decision-execution-gate.service.ts`
- `apps/backend/src/modules/personal-brain/services/decision-guardrail.service.ts`
- `apps/backend/src/modules/personal-brain/services/decision-idempotency.service.ts`
- `apps/backend/src/modules/personal-brain/services/decision-rate-limiter.service.ts`
- `apps/backend/src/modules/personal-brain/services/persistent-plan-state.service.ts`
- `apps/backend/src/modules/personal-brain/services/plan-execution.service.ts`
- `apps/backend/src/modules/personal-brain/services/decision-execution-planner.service.ts`
- `apps/backend/src/modules/personal-brain/services/decision-conflict-resolution.service.ts`
- `apps/backend/src/modules/personal-brain/services/decision-safety-guard.service.ts`
- `apps/backend/src/modules/personal-brain/services/decision-audit.service.ts`
- `apps/backend/src/modules/personal-brain/services/decision-feedback-loop.service.ts`
- `apps/backend/src/modules/personal-brain/services/decision-outcome-learning.service.ts`
- `apps/backend/src/modules/personal-brain/services/decision-explanation.service.ts`
- `apps/backend/src/modules/personal-brain/services/decision-explanation-memory.service.ts`
- `apps/backend/src/modules/personal-brain/services/decision-learning-policy.service.ts`
- `apps/backend/src/modules/personal-brain/services/personalization-engine.service.ts`
- `apps/backend/src/modules/personal-brain/services/smart-planning.service.ts`
- `apps/backend/src/modules/personal-brain/services/full-day-scheduler.service.ts`
- `apps/backend/src/modules/personal-brain/services/dynamic-replanning.service.ts`
- `apps/backend/src/modules/personal-brain/services/adaptive-replanning.service.ts`
- `apps/backend/src/modules/personal-brain/services/fitness-decision-policy.service.ts`
- `apps/backend/src/modules/personal-brain/services/fitness-session-orchestrator.service.ts`
- `apps/backend/src/modules/personal-brain/services/fitness-progression.service.ts`
- `apps/backend/src/modules/personal-brain/services/fitness-skill-unlock.service.ts`
- `apps/backend/src/modules/personal-brain/services/reminder-action-adapter.ts`
- `apps/backend/src/modules/personal-brain/services/calendar-action-adapter.ts`
- `apps/backend/src/modules/personal-brain/services/workout-action-adapter.ts`
- `apps/backend/src/modules/personal-brain/services/habit-action-adapter.ts`
- `apps/backend/src/modules/personal-brain/services/supplement-action-adapter.ts`
- `apps/backend/src/modules/personal-brain/services/life-task-action-adapter.ts`

### Brain Integration / Conversation / Decision / Adaptive / Goal
- `apps/backend/src/modules/brain-integration/brain-integration.module.ts`
- `apps/backend/src/modules/brain-integration/controllers/brain-integration.controller.ts`
- `apps/backend/src/modules/brain-integration/services/brain-context.service.ts`
- `apps/backend/src/modules/brain-integration/services/brain-memory.service.ts`
- `apps/backend/src/modules/brain-integration/services/brain-goal.service.ts`
- `apps/backend/src/modules/conversation-engine/conversation-engine.module.ts`
- `apps/backend/src/modules/conversation-engine/services/conversation-style.service.ts`
- `apps/backend/src/modules/decision-engine/decision-engine.module.ts`
- `apps/backend/src/modules/decision-engine/controllers/decision-engine.controller.ts`
- `apps/backend/src/modules/decision-engine/services/action-decision.service.ts`
- `apps/backend/src/modules/decision-engine/services/decision-engine.service.ts`
- `apps/backend/src/modules/decision-engine/services/decision-scoring.service.ts`
- `apps/backend/src/modules/decision-engine/services/rule-evaluation.service.ts`
- `apps/backend/src/modules/adaptive-learning/adaptive-learning.module.ts`
- `apps/backend/src/modules/adaptive-learning/controllers/adaptive-learning.controller.ts`
- `apps/backend/src/modules/adaptive-learning/dto/create-learning-event.dto.ts`
- `apps/backend/src/modules/adaptive-learning/services/adaptive-learning.service.ts`
- `apps/backend/src/modules/adaptive-learning/services/feedback-analysis.service.ts`
- `apps/backend/src/modules/adaptive-learning/services/learning-memory.service.ts`
- `apps/backend/src/modules/goal-intelligence/goal-intelligence.module.ts`
- `apps/backend/src/modules/goal-intelligence/services/goal-analysis.service.ts`
- `apps/backend/src/modules/goal-intelligence/services/goal-planning.service.ts`
- `apps/backend/src/modules/goal-intelligence/services/goal-progress.service.ts`

### Memory Intelligence
- `apps/backend/src/modules/memory-intelligence/memory-intelligence.module.ts`
- `apps/backend/src/modules/memory-intelligence/controllers/memory-intelligence.controller.ts`
- `apps/backend/src/modules/memory-intelligence/controllers/memory-intelligence.controller.spec.ts`
- `apps/backend/src/modules/memory-intelligence/models/memory.model.ts`
- `apps/backend/src/modules/memory-intelligence/models/memory-governance.model.ts`
- `apps/backend/src/modules/memory-intelligence/repositories/memory.repository.ts`
- `apps/backend/src/modules/memory-intelligence/repositories/in-memory-memory.repository.ts`
- `apps/backend/src/modules/memory-intelligence/repositories/prisma-memory.repository.ts`
- `apps/backend/src/modules/memory-intelligence/repositories/prisma-memory.repository.spec.ts`
- `apps/backend/src/modules/memory-intelligence/services/memory-classification.service.ts`
- `apps/backend/src/modules/memory-intelligence/services/memory-consolidation.service.ts`
- `apps/backend/src/modules/memory-intelligence/services/memory-consolidation-intelligence.service.ts`
- `apps/backend/src/modules/memory-intelligence/services/memory-forgetting.service.ts`
- `apps/backend/src/modules/memory-intelligence/services/memory-governance.service.ts`
- `apps/backend/src/modules/memory-intelligence/services/memory-intelligence.service.ts`
- `apps/backend/src/modules/memory-intelligence/services/memory-lifecycle.service.ts`
- `apps/backend/src/modules/memory-intelligence/services/memory-ranking.service.ts`
- `apps/backend/src/modules/memory-intelligence/services/memory-relevance.service.ts`
- `apps/backend/src/modules/memory-intelligence/services/memory-retrieval.service.ts`
- `apps/backend/src/modules/memory-intelligence/services/memory-scoring.service.ts`
- `apps/backend/src/modules/memory-intelligence/services/memory-surface.service.ts`
- selected service specs including consolidation intelligence, forgetting, governance and ranking

## Database index

| Path / scope | Status | Notes |
|---|---|---|
| `apps/backend/prisma/schema.prisma` | READ_COMPLETELY | 32 final Prisma models observed |
| `apps/backend/prisma/migrations/` | READ_COMPLETELY | All 39 migration SQL files read |
| `migration_lock.toml` | READ_COMPLETELY / identified | Provider lock recorded |

Known runtime migration anomalies remain open: `ConversationTurn`, `DecisionOutcome`, Price Intelligence tables, `RecipeStep`, `RecipeMedia`, and life-execution compatibility tables exist in migration history but are not all represented in final Prisma models.

Exact repository-wide line counts are intentionally not fabricated because no local clone is available in this session.
