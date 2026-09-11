# Brain Deep Read

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: all TypeScript source and test files under `apps/backend/src/modules/assistant/` as enumerated by the assistant module tree, including module/controller/specs, adapter, DTOs, provider, and services/specs. Remaining required Brain scope: `personal-brain`, `brain-integration`, `conversation-engine`, `memory-intelligence`, `decision-engine`, `adaptive-learning`, `goal-intelligence`; full test execution and cross-module consumer verification remain open.
Scope not yet read: the seven remaining required Brain areas above; repository-wide cross-consumers of assistant actions; full automated test execution.
Evidence roots: `apps/backend/src/modules/assistant/`; `apps/backend/src/modules/personal-brain/` references observed from assistant imports; Prisma conversation migration/schema.
Confidence level: HIGH for the assistant-module file-level read; MEDIUM for assistant runtime behavior because tests have been read but not executed here; LOW for the complete Brain scope because the remaining seven areas are not yet fully read.
Open questions: complete personal-brain orchestration; decision candidate generation and persistence; memory read/write semantics; whether ConversationTurn/DecisionOutcome runtime tables are the intended canonical contracts; authorization behavior across action execution; end-to-end tests.

## Assistant orchestration observed

`AssistantModule` imports `PrismaModule` and `PersonalBrainModule`, and wires assistant orchestration services including `AssistantService`, contextual command handling, planning, natural action execution, conversation context/history, local language understanding, a local intelligence provider, and a local basket adapter. Evidence: `apps/backend/src/modules/assistant/assistant.module.ts`.

`AssistantController` exposes public status, authenticated history, authenticated natural-language processing, and authenticated confirmation. `GET /assistant` is not guarded, while `/assistant/history`, `POST /assistant`, and `POST /assistant/confirm` use `JwtAuthGuard`. Evidence: `apps/backend/src/modules/assistant/controllers/assistant.controller.ts`; controller spec confirms authenticated-owner propagation for history.

`AssistantService.process()` appends the user turn, resolves contextual references, runs local language understanding, builds a local plan, uses local deterministic intent mapping when confidence is sufficient, otherwise delegates to `BrainOrchestratorService`, then optionally executes the selected action via `NaturalActionExecutionService`, and finally appends the assistant turn with action/execution/resource references. Evidence: `apps/backend/src/modules/assistant/services/assistant.service.ts`; assistant service tests cover fallback/orchestration and contextual mappings.

The service contains explicit contextual follow-up routing for update/cancel of calendar events, reminders, workouts, habits and supplements based on prior action/resource and simple entity/time/quantity signals. Evidence: `assistant.service.ts`; assistant service spec covers workout update, habit cancel, supplement update, and unrelated-command preservation.

## Deterministic local understanding

`LocalLanguageUnderstandingService` is a rule/regex based classifier. It normalizes Persian/Arabic character variants and Persian digits, extracts quantity/time/duration/calories/meal type/food/negations, detects references to prior turns, and maps a fixed set of local intents (`ADD_TO_BASKET`, `REMOVE_FROM_BASKET`, `RECOMMEND_MEAL`, `GET_NUTRITION_SUMMARY`, `CREATE_REMINDER`, `UPDATE_REQUEST`, `CANCEL_REQUEST`, `UNKNOWN`). Evidence: `apps/backend/src/modules/assistant/services/local-language-understanding.service.ts`.

The classifier's food vocabulary is a small hard-coded list, so it is a deterministic bootstrap rather than a general natural-language parser. Evidence: `local-language-understanding.service.ts`; its spec explicitly checks milk, bread, yogurt, basket requests, reminders, meal recommendation, nutrition summary, Persian digits, and ambiguous input.

`ContextualCommandService` adds a second deterministic layer for follow-up references, operation detection, entity extraction, clause splitting, contradiction detection, and confidence scoring. It resolves previous action/execution/resource references from `ConversationContextService`. Evidence: `apps/backend/src/modules/assistant/services/contextual-command.service.ts`; its spec covers Persian pronouns, quantity, time, duration, and standalone create commands.

## Action execution and safety gates

`NaturalActionExecutionService` converts a selected BrainResponse into a `DecisionCandidate` and delegates execution to `DecisionExecutionCoordinatorService`. It supports sequential plans, stops on pending confirmation/blocked/unsupported outcomes, and has bounded recovery attempts for other failures. Evidence: `apps/backend/src/modules/assistant/services/natural-action-execution.service.ts`; its spec checks completed, blocked, and no-action cases.

Cancellation is not inherently auto-executed by this layer: plan steps marked `cancel` require confirmation, and the coordinator controls the final execution receipt/status. Evidence: `planning.service.ts`; `natural-action-execution.service.ts`.

