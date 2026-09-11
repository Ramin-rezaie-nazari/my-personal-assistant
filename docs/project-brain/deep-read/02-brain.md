# Brain Deep Read

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: `apps/backend/src/modules/assistant/assistant.module.ts`; assistant controller; `assistant.service.ts`; conversation context/history services; local language understanding; natural action execution; planning; local intelligence provider; AI provider router. The assistant module tree was enumerated, including its adapter/provider/service files and controller/spec files.
Scope not yet read: `personal-brain`, `brain-integration`, `conversation-engine`, `memory-intelligence`, `decision-engine`, `adaptive-learning`, `goal-intelligence`; remaining assistant specs/services not listed in the read scope; assistant adapter source; full test execution.
Evidence roots: `apps/backend/src/modules/assistant/`; selected files listed above; `apps/backend/src/modules/personal-brain/` references observed from imports.
Confidence level: MEDIUM for assistant orchestration behavior; LOW for the complete Brain scope because the eight required modules are not yet fully read.
Open questions: complete personal-brain orchestration; decision candidate generation and persistence; memory read/write semantics; whether ConversationTurn/DecisionOutcome runtime tables are the intended canonical contracts; authorization behavior across action execution; end-to-end tests.

## Assistant orchestration observed

`AssistantModule` imports `PrismaModule` and `PersonalBrainModule`, and wires assistant orchestration services including `AssistantService`, contextual command handling, planning, natural action execution, conversation context/history, local language understanding, a local intelligence provider, and a local basket adapter. Evidence: `apps/backend/src/modules/assistant/assistant.module.ts`.

`AssistantController` exposes public status, authenticated history, authenticated natural-language processing, and authenticated confirmation. `GET /assistant` is not guarded, while `/assistant/history`, `POST /assistant`, and `/assistant/confirm` use `JwtAuthGuard`. Evidence: `apps/backend/src/modules/assistant/controllers/assistant.controller.ts`.

`AssistantService.process()` appends the user turn, resolves contextual references, runs local language understanding, builds a local plan, uses local deterministic intent mapping when confidence is sufficient, otherwise delegates to `BrainOrchestratorService`, then optionally executes the selected action via `NaturalActionExecutionService`, and finally appends the assistant turn with action/execution/resource references. Evidence: `apps/backend/src/modules/assistant/services/assistant.service.ts`.

The service contains explicit contextual follow-up routing for update/cancel of calendar events, reminders, workouts, habits and supplements based on prior action/resource and simple entity/time/quantity signals. Evidence: `assistant.service.ts`.

## Deterministic local understanding

`LocalLanguageUnderstandingService` is a rule/regex based classifier. It normalizes Persian/Arabic character variants and Persian digits, extracts quantity/time/duration/calories/meal type/food/negations, detects references to prior turns, and maps a fixed set of local intents (`ADD_TO_BASKET`, `REMOVE_FROM_BASKET`, `RECOMMEND_MEAL`, `GET_NUTRITION_SUMMARY`, `CREATE_REMINDER`, `UPDATE_REQUEST`, `CANCEL_REQUEST`, `UNKNOWN`). Evidence: `apps/backend/src/modules/assistant/services/local-language-understanding.service.ts`.

The classifier's food vocabulary is a small hard-coded list (e.g. chicken, yogurt, eggs, milk, rice, bread, banana, apple, cheese), so it is a deterministic bootstrap rather than a general natural-language parser. Evidence: same file.

## Action execution and safety gates

`NaturalActionExecutionService` converts a selected BrainResponse into a `DecisionCandidate` and delegates execution to `DecisionExecutionCoordinatorService`. It supports sequential plans, stops on pending confirmation/blocked/unsupported outcomes, and has bounded recovery attempts for other failures. Evidence: `apps/backend/src/modules/assistant/services/natural-action-execution.service.ts`.

Cancellation is not inherently auto-executed by this layer: plan steps marked `cancel` require confirmation, and the coordinator controls the final execution receipt/status. Evidence: `planning.service.ts`; `natural-action-execution.service.ts`.

The candidate ID for natural-language execution is deterministic per `(userId, action, normalized input)` using an FNV-style hash. Evidence: `natural-action-execution.service.ts`.

## Planning

`PlanningService` is deterministic. It blocks conflicting requests, asks for clarification under low confidence, creates step dependencies when a clause references a previous step or an update follows a create, marks cancel steps as confirmation-required, and rejects unsafe dependent cancellation plans. Evidence: `apps/backend/src/modules/assistant/services/planning.service.ts`.

## Conversation persistence

`ConversationContextService` keeps up to 24 turns per user in an in-process cache and falls back to `ConversationHistoryService` on cache misses. Evidence: `conversation-context.service.ts`.

`ConversationHistoryService` persists turns using parameterized raw SQL directly against `ConversationTurn`, enforces trimmed non-empty text, a 12,000-character max, and valid user/assistant roles, and exposes recent/latest-action/deletion operations. Evidence: `conversation-history.service.ts`.

This directly confirms that the migration-created `ConversationTurn` table is an active runtime dependency even though it is not represented as a Prisma model in the final `schema.prisma`. Evidence: `conversation-history.service.ts`; `apps/backend/prisma/migrations/20260812193000_add_conversation_turns/migration.sql`; `apps/backend/prisma/schema.prisma`.

## Local provider and provider routing

`LocalIntelligenceProvider` implements the AI provider abstraction but delegates to the deterministic local language understanding service and emits canned responses for the fixed local intents. Evidence: `local-intelligence.provider.ts`; `ai-provider.types.ts`.

`AiProviderRouterService` maintains an in-memory provider list, currently registering the local provider, skips providers in cooldown, and applies 60-second cooldown to HTTP 429 errors and 5-second cooldown to other provider failures. Evidence: `ai-provider-router.service.ts`.

At this point there is no evidence in the read scope that an external AI provider is registered in the assistant module; the current wired provider is local and deterministic. This is an observed implementation fact, not a claim that external-provider code does not exist elsewhere in the repository.

## Batch status

### BATCH-0004A — Assistant orchestration
Status: COMPLETE for the exact files listed under `Scope actually read`.

Observed source tree also includes assistant specs, a `LocalBasketActionAdapter`, and additional provider/service files. Those have been enumerated but are not yet marked complete until each file is directly read.

### Next
Read remaining assistant source/spec files, then proceed to `personal-brain` and its decision/memory orchestration modules before marking the deep-read complete.
