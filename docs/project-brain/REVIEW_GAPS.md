# Review Gaps

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: baseline; complete Core source scope; final Prisma schema; all 39 migration SQL files; complete Assistant TypeScript source/test scope; complete enumerated Brain; Food/Recipe/Nutrition/Meals/Recommendation/Budget; Shopping/Inventory/Shopping Intelligence and substantial Price Intelligence; Life/Health enumerated modules; Fitness/Workout/Calisthenics/Gym/Yoga and related Brain fitness consumers; Platform/Test/CI enumerated manifests/E2E/workflows; substantial Mobile routes/clients/specs/native config; all Mobile components, `lib/motion.tsx`, and Mobile scripts; BATCH-0012 backend controller inventory and selected backend↔mobile route consumers; BATCH-0013 package-wired operational recipe/food/image scripts and legacy variants; backend common/config/bootstrap/database/i18n/images; historical high-value branch/PR reconciliation.
Scope not yet read: remaining repository source outside closed enumerations; exhaustive platform/common/test inventory; repository-wide route/database reader-writer/transaction matrix; full backend↔mobile consumer reconciliation; runtime validation; full security/privacy closure; historical docs/branches beyond inspected high-value branches/PRs; remaining legacy/duplicate operational scripts.
Evidence roots: `apps/backend/src/`; `apps/backend/prisma/`; `apps/backend/test/`; `apps/backend/scripts/`; `apps/mobile/`; `.github/workflows/`; `docs/project-brain/`.
Confidence level: HIGH for listed file-level findings; MEDIUM for cross-module integration conclusions; no runtime test execution claim.
Open questions: exact complete source inventory/line counts; live DB drift; all route/mobile/database consumers; test execution; physical-device behavior; complete historical reconciliation; deployed API prefix/configuration.

## Open gaps

1. Complete exhaustive source/filename inventory and exact line counts.
2. Complete Prisma schema ↔ runtime model parity and reader/writer/transaction reconciliation for all migration-only/runtime-raw-SQL contracts (`ConversationTurn`, `DecisionOutcome`, `WorkoutPerformance`, Price Intelligence tables, `RecipeStep`/`RecipeMedia`, Goal/GoalCheckin, life-execution compatibility tables).
3. Map every database table/model to all readers, writers, transactions, seeds/imports and duplicate operational contracts.
4. Finish any Personal Brain/support source/test files outside already closed enumerated scope.
5. Complete remaining Food/Recipe/media source and all image/data provenance reconciliation.
6. Complete remaining Shopping/Inventory/Price/Budget cross-consumer reconciliation.
7. Complete any Life/Health source files outside enumerated trees and reconcile active versus orphan task domains.
8. Complete remaining Fitness-adjacent source not covered by the closed BATCH-0007 enumeration.
9. Complete Platform/Tests/common/database/shared/content/dashboard/operational source inventory outside already-read scopes.
10. Complete Mobile `app/` and `lib/` inventory and route/API/provider/state/persistence/loading/error/offline/localization/RTL/accessibility/test mapping for every source file.
11. Execute validation commands where possible; this connector session has no local repository execution capability and the audit branch reports no attached commit status checks for the latest audit checkpoint.
12. Complete security/privacy cross-module review, especially raw SQL ownership, refresh-token lifecycle, authorization coverage, logging/retention and Mobile credential storage.
13. Complete historical reconciliation across remaining feature branches/PRs, distinguishing merged production behavior from branch-only work.
14. Finish support-document consistency across `FILE_REVIEW_INDEX`, `CONTRACT_MATRIX`, `FEATURE_COMPLETENESS_MATRIX`, checkpoints, changelog, deep reads, appendix and open work.
15. Consolidate duplicate issue IDs/corrections so `12_OPEN_WORK.md` has one canonical issue per root cause and correction-only IDs remain NOT_APPLICABLE.
16. Resolve concrete backend↔mobile route mismatches found during reconciliation, including Mobile `getBrainContext()` versus the empty BrainIntegrationController (PB-186).
17. Reconcile configurable authentication lifetimes with persisted session lifetime and complete refresh-token rotation/reuse analysis (PB-172, PB-187).
18. Reconcile package/CI validation coverage with the actual test inventory, especially mobile tests currently not represented by a package test script/CI test step; this is part of the existing test-quality gaps and must not be mistaken for runtime-green evidence.
19. Reconcile operational script canonicality/deprecation/archive policy so historical executable variants cannot silently become alternate production procedures.

## Newly confirmed integration findings / evidence refinements

- `ContentModule` is active in `AppModule`; the earlier orphan claim PB-167 is NOT_APPLICABLE.
- `LifeTasksModule` is not imported by `AppModule`, while active `LifeExecutionModule` is; the parallel task-domain finding remains open.
- `RecommendationIntelligenceModule` and `GoalIntelligenceModule` are not wired into the active `AppModule` in the inspected current-main source state.
- Mobile command-center cards are active consumers; their localization is locally hardcoded rather than routed through the global dictionary.
- `apps/mobile/components/AnimatedPressable.tsx` and `AnimatedSection.tsx` duplicate motion wrappers already present in `lib/motion.tsx` and have no observed external consumer in the inspected search.
- Mobile TTS preparation downloads remote ONNX/token/vocoder assets and checks presence but not cryptographic integrity; this remains a specific supply-chain expression of PB-129/PB-185.
- Mobile `lib/api.ts` defines `getBrainContext()` for `/brain-integration/context`, but the backend BrainIntegration controller exposes no route methods; PB-186 remains the canonical mismatch.
- `AuthService.createAuthResponse()` persists a 30-day session expiry while the refresh JWT lifetime is configurable; PB-187 remains canonical.
- Package/CI review confirms the mobile pipeline currently runs typecheck, Expo config and Android JS export, but the mobile package exposes no normal `test` script; this reinforces the existing mobile test/coverage gap rather than being asserted as a separate runtime failure.
- Historical review confirms PR #48 (Global Market foundation) remains open/unmergeable against `main`, PR #49 remains open/mergeable only against `feature/global-settings-mobile`, and PR #66 remains draft/open; none is treated as current `main` production behavior.

## Resolved file-level gaps

- Prisma migration reading: RESOLVED — all 39 migration SQL files plus lock identified/read.
- Assistant module read: RESOLVED for the enumerated current-main Assistant tree.
- Brain Integration: RESOLVED for enumerated module tree; controller is intentionally source-only and its missing mobile endpoint remains PB-186.
- Conversation Engine: RESOLVED for enumerated module tree.
- Decision Engine: RESOLVED for enumerated module tree.
- Adaptive Learning: RESOLVED for enumerated module tree.
- Goal Intelligence: RESOLVED for enumerated service/module file-read scope, but runtime wiring remains open.
- Memory Intelligence: RESOLVED for enumerated module tree and associated tests.
- LifeTasks: RESOLVED for enumerated module file-read scope, but runtime wiring/parallel-domain issues remain open.
- Mobile components: RESOLVED for all seven files under `apps/mobile/components/` in BATCH-0010.
- Mobile scripts: RESOLVED for the two current `apps/mobile/scripts/*.cjs` files.
- Backend controller route inventory: RESOLVED at source/controller level for the active AppModule set plus identified source-only controller shells; cross-layer consumer/DTO/test/runtime closure remains open.
- Backend common config/bootstrap/database/i18n/image pipeline: RESOLVED for the identified `src/common` boundary; repository-wide consumer and runtime validation remains open.

No remaining gap is marked repository-wide resolved without direct evidence.
