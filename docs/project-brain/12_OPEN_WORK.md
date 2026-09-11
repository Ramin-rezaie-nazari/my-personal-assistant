# Open Work / Issue Catalog

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: baseline; complete Core source scope; complete Assistant TypeScript source/test scope; final Prisma schema; all 39 migration SQL files; substantial Personal Brain production/test scope; Brain Integration, Conversation Engine, Decision Engine, Adaptive Learning, Goal Intelligence; Memory Intelligence source/test scope.
Scope not yet read: remaining non-Brain deep-read scopes, remaining repository-wide tests/scripts/CI/mobile, complete route/consumer matrix, full runtime validation, historical docs/branches.
Evidence roots: `apps/backend/src/modules/`; `apps/backend/prisma/schema.prisma`; `apps/backend/prisma/migrations/`; `docs/project-brain/`.
Confidence level: HIGH for issues below whose exact source locations are listed; MEDIUM for cross-module impact until remaining scopes are reconciled.
Open questions: live DB drift; complete reader/writer/transaction graph; runtime test outcomes; downstream mobile consumers.

## Issue catalog — evidence-backed

### PB-001 — Memory governance metadata is not persisted
Status: OPEN
Location: `apps/backend/src/modules/memory-intelligence/models/memory.model.ts`, `models/memory-governance.model.ts`, `repositories/prisma-memory.repository.ts`, `apps/backend/prisma/schema.prisma` (`UserFact`).
Problem: the in-memory/domain Memory model carries richer governance fields (layer, visibility, confidence, retention, relationship/topic, confirmation and expiry concepts), while the Prisma `UserFact` persistence shape stores only a subset.
Impact: persisted memories cannot fully round-trip their governance semantics; retrieval/surfacing after restart can differ from in-process behavior.
Action later: define an authoritative persistence contract and migrate all readers/writers to it.

### PB-002 — Brain memory integration does not satisfy the required user-id contract
Status: OPEN
Location: `apps/backend/src/modules/brain-integration/services/brain-memory.service.ts`, `apps/backend/src/modules/memory-intelligence/services/memory-intelligence.service.ts`, `apps/backend/src/modules/memory-intelligence/repositories/prisma-memory.repository.ts`.
Problem: Brain integration delegates memory retrieval without supplying the user identity required by the persistence layer.
Impact: runtime failure risk or empty/incorrect memory context depending on repository guard behavior.
Action later: pass authenticated user scope end-to-end and add contract tests.

### PB-003 — Personal Brain MemoryManager is a placeholder while Memory Intelligence is real
Status: OPEN
Location: `apps/backend/src/modules/personal-brain/services/memory-manager.service.ts`.
Problem: placeholder orchestration exists beside functional Memory Intelligence persistence/retrieval.
Impact: architectural split; callers can depend on a façade that does not implement the intended Brain memory behavior.
Action later: either replace with the real memory orchestrator or remove it and standardize on one contract.

### PB-004 — DecisionOutcome exists in migration/runtime SQL but not final Prisma schema
Status: OPEN
Location: `apps/backend/src/modules/personal-brain/services/decision-outcome-learning.service.ts`; migration history including `apps/backend/prisma/migrations/*decision*outcome*`; final `apps/backend/prisma/schema.prisma`.
Problem: production service uses parameterized raw SQL against `DecisionOutcome`, but the final Prisma schema does not expose a corresponding model.
Impact: schema/client drift; migrations, generated Prisma client and runtime code can disagree.
Action later: choose one authoritative contract and reconcile schema, migrations, service access and tests.

### PB-005 — ConversationTurn exists in migration/runtime SQL but not final Prisma schema
Status: OPEN
Location: `apps/backend/src/modules/assistant/services/conversation-history.service.ts`; migration `apps/backend/prisma/migrations/20260812193000_add_conversation_turns/migration.sql`; final `apps/backend/prisma/schema.prisma`.
Problem: Assistant conversation persistence directly reads/writes `ConversationTurn` with raw SQL while the final Prisma schema has no model.
Impact: persistent conversation functionality depends on a hidden DB contract outside the Prisma model graph.
Action later: reconcile model/migration/runtime ownership and add end-to-end persistence validation.

