# Reading Checkpoints

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: current-main manifests/AppModule; complete identified Core source files; full Prisma schema; all 39 migration SQL files; complete Assistant TypeScript source/test scope; complete enumerated Brain; Food/Recipe/Nutrition/Meals/Recommendation/Budget; Shopping/Inventory/Shopping Intelligence and substantial Price Intelligence; Life/Health enumerated modules; Fitness/Workout/Calisthenics/Gym/Yoga and related Personal Brain fitness consumers; Platform/Test/CI enumerated manifests/E2E/workflows; substantial Mobile routes/clients/components; all seven Mobile component files; Mobile `lib/motion.tsx`; both Mobile scripts; remaining identified Mobile library/notification contract files; BATCH-0012 backend route/API/controller inventory and selected backend↔mobile consumer reconciliation; BATCH-0013 operational recipe/image/food scripts and relevant migrations; backend common config/bootstrap/database/i18n/images; historical high-value PR/branch reconciliation.
Scope not yet read: exhaustive backend operational scripts and remaining repository source/tests/consumers; any remaining Mobile source; exhaustive platform/common/test inventory; repository-wide route/consumer/database reader-writer/transaction mapping; full runtime validation; full security/privacy closure; historical docs/branches beyond inspected high-value branches/PRs.
Evidence roots: target `main` @ `e38d4d16b0cf6e6ea714fa0bcc048e80187bcb3b`; audit branch `audit/project-brain-2026-09-11`; `apps/backend/`; `apps/mobile/`; `.github/workflows/`; `docs/project-brain/`.
Confidence: HIGH for completed file reads; MEDIUM for cross-module conclusions; no runtime test/build/device verification claim.
Open questions: exhaustive inventory/line counts; live DB drift; full consumer matrices; exact CI run results; physical-device behavior; script canonicality/deprecation policy; complete route↔DTO↔mobile consumer reconciliation.

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
Scope completed so far: backend root startup/config/database/i18n/images; Auth controller/service/token/session; broad active controller inventory across Core, Brain, Food/Commerce, Life/Health, Fitness, Dashboard and Intelligence; AppModule wiring checks; selected Mobile route/consumer searches; historical branch/PR status checks.
Findings added/reconciled: PB-186 (Mobile `getBrainContext()` targets unexposed `/brain-integration/context`; no observed screen consumer), PB-187 (persisted refresh session expires in hard-coded 30 days while JWT expiry is configurable), PB-171 re-confirmed (Fitness reads `req.user.sub` while Passport strategy returns loaded User object), PB-182 re-confirmed (mobile auth storage uses AsyncStorage).
Unresolved: full route DTO/output/error/test/mobile-consumer mapping; final duplicate controller reconciliation; runtime HTTP validation.

## BATCH-0013 — Backend operational scripts
Status: IN_PROGRESS
Completed so far: package-wired recipe/food/image/country scripts, duplicate/versioned resolver and country variants, image reprocessors, relevant recipe migrations, local guaranteed image pipeline variants, backend common image pipeline, and high-value historical image/market branches.
Findings added: PB-188 (recipe-content importer calls Prisma delegates absent from final Prisma schema), PB-189 (dataset image importer `RECIPE_IMAGE_RESET=1` has destructive global delete behavior), PB-190 (country-intelligence `LIMIT` mode performs unscoped global cleanup before limited reprocessing), PB-192 (no dataset offset/checkpoint), PB-193 (non-transactional related writes), PB-194 (60KB image cap diverges from later 20–150KB local-media design target), PB-195 (multiple executable country variants), PB-196 (positional image reprocess LIMIT), PB-197 (hero/primary contract drift), PB-198 (final resolver self-test not package/CI-wired), PB-199 (quality-score unit mismatch), PB-200 (nutrition estimate provenance gap), PB-201 (RESET storage pagination mismatch), PB-202 (existing-image/skip pagination mismatch), PB-203 (broken v8 local image orchestration), PB-204 (country preference helper/query-shape mismatch).
Important correction: final food-intelligence self-test is present; the finding is automation/wiring, not missing-test coverage.
Unresolved: remaining operational scripts, exhaustive duplicate lineage, exact canonical/deprecated status, execution validation.

## Historical reconciliation checkpoint
Status: IN_PROGRESS
- PR #48 `feat(price-intelligence): global market source foundation`: OPEN and currently UNMERGEABLE against `main`.
- PR #49 `feat(price-intelligence): complete global market foundation`: OPEN and currently MERGEABLE against `feature/global-settings-mobile`, not `main`.
- PR #66 `chore(agent): autonomous control plane + local-first recipe media`: DRAFT and OPEN against `main`.
- The audit branch is currently 87 commits ahead of `main` and not behind it at the observed comparison point; audit documentation commits are not production changes.
- None of these historical lines is treated as merged production behavior without explicit merge evidence.

## Remaining Master Prompt closure
1. Exhaustive route↔DTO↔test↔mobile consumer matrix.
2. Exhaustive database reader/writer/transaction/relation/index reconciliation.
3. Security/privacy/authorization/retention/secret/config closure.
4. Remaining common/platform/test and legacy operational source closure.
5. Historical branch/PR reconciliation for remaining production-affecting divergence.
6. Full validation ledger and final source-of-truth consistency pass.
7. Only after the above, freeze the canonical findings catalog and begin separate remediation.
