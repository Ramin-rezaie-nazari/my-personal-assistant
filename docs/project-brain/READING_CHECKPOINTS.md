# Reading Checkpoints

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: current-main manifests/AppModule; complete identified Core source files; full Prisma schema; all 39 migration SQL files; complete Assistant TypeScript source/test scope; complete enumerated Brain; Food/Recipe/Nutrition/Meals/Recommendation/Budget; Shopping/Inventory/Shopping Intelligence and substantial Price Intelligence; Life/Health enumerated modules; Fitness/Workout/Calisthenics/Gym/Yoga and related Personal Brain fitness consumers; Platform/Test/CI enumerated manifests/E2E/workflows; substantial Mobile routes/clients/components; all seven Mobile component files; Mobile `lib/motion.tsx`; both Mobile scripts; remaining identified Mobile library/notification contract files.
Scope not yet read: any Mobile source outside current `app/`, `lib/`, `components/`, `scripts/` snapshots if present; exhaustive platform/common/test inventory; repository-wide route/consumer/database matrices; full runtime/device/build validation; full security/privacy closure; historical docs/branches.
Evidence roots: target `main` @ `e38d4d16b0cf6e6ea714fa0bcc048e80187bcb3b`; audit branch `audit/project-brain-2026-09-11`; `apps/backend/src/`; `apps/backend/prisma/`; `apps/mobile/`; `.github/workflows/`; `docs/project-brain/`.
Confidence level: HIGH for completed file-level reads; MEDIUM for cross-module conclusions until remaining scopes and runtime validation are complete; no runtime execution claim.
Open questions: exhaustive repository inventory/line counts; live DB drift; full model/table reader-writer/transaction map; full backend-mobile route map; exact CI run status for target commit; physical-device behavior.

## BATCH-0001 — baseline
Status: COMPLETE
Result: Project Brain initialized on isolated audit branch; Auth source and baseline manifests/AppModule read completely.

## BATCH-0002 — Core
Status: COMPLETE
Result: identified current-main Core files across Auth, Users, Profile, Preferences, Onboarding, Settings, Context Engine, Device Intelligence and User Intelligence read completely.

## BATCH-0003 — Database schema/migration baseline
Status: COMPLETE
Scope: `apps/backend/prisma/schema.prisma` completely; all 39 migration SQL files; migration lock identified.
Result: final Prisma schema contains 32 models; migration evolution documented. Runtime anomalies remain open.

## BATCH-0004A/B/C/D — Brain
Status: COMPLETE — FILE-READ SCOPE
Result: Assistant + Personal Brain + Brain Integration + Conversation Engine + Decision Engine + Adaptive Learning + Goal Intelligence + Memory Intelligence enumerated source/test scopes were read and documented. This is not runtime verification.

## BATCH-0005 — Food / Recipe / Nutrition / Shopping / Price
Status: COMPLETE — ENUMERATED FILE-READ SCOPE
Result: Food/Recipe/Nutrition/Meals/Recommendation/Budget plus Shopping/Inventory/Shopping Intelligence and substantial Price Intelligence scopes read and documented. Outstanding runtime/schema/consumer reconciliation remains open.

## BATCH-0006 — Life / Health
Status: COMPLETE — ENUMERATED FILE-READ SCOPE
Result: Calendar, Daily, Goals, Habits, Life Execution, LifeTasks, Reminders, Notifications, Supplements and active/legacy Health surfaces were read and documented.

## BATCH-0007 — Fitness
Status: COMPLETE — ENUMERATED FILE-READ SCOPE
Result: Fitness profile, Workout, Calisthenics, Gym, Yoga and related Personal Brain fitness consumers were read and documented.

## BATCH-0008 — Platform / Tests / CI
Status: COMPLETE — ENUMERATED FILE-READ SCOPE
Result: backend/mobile package manifests; bootstrap/runtime validation setup; E2E config/setup/specs; workflow files identified under `.github/workflows`; target-commit workflow-run query. No runtime test/build execution claimed.

## BATCH-0009 — Mobile main route/client/native scope
Status: COMPLETE — ENUMERATED FILE-READ SCOPE
Result: primary `app/` routes, core API/domain clients, selected specs, and mobile/native manifest scope were read. Remaining source inventory continued in later batches.

## BATCH-0010 — Mobile components / motion / scripts
Status: COMPLETE — FILE-READ SCOPE
Scope: all source files under `apps/mobile/components/` (7 files), `apps/mobile/lib/motion.tsx`, `apps/mobile/scripts/prepare-khadijah-tts-model.cjs`, `apps/mobile/scripts/start-lan.cjs`.
Result: duplicate animation wrapper surface and TTS asset-integrity gap documented. No production code changes made.

## BATCH-0011 — Mobile residual library contracts
Status: COMPLETE — FILE-READ SCOPE
Scope: `apps/mobile/lib/design-system.ts`, `motion-components.tsx`, `branding.ts`, `branding.spec.ts`, `notifications/notification-contract.ts`, `notifications/notification-contract.spec.ts`; relevant consumer searches also performed.
Result: these contracts are active in multiple screens/tests; notification contract has direct parser tests; `design-system`/`motion-components` are not orphaned. No new standalone correctness issue was promoted beyond existing documented reconciliation/design concerns.
Findings cross-referenced: PB-183..PB-185 plus existing mobile localization/branding/API-contract issues.

## Next batch
BATCH-0012 — exhaustive backend route/API inventory and consumer reconciliation, beginning with remaining Platform/Common/Test source that is not yet closed, then repository-wide route/database/security matrices.