### PB-006 — WorkoutPerformance exists in raw SQL runtime but is not represented as a Prisma model
Status: OPEN
Location: `apps/backend/src/modules/personal-brain/services/workout-performance-memory.service.ts`; migration `apps/backend/prisma/migrations/*workout*performance*/migration.sql`; final `apps/backend/prisma/schema.prisma`.
Problem: service inserts/selects `WorkoutPerformance` via raw SQL while final Prisma schema omits the model.
Impact: fitness performance memory has the same hidden runtime-schema split as DecisionOutcome/ConversationTurn.
Action later: reconcile table, schema/client, indexes and transaction boundaries.

### PB-007 — Additional migration-only runtime tables need reconciliation
Status: OPEN
Locations: `apps/backend/prisma/migrations/` and final `apps/backend/prisma/schema.prisma`.
Known examples: Price Intelligence tables (`PriceTrackedProduct`, `PriceSource`, `PriceSnapshot`, `PriceCollectionRun`), `RecipeStep`, `RecipeMedia`, and legacy Life Execution compatibility tables (`TaskDependency`, `TaskEvent`).
Impact: unclear whether these are intentionally raw-SQL-only, obsolete compatibility objects, or missing Prisma contracts.
Action later: map every table to active readers/writers and deployment expectations.

### PB-008 — Notification channel intelligence can select unsupported delivery channels
Status: OPEN
Location: `apps/backend/src/modules/personal-brain/services/notification-channel-intelligence.service.ts`; `notification-delivery-provider.service.ts`.
Problem: channel intelligence ranks `push`, `in_app`, `email`, and `web_push`, while the concrete provider registry exposes only `in_app`.
Impact: the decision layer can recommend channels that the delivery layer cannot actually fulfill.
Action later: make channel capabilities authoritative and shared by intelligence + dispatcher/provider registry.

### PB-009 — Notification deduplication is process-local, not user-scoped, and markSent has no production caller
Status: OPEN
Locations: `apps/backend/src/modules/personal-brain/services/notification-deduplication.service.ts`; `apps/backend/src/modules/personal-brain/controllers/personal-brain.controller.ts` (`POST coach/notification-decision`).
Problem: dedupe state is a process-local Map keyed only by `event.dedupeKey`; production controller calls `shouldSend()` but does not call `markSent()`. `markSent()` only appears in the service test in the currently searched code.
Impact: duplicate prevention does not survive process restart, can collide across users when keys are not globally unique, and the controller's decision path does not actually mark an approved event as sent.
Action later: define persisted/user-scoped dedupe semantics and call it at the actual delivery boundary.

### PB-010 — Device disable endpoint lacks owner scoping
Status: OPEN — SECURITY PRIORITY: HIGH
Locations: `apps/backend/src/modules/personal-brain/controllers/personal-brain.controller.ts` (`POST coach/device/disable`); `apps/backend/src/modules/personal-brain/services/notification-device-registry.service.ts` (`disable(id)`).
Problem: the controller authenticates the caller but passes only `deviceId`; the registry disables by global device ID without checking `device.userId` against the authenticated user.
Impact: an authenticated user who knows another device ID may be able to disable another user's device.
Action later: require `(userId, deviceId)` ownership checks and add negative authorization tests.

### PB-011 — Multiple adaptive/decision/notification state stores are process-local
Status: OPEN
Locations include `notification-feedback.service.ts`, `notification-device-registry.service.ts`, `notification-delivery-queue.service.ts`, `notification-experiment.service.ts`, `notification-deduplication.service.ts`, `decision-idempotency.service.ts`, `decision-rate-limiter.service.ts`, `decision-execution-state.service.ts`, `decision-execution-history.service.ts`, `personalization-engine.service.ts`.
Problem: important state is held in process memory Maps/counters.
Impact: restart/scale-out loses state and different instances can make inconsistent decisions; durable audit/history semantics become partial.
Action later: classify each state as intentionally ephemeral vs durable and persist the latter.

