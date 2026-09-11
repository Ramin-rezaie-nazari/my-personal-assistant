# Review Gaps

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: baseline; complete Core source scope; final Prisma schema; all 39 migration SQL files; complete Assistant TypeScript source/test scope; complete enumerated Brain; Food/Recipe/Nutrition/Meals/Recommendation/Budget; Shopping/Inventory/Shopping Intelligence and substantial Price Intelligence; Life/Health enumerated modules; Fitness/Workout/Calisthenics/Gym/Yoga and related Brain fitness consumers; Platform/Test/CI enumerated manifests/E2E/workflows; substantial Mobile routes/clients/specs/native config; all Mobile components, `lib/motion.tsx`, and Mobile scripts.
Scope not yet read: remaining Personal Brain/support files outside prior enumeration; remaining Mobile route/library/native files; exhaustive platform/common/test inventory; repository-wide route/consumer mapping; complete DB readers/writers/transactions; full automated validation; full security/privacy review; historical docs/branches.
Evidence roots: `apps/backend/src/modules/`; `apps/backend/prisma/`; `apps/mobile/`; `.github/workflows/`; `docs/project-brain/`.
Confidence level: HIGH for listed file-level reads; MEDIUM for cross-module integration conclusions; no runtime test execution claim.
Open questions: exact complete source inventory/line counts; live DB drift; all route/mobile/database consumers; test execution; physical-device behavior; historical reconciliation.

## Open gaps

1. Repository-wide deterministic inventory and exact source/line counts.
2. Prisma schema ↔ runtime model parity and complete reader/writer/transaction reconciliation for migration-only/runtime-raw-SQL tables (`ConversationTurn`, `DecisionOutcome`, `WorkoutPerformance`, Price Intelligence tables, RecipeStep/RecipeMedia, Goal/GoalCheckin and life-execution compatibility tables).
3. Map every Prisma model/table to readers/writers, transactions, seeds/imports and duplicate contracts.
4. Finish any Personal Brain/support source/test files outside already closed enumerated scope.
5. Complete remaining Food/Recipe/media source and all data/image contract reconciliation.
6. Complete remaining Shopping/Inventory/Price/Budget cross-consumer reconciliation.
7. Complete any Life/Health source files outside enumerated trees and reconcile active versus orphan task domains.
8. Complete remaining Fitness-adjacent source not covered by BATCH-0007.
9. Complete Platform/Tests/config/common/database/shared/content/dashboard/scripts source inventory outside already-read scopes.
10. Complete Mobile `app/` and `lib/` inventory and route/API/provider/state/persistence/loading/error/offline/localization/RTL/accessibility/test mapping for every source file.
11. Execute validation commands where possible; current connector session has not executed local test/build/device commands, so no runtime verification is claimed.
12. Complete security/privacy cross-module review, especially raw SQL ownership, refresh-token lifecycle, unguarded endpoints and Mobile credential storage.
13. Reconcile current source with historical docs/branches.
14. Finish support-document consistency across FILE_REVIEW_INDEX, CONTRACT_MATRIX, FEATURE_COMPLETENESS_MATRIX, checkpoints, changelog, deep reads, appendix and open work.
15. Consolidate duplicate issue IDs/corrections so `12_OPEN_WORK.md` has one canonical issue per root cause and correction-only IDs remain NOT_APPLICABLE.

## Newly confirmed integration findings

- `ContentModule` is active in `AppModule`; the earlier orphan claim PB-167 was a false positive and is now marked NOT_APPLICABLE in the appendix/open-work audit trail.
- `LifeTasksModule` is not imported by `AppModule`, while active `LifeExecutionModule` is; these remain parallel task-domain implementations with overlapping contracts.
- `RecommendationIntelligenceModule` and `GoalIntelligenceModule` are not wired into the active AppModule.
- Mobile command-center cards are active consumers; their localization is locally hardcoded rather than routed through the global i18n dictionary.
- `apps/mobile/components/AnimatedPressable.tsx` and `AnimatedSection.tsx` duplicate exports already present in `lib/motion.tsx` and have no observed external consumer in repository search.
- Mobile TTS preparation downloads remote ONNX/token/vocoder assets and checks existence but not cryptographic integrity; this is a specific supply-chain expression of PB-129.

## Resolved file-level gaps

- Prisma migration reading: RESOLVED — all 39 migration SQL files plus lock identified/read.
- Assistant module read: RESOLVED for the enumerated current-main Assistant tree.
- Brain Integration: RESOLVED for enumerated module tree.
- Conversation Engine: RESOLVED for enumerated module tree.
- Decision Engine: RESOLVED for enumerated module tree.
- Adaptive Learning: RESOLVED for enumerated module tree.
- Goal Intelligence: RESOLVED for enumerated service/module file-read scope, but runtime wiring is still an open issue.
- Memory Intelligence: RESOLVED for enumerated module tree and associated tests.
- LifeTasks: RESOLVED for enumerated module file-read scope, but runtime wiring/parallel-domain issues remain open.
- Mobile components: RESOLVED for all seven files under `apps/mobile/components/` in BATCH-0010.
- Mobile scripts: RESOLVED for the two current `apps/mobile/scripts/*.cjs` files.

No remaining gap is marked repository-wide resolved without direct evidence.
