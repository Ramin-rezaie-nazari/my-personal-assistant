# Reading Checkpoints

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: current-main manifests/AppModule; complete identified Core source files; full Prisma schema; all 39 migration SQL files; complete Assistant TypeScript source/test scope; complete enumerated Brain; Food/Recipe/Nutrition/Meals/Recommendation/Budget; Shopping/Inventory/Shopping Intelligence and substantial Price Intelligence; Life/Health enumerated modules; Fitness/Workout/Calisthenics/Gym/Yoga and related Personal Brain fitness consumers; Platform/Test/CI enumerated manifests/E2E/workflows; substantial Mobile routes/clients/components; all seven Mobile component files; Mobile `lib/motion.tsx`; both Mobile scripts.
Scope not yet read: remaining Fitness-adjacent source; remaining Mobile route/component/library/native files; exhaustive platform/common/test inventory; repository-wide route/consumer/database matrices; full runtime/device/build validation; full security/privacy closure; historical docs/branches.
Evidence roots: target `main` @ `e38d4d16b0cf6e6ea714fa0bcc048e80187bcb3b`; audit branch `audit/project-brain-2026-09-11`; `apps/backend/src/`; `apps/backend/prisma/`; `apps/mobile/`; `.github/workflows/`; `docs/project-brain/`.
Confidence level: HIGH for completed file-level reads; MEDIUM for cross-module conclusions until remaining scopes and runtime validation are complete; no runtime execution claim.
Open questions: exhaustive repository inventory/line counts; live DB drift; full model/table reader-writer/transaction map; remaining Mobile route map; exact CI run status for target commit; physical-device behavior.

## BATCH-0001 — baseline
Status: COMPLETE
Result: Project Brain initialized on isolated audit branch; Auth source and baseline manifests/AppModule read completely.

## BATCH-0002 — Core
Status: COMPLETE
Result: identified current-main Core files across Auth, Users, Profile, Preferences, Onboarding, Settings, Context Engine, Device Intelligence and User Intelligence read completely.

## BATCH-0003 — Database schema/migration baseline
Status: COMPLETE
Scope: `apps/backend/prisma/schema.prisma` completely; all 39 migration SQL files; migration lock identified.
Result: final Prisma schema contains 32 models; migration evolution documented.
Runtime anomalies retained as open: `ConversationTurn`, `DecisionOutcome`, `WorkoutPerformance`, Price Intelligence tables, RecipeStep/RecipeMedia and Life Execution compatibility tables are not all represented in final Prisma models.

## BATCH-0004A/B/C/D — Brain
Status: COMPLETE — FILE-READ SCOPE
Result: Assistant + Personal Brain + Brain Integration + Conversation Engine + Decision Engine + Adaptive Learning + Goal Intelligence + Memory Intelligence enumerated source/test scopes were read and documented. This is not runtime verification.

## BATCH-0005 — Food / Recipe / Nutrition / Shopping / Price
Status: COMPLETE — ENUMERATED FILE-READ SCOPE
Result: Food/Recipe/Nutrition/Meals/Recommendation/Budget plus Shopping/Inventory/Shopping Intelligence and substantial Price Intelligence scopes read and documented. Outstanding runtime/schema/consumer reconciliation remains open.

## BATCH-0006 — Life / Health
Status: COMPLETE — ENUMERATED FILE-READ SCOPE
Result: Calendar, Daily, Goals, Habits, Life Execution, LifeTasks, Reminders, Notifications, Supplements and active/legacy Health surfaces were read and documented in `deep-read/05-life-health.md`.
Key issue range: PB-073..PB-088 plus PB-156..PB-160.

## BATCH-0007 — Fitness
Status: COMPLETE — ENUMERATED FILE-READ SCOPE
Scope read: Fitness profile, Workout, Calisthenics, Gym, Yoga and Personal Brain fitness orchestrator/policy/progression/skill-unlock consumers.
Deep-read: `deep-read/06-fitness.md` updated.
Key issue range: PB-089..PB-104.
Remaining: Fitness-adjacent source outside enumerated scope and final cross-module reconciliation.

## BATCH-0008 — Platform / Tests / CI
Status: COMPLETE — ENUMERATED FILE-READ SCOPE
Scope read: backend/mobile package manifests; bootstrap/runtime validation setup; E2E config/setup/specs; all workflow files identified under `.github/workflows/`; target-commit workflow-run query.
Deep-read: `deep-read/07-platform-tests.md` updated.
Key issue range: PB-106..PB-110 and selected cross-cutting Mobile CI findings.
No runtime test/build execution claimed.
Remaining: exhaustive common/platform/test inventory and full historical/runtime verification.

## BATCH-0009 — Mobile main route/client/native scope
Status: COMPLETE — ENUMERATED FILE-READ SCOPE
Scope read: root router/auth/language; assistant/brain/daily/command-center; onboarding/calendar/reminders/habits/inventory/meals/meal-builder/meal-detail/recipe-match/shopping/smart-meals/supplements/notifications/yoga/insights/price-history; core API and domain client files; selected mobile specs; mobile/native manifests.
Deep-read: `deep-read/08-mobile-deep-read.md` updated.
Key issue range: PB-111..PB-155.
Remaining: complete app/lib/component/native inventory and final backend-to-mobile matrix.

## BATCH-0010 — Mobile components / motion / scripts
Status: COMPLETE — FILE-READ SCOPE
Scope: all source files under `apps/mobile/components/` (7 files), `apps/mobile/lib/motion.tsx`, `apps/mobile/scripts/prepare-khadijah-tts-model.cjs`, `apps/mobile/scripts/start-lan.cjs`.
Result: component and utility contracts were read completely; `AnimatedPressable`/`AnimatedSection` wrappers duplicate exports already present in `lib/motion.tsx`; command-center cards are active consumers; TTS preparation script downloads model/vocoder assets without checksum verification.
Findings recorded: PB-183..PB-185; PB-129 updated with the more specific script evidence; ContentModule false-positive correction also recorded in issue appendix.
No production code changes were made.

## Next batch
BATCH-0011 — continue exhaustive Mobile `app/` and `lib/` inventory from the remaining unreviewed files, then update route/consumer/test/status matrices before moving to the final Platform/common and repository-wide reconciliation passes.