### PB-012 — Controller endpoints use unvalidated inline body contracts
Status: OPEN
Locations: `apps/backend/src/modules/personal-brain/controllers/personal-brain.controller.ts`, `decision-feedback.controller.ts`, `decision-execution.controller.ts`.
Problem: many endpoints use inline TypeScript body types or `any` rather than dedicated class-validator DTOs. Example: `coach/notification-decision` accepts `event: any`; scenario and fitness performance endpoints also use inline objects.
Impact: runtime validation is weaker and malformed values can reach decision/execution logic.
Action later: create DTOs, validate enums/ranges/ISO dates/nested objects, and enforce validation consistently.

### PB-013 — Coach cue explanation path accepts empty/unbounded message semantics
Status: OPEN
Location: `apps/backend/src/modules/personal-brain/controllers/personal-brain.controller.ts` (`POST coach/cue`); `services/coach-cue-engine.service.ts`.
Problem: the explanation branch passes `body.message ?? ''` without a required/non-empty contract; other cue fields also rely on inline types and manual defaults.
Impact: low-value/blank coach output and inconsistent input handling.
Action later: validate cue-specific fields with explicit DTO rules.

### PB-014 — UTC date derivation can disagree with user-local date
Status: OPEN
Location: `apps/backend/src/modules/personal-brain/services/workout-action-adapter.ts`.
Problem: when only a time is supplied, date derivation uses `toISOString().slice(0,10)`.
Impact: workout updates near local midnight can target the wrong calendar date for the user.
Action later: use the authenticated user's timezone consistently and test boundary cases.

### PB-015 — Decision planning dependency graph is overly broad
Status: OPEN
Location: `apps/backend/src/modules/personal-brain/services/decision-execution-planner.service.ts`.
Problem: later steps are currently modeled as depending on all earlier steps rather than only semantically required predecessors.
Impact: independent actions can become unnecessarily blocked/serialized, reducing plan parallelism and increasing failure coupling.
Action later: represent explicit predecessor semantics and validate dependency DAGs.

### PB-016 — Schedule policy and scenario logic are heavily deterministic/rule-based despite adaptive naming
Status: OPEN / DESIGN REVIEW
Locations: `schedule-policy.service.ts`, `scenario-planning.service.ts`, `multi-scenario-simulator.service.ts`, `adaptive-notification-decision.service.ts`.
Problem: behavior relies on fixed thresholds, handcrafted markers and deterministic weighting; the adaptive layer is narrow and several state sources are local.
Impact: feature names imply broader personalization/adaptation than current implementation actually provides.
Action later: decide which behavior is intentionally rule-based MVP and document/implement a measured learning loop where required.

### PB-017 — User understanding and intention analysis remain placeholders
Status: OPEN
Locations: `apps/backend/src/modules/personal-brain/services/user-understanding.service.ts`, `intention-analysis.service.ts`.
Problem: services return minimal placeholder responses rather than the richer analysis expected by the Brain architecture.
Impact: naming suggests active intelligence while downstream context can remain shallow.
Action later: wire them to real context/memory/goal signals or remove dead façade layers.

### PB-018 — Goal Intelligence remains placeholder-level
Status: OPEN
Locations: `apps/backend/src/modules/goal-intelligence/services/goal-analysis.service.ts`, `goal-planning.service.ts`, `goal-progress.service.ts`, related controller/DTO.
Problem: core goal analysis/planning/progress services are placeholders and CreateGoalDto is only a plain data shape.
Impact: goal-intelligence layer does not yet provide the intended domain intelligence.
Action later: complete the service contract or clearly scope it out of MVP.

### PB-019 — Brain Integration context is a thin placeholder
Status: OPEN
Location: `apps/backend/src/modules/brain-integration/services/brain-context.service.ts`.
Problem: current context service returns only minimal timestamp/source information.
Impact: Brain consumers may receive a structurally valid but semantically weak context object.
Action later: define authoritative context sources and quality semantics.

