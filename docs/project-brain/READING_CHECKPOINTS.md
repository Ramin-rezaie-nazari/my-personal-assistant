# Reading Checkpoints

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: current-main manifests/AppModule; complete identified Core source files; full Prisma schema; all 39 migration SQL files; complete Assistant TypeScript source/test scope; complete enumerated Brain; Food/Recipe/Nutrition/Meals/Recommendation/Budget; Shopping/Inventory/Shopping Intelligence and substantial Price Intelligence; Life/Health enumerated modules; Fitness/Workout/Calisthenics/Gym/Yoga and related Personal Brain fitness consumers; Platform/Test/CI enumerated manifests/E2E/workflows; substantial Mobile routes/clients/components; all seven Mobile component files; Mobile `lib/motion.tsx`; both Mobile scripts; remaining identified Mobile library/notification contract files; BATCH-0012 backend route/API/controller inventory and selected backend↔mobile consumer reconciliation; initial BATCH-0013 operational recipe scripts.
Scope not yet read: exhaustive backend operational scripts and remaining repository source/tests/consumers; any remaining Mobile source; exhaustive platform/common/test inventory; repository-wide route/consumer/database reader-writer/transaction mapping; full runtime validation; full security/privacy closure; historical docs/branches.
Evidence roots: target `main` @ `e38d4d16b0cf6e6ea714fa0bcc048e80187bcb3b`; audit branch `audit/project-brain-2026-09-11`; `apps/backend/`; `apps/mobile/`; `.github/workflows/`; `docs/project-brain/`.
Confidence: HIGH for completed file reads; MEDIUM for cross-module conclusions; no runtime test/build/device verification claim.
Open questions: exhaustive inventory/line counts; live DB drift; full consumer matrices; exact CI run results; physical-device behavior; script canonicality/deprecation policy.

## BATCH-0001 — baseline
Status: COMPLETE

## BATCH-0002 — Core
Status: COMPLETE

## BATCH-0003 — Database schema/migration baseline
Status: COMPLETE — `schema.prisma` + all 39 migrations + lock read.

## BATCH-0004 — Brain
Status: COMPLETE — FILE-READ SCOPE.

## BATCH-0005 — Food / Recipe / Nutrition / Shopping / Price
Status: COMPLETE — ENUMERATED FILE-READ SCOPE.

## BATCH-0006 — Life / Health
Status: COMPLETE — ENUMERATED FILE-READ SCOPE.

## BATCH-0007 — Fitness
Status: COMPLETE — ENUMERATED FILE-READ SCOPE.

## BATCH-0008 — Platform / Tests / CI
Status: COMPLETE — ENUMERATED FILE-READ SCOPE; runtime unverified.

## BATCH-0009 — Mobile main route/client/native scope
Status: COMPLETE — ENUMERATED FILE-READ SCOPE.

## BATCH-0010 — Mobile components / motion / scripts
Status: COMPLETE — FILE-READ SCOPE.

## BATCH-0011 — Mobile residual library contracts
Status: COMPLETE — FILE-READ SCOPE.

## BATCH-0012 — Backend route/API inventory and consumer reconciliation
Status: IN_PROGRESS
Scope completed so far: backend root startup/config/database/i18n/images; Auth controller/service/token/session; broad active controller inventory across Core, Brain, Food/Commerce, Life/Health, Fitness, Dashboard and Intelligence; AppModule wiring checks; selected Mobile route/consumer searches.
Findings added/reconciled: PB-186 (Mobile `getBrainContext()` targets unexposed `/brain-integration/context`; no observed screen consumer), PB-187 (persisted refresh session expires in hard-coded 30 days while JWT expiry is configurable).
Unresolved: full route DTO/output/error/test/mobile-consumer mapping; final duplicate controller reconciliation; runtime HTTP validation.

## BATCH-0013 — Backend operational scripts
Status: IN_PROGRESS
Start scope: `apps/backend/scripts/` directory inventory plus exact reads of `recipe-content-import.mjs`, `recipe-image-import.mjs`, `recipe-image-dataset-import-v2.mjs`, `recipe-image-import-all-safe.mjs`, `recipe-country-intelligence-final.mjs`, and backend package script wiring.
Findings added: PB-188 (recipe-content importer calls Prisma delegates absent from final Prisma schema), PB-189 (dataset image importer `RECIPE_IMAGE_RESET=1` has destructive global delete behavior), PB-190 (country-intelligence `LIMIT` mode performs unscoped global cleanup before limited reprocessing).
Unresolved: remaining operational scripts, versioned duplicates, import lineage, exact canonical/deprecated status, execution validation.
Next deterministic work: continue BATCH-0013 from the full `apps/backend/scripts/` inventory, prioritize scripts wired by `apps/backend/package.json`, then versioned/legacy scripts and any direct DB/storage/external-download code; update script/deep-read/data-flow docs and final consistency records after coverage closure.