The candidate ID for natural-language execution is deterministic per `(userId, action, normalized input)` using an FNV-style hash. Evidence: `natural-action-execution.service.ts`.

`LocalBasketActionAdapter` registers for `add_to_basket` and `remove_from_basket`, looks up a `FoodItem` by a hard-coded alias map, creates or increments an active `ShoppingItem`, and marks active matching items completed on removal. It uses Prisma directly and sets assistant-origin metadata on creates. Evidence: `apps/backend/src/modules/assistant/adapters/local-basket-action.adapter.ts`.

## Planning and reasoning

`PlanningService` is deterministic. It blocks conflicting requests, asks for clarification under low confidence, creates step dependencies when a clause references a previous step or an update follows a create, marks cancel steps as confirmation-required, and rejects unsafe dependent cancellation plans. Evidence: `apps/backend/src/modules/assistant/services/planning.service.ts`.

`ReasoningService` is a lighter deterministic planner that maps supplied clauses/intents to ordered `LocalPlanStep` objects, links later steps to earlier steps, marks cancel steps for confirmation, and lowers confidence/asks for clarification when contradictions or incomplete clause-to-intent alignment occur. Evidence: `apps/backend/src/modules/assistant/services/reasoning.service.ts`.

## Conversation persistence

`ConversationContextService` keeps up to 24 turns per user in an in-process cache and falls back to `ConversationHistoryService` on cache misses. Its tests verify user isolation, bounded history, latest-action resolution, clearing, and hydration from persistence. Evidence: `apps/backend/src/modules/assistant/services/conversation-context.service.ts`; corresponding spec.

`ConversationHistoryService` persists turns using parameterized raw SQL directly against `ConversationTurn`, enforces trimmed non-empty text, a 12,000-character max, and valid user/assistant roles, and exposes recent/latest-action/deletion operations. Evidence: `apps/backend/src/modules/assistant/services/conversation-history.service.ts`; corresponding spec verifies normalization, chronological ordering, linked resources, latest action, and scoped deletion.

This directly confirms that the migration-created `ConversationTurn` table is an active runtime dependency even though it is not represented as a Prisma model in the final `schema.prisma`. Evidence: `conversation-history.service.ts`; `apps/backend/prisma/migrations/20260812193000_add_conversation_turns/migration.sql`; `apps/backend/prisma/schema.prisma`.

## Local provider and provider routing

`LocalIntelligenceProvider` implements the AI provider abstraction but delegates to the deterministic local language understanding service and emits canned responses for the fixed local intents. Evidence: `apps/backend/src/modules/assistant/providers/local-intelligence.provider.ts`; `services/ai-provider.types.ts`.

`AiProviderRouterService` maintains an in-memory provider list, currently registering the local provider, skips providers in cooldown, and applies 60-second cooldown to HTTP 429 errors and 5-second cooldown to other provider failures. Evidence: `ai-provider-router.service.ts`.

`KnowledgeService`, `MemoryService`, `RecommendationService`, and `ContextService` in the assistant module are currently placeholder-level implementations: knowledge returns an empty array, memory returns a readiness message/empty array, recommendation returns a readiness message, and context returns a readiness message. Evidence: `knowledge.service.ts`, `memory.service.ts`, `recommendation.service.ts`, `context.service.ts`.

`RuleEngineService` is also a minimal placeholder that always returns `{ success: true, engine: 'Rule Engine' }`. Evidence: `rule-engine.service.ts`.

The `UpdateAssistantProfileDto` exposes optional string/int/number fields for health, fitness, nutrition, smoking, water, sleep, and exercise goals, while `ProcessAssistantRequestDto` only validates a non-empty string message. Evidence: both DTO files.

At this point there is no evidence in the read scope that an external AI provider is registered in the assistant module; the current wired provider is local and deterministic. This is an observed implementation fact, not a claim that external-provider code does not exist elsewhere in the repository.

## Batch status

### BATCH-0004A — Assistant orchestration
Status: COMPLETE for the exact orchestration files read in that sub-batch.

### BATCH-0004B — Complete Assistant module read
Status: COMPLETE for all TypeScript files enumerated under `apps/backend/src/modules/assistant/`, including tests. The only non-source file found in the service tree is `__tmp_fix_note.md`, which is treated as non-source/N/A and is not counted as executable source.

Key new findings: local basket adapter has hard-coded food aliases and direct ShoppingItem writes; contextual follow-up logic is comprehensively unit-tested; several assistant services are still placeholders; runtime conversation persistence bypasses Prisma model typing via raw SQL.

### Next
Read `personal-brain` and continue through the seven remaining required Brain areas, recording cross-module contracts and decision/memory persistence as they are established.