### PB-020 — Decision Engine service is placeholder-level while rule/scoring logic lives elsewhere
Status: OPEN
Locations: `apps/backend/src/modules/decision-engine/services/decision-engine.service.ts`, `rule-evaluation.service.ts`, `decision-scoring.service.ts`, `action-decision.service.ts`.
Problem: module façade is minimal while meaningful behavior is split across Personal Brain and rule/scoring services.
Impact: unclear ownership of decision orchestration and duplicated conceptual layers.
Action later: consolidate the canonical decision path.

### PB-021 — Adaptive Learning write path is incomplete
Status: OPEN
Locations: `apps/backend/src/modules/adaptive-learning/`; controller/DTO/services.
Problem: read-side insight generation exists, but FeedbackAnalysisService/LearningMemoryService are placeholders and `CreateLearningEventDto` is not wired to a current write endpoint.
Impact: learning loop can read history but lacks a complete durable event-ingestion contract.
Action later: connect events, persistence, feedback analysis and policy updates.

### PB-022 — Personal Brain channel/provider model has incompatible duplicate type definitions
Status: OPEN
Locations: `notification-channel-intelligence.service.ts` and `notification-delivery-provider.service.ts`.
Problem: separate `NotificationChannel` unions disagree (`email`/`web_push` exist in intelligence but not provider registry).
Impact: compile-time isolation hides a runtime capability mismatch.
Action later: move channel capability types into one shared contract.

### PB-023 — Proactive event generation depends on local process dedupe and does not itself deliver
Status: OPEN
Locations: `proactive-event-engine.service.ts`, `notification-deduplication.service.ts`, `notification-delivery-dispatcher.service.ts`.
Problem: event generation, dedupe decision and delivery queue are separate services, but the observed controller path stops at decision and no production `markSent()` call was found.
Impact: the architecture can generate actionable events without a closed durable delivery lifecycle.
Action later: define event -> decision -> queue -> provider -> receipt -> dedupe lifecycle.

### PB-024 — Confirmation tokens are deterministic rather than high-entropy
Status: DESIGN/SECURITY REVIEW
Location: `apps/backend/src/modules/personal-brain/services/action-confirmation-intelligence.service.ts`.
Problem: confirmation token is an FNV-like deterministic hash of `userId:candidate.id:candidate.action`.
Impact: token unpredictability depends on secrecy of these inputs; this is weaker than a random one-time secret for security-sensitive confirmations.
Action later: use cryptographically random, persisted/expiring one-time tokens where confirmation security matters.

### PB-025 — Scenario simulation can alter candidate scores/confidence heuristically rather than modeling distinct actions
Status: OPEN / DESIGN REVIEW
Locations: `multi-scenario-simulator.service.ts`, `scenario-planning.service.ts`.
Problem: conservative/balanced scenarios mutate candidate score/confidence/goal alignment and reuse candidate IDs rather than constructing explicit scenario-specific action state.
Impact: scenario labels can look more independent than the actual model; comparisons may be sensitive to arbitrary adjustment constants.
Action later: define explicit scenario transformations and evidence for each transformation.

## Completed audit work still requiring runtime validation

- Core source read: COMPLETE.
- Assistant TypeScript source/test read: COMPLETE.
- Prisma schema read: COMPLETE.
- All 39 migration SQL files read: COMPLETE.
- Brain supporting modules file-level read: COMPLETE where checkpointed.
- Personal Brain is still IN_PROGRESS until every source/test file in its exact scope is closed.

## Next deterministic work

1. Finish every remaining Personal Brain source/test file and close BATCH-0004.
2. Freeze the Brain issue catalog and reconcile it against `CONTRACT_MATRIX.md` and `FEATURE_COMPLETENESS_MATRIX.md`.
3. Continue Food/Shopping/Life-Health/Fitness/Platform-Tests/Mobile deep reads.
4. Map every route to controller/service/DTO/output/auth/DB effects and every mobile consumer.
5. Compare every Prisma model/table with readers, writers, raw SQL, migrations, indexes, seeds/imports and transactions.
6. Execute repository CI/test commands where tooling provides an executable path; no runtime execution claim has been made yet.
7. Finish security/privacy review and historical reconciliation.
8. Only after the audit is complete, begin a separate correction phase that uses this catalog as the repair plan.
