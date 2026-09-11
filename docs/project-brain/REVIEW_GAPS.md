# Review Gaps

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: baseline; complete Core source scope; final Prisma schema; all 39 migration SQL files; complete Assistant TypeScript source/test scope; substantial Personal Brain production source; complete Brain Integration, Conversation Engine, Decision Engine, Adaptive Learning, Goal Intelligence and Memory Intelligence scopes; selected Personal Brain notification/proactive tests.
Scope not yet read: remaining Personal Brain source/test files; all non-Brain deep-read scopes; repository-wide route/consumer mapping; full automated validation; full security/privacy review; historical docs/branches.
Evidence roots: `apps/backend/src/modules/`; `apps/backend/prisma/`; `docs/project-brain/`.
Confidence level: HIGH for listed file-level reads; MEDIUM for cross-module integration conclusions; no runtime test execution claim.
Open questions: exact complete source inventory/line counts; live DB drift; remaining Personal Brain files/tests; consumer mappings; test execution.

## Open gaps

1. Repository-wide deterministic inventory and exact source/line counts.
2. Prisma schema ↔ runtime model parity: migration-created runtime tables still need complete reader/writer reconciliation (`ConversationTurn`, `DecisionOutcome`, Price Intelligence tables, RecipeStep/RecipeMedia and life-execution compatibility tables).
3. Map every Prisma model/table to readers/writers, transactions, seeds/imports and duplicate contracts.
4. Finish every Personal Brain production/test source file and mark exact per-file status.
5. Complete Food/Recipe/Nutrition/Media deep read.
6. Complete Shopping/Inventory/Price/Budget deep read.
7. Complete Life/Health/Calendar/Daily/Reminders/Notifications deep read outside already-read Brain adapters.
8. Complete Fitness deep read outside already-read Brain fitness policy/session services.
9. Complete Platform/Tests/config/common/database/shared/content/dashboard/scripts/CI deep read.
10. Complete Mobile deep read and route/API/provider/state/persistence/loading/error/offline/localization/RTL/accessibility/test mapping.
11. Execute validation commands where possible; current session has no local repository execution environment, so no execution claim is made.
12. Complete security/privacy cross-module review, especially raw SQL and resource ownership.
13. Reconcile current source with historical docs/branches.
14. Finish support-document consistency across FILE_REVIEW_INDEX, CONTRACT_MATRIX, FEATURE_COMPLETENESS_MATRIX, checkpoints, changelog and open work.

## Newly confirmed integration findings

- Notification channel ranking can select `push`, but the provider registry currently implements only `in_app`; dispatcher safely reports missing provider and increments delivery attempts.
- Notification queue, device registry, deduplication, feedback and experiment state are process-local despite durable Notification/dedupe schema support.
- Push-token health logic exists and disables devices for common permanent provider errors, but it currently operates against the process-local device registry.
- Proactive event dedupe keys use ISO date boundaries; timezone alignment remains a review item.
- Action confirmation intelligence is process-local with five-minute expiry.
- Several Brain intent/goal/memory services remain placeholders despite richer surrounding infrastructure.

## Resolved file-level gaps

- Prisma migration reading: RESOLVED — all 39 migration SQL files plus lock identified/read.
- Assistant module read: RESOLVED — all enumerated TypeScript source/test files under Assistant read completely.
- Brain Integration: RESOLVED for enumerated module tree.
- Conversation Engine: RESOLVED for enumerated module tree.
- Decision Engine: RESOLVED for enumerated module tree.
- Adaptive Learning: RESOLVED for enumerated module tree.
- Goal Intelligence: RESOLVED for enumerated module tree.
- Memory Intelligence: RESOLVED for enumerated module tree and associated tests that were enumerated.

No remaining gap is marked repository-wide resolved without direct evidence.
