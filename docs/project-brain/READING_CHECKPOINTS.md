# Reading Checkpoints

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: current-main manifests/AppModule; complete identified Core source files; full Prisma schema; all 39 migration SQL files; complete Assistant TypeScript source/test scope; complete enumerated Brain; Food/Recipe/Nutrition/Meals/Recommendation/Budget; Shopping/Inventory/Shopping Intelligence and substantial Price Intelligence; Life/Health enumerated modules; Fitness/Workout/Calisthenics/Gym/Yoga and related Personal Brain fitness consumers; Platform/Test/CI enumerated manifests/E2E/workflows; substantial Mobile routes/clients/components; all seven Mobile component files; Mobile `lib/motion.tsx`; both Mobile scripts; remaining identified Mobile library/notification contract files; backend route/API/controller inventory and selected backend↔mobile consumer reconciliation; BATCH-0013 operational recipe/image/food scripts and relevant migrations; backend common/config/bootstrap/database/i18n/images; historical high-value PR/branch reconciliation; continued Mobile app/lib screen/domain-client review; CI/release workflow and onboarding/session lifecycle review; raw-SQL destructive-operation sweep; Brain history/retention implementation and conversation persistence/deletion paths.
Scope not yet read: remaining repository source outside current audited trees; exhaustive backend operational scripts and legacy variants; exhaustive platform/common/test inventory; repository-wide route/consumer/database reader-writer/transaction/relation/index mapping; full runtime validation; complete security/privacy closure; complete historical docs/branches/PR reconciliation.
Evidence roots: target `main` @ `e38d4d16b0cf6e6ea714fa0bcc048e80187bcb3b`; audit branch `audit/project-brain-2026-09-11`; `apps/backend/`; `apps/mobile/`; `.github/workflows/`; `docs/project-brain/`.
Confidence: HIGH for completed file reads; MEDIUM for cross-module conclusions; no runtime test/build/device verification claim.
Open questions: exact repository-wide inventory/line counts; live DB drift; full consumer matrices; exact CI run results; physical-device behavior; script canonicality/deprecation policy; complete route↔DTO↔mobile consumer reconciliation; deployed RLS/edge controls; complete retention/deletion coverage for every persisted user-sensitive table.

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
Findings added/reconciled: PB-186 (Mobile `getBrainContext()` targets unexposed `/brain-integration/context`; no observed screen consumer), PB-187 (persisted refresh session expires in hard-coded 30 days while JWT expiry is configurable), PB-171 re-confirmed (Fitness reads `req.user.sub` while Passport strategy returns loaded User object), PB-182 re-confirmed (mobile auth storage uses AsyncStorage), PB-205 (Mobile domain API clients inconsistently implement 401→refresh→retry).
Unresolved: full route DTO/output/error/test/mobile-consumer mapping; final duplicate controller reconciliation; runtime HTTP validation.

## BATCH-0013 — Backend operational scripts
Status: IN_PROGRESS
Completed so far: package-wired recipe/food/image/country scripts, duplicate/versioned resolver and country variants, image reprocessors, relevant recipe migrations, local guaranteed image pipeline variants, backend common image pipeline, release workflow, and high-value historical image/market branches; additional Brain retention/deletion cross-check.
Findings added: PB-188, PB-189, PB-190, PB-192, PB-193, PB-194, PB-195, PB-196, PB-197, PB-198, PB-199, PB-200, PB-201, PB-202, PB-203, PB-204, PB-206.
New cross-layer/security findings from continuation: PB-207 (mobile onboarding state local-only and not synchronized with backend onboarding/profile contracts), PB-208 (refresh tokens persisted in plaintext), PB-209 (stored session expiry not enforced during refresh lookup), PB-210 (Brain retention policy is process-local with no observed durable enforcement path).
Important corrections: final food-intelligence self-test is present; `ContentModule` orphan claim is false/NOT_APPLICABLE; Personal Brain execute-next/feedback endpoint absence claim is false/NOT_APPLICABLE.
Unresolved: remaining operational scripts, exhaustive duplicate lineage, exact canonical/deprecated status, execution validation, remaining workflow entrypoints.

## Historical reconciliation checkpoint
Status: IN_PROGRESS
- PR #48 `feat(price-intelligence): global market source foundation`: OPEN and currently UNMERGEABLE against `main`.
- PR #49 `feat(price-intelligence): complete global market foundation`: OPEN and currently MERGEABLE only against `feature/global-settings-mobile`, not `main`.
- PR #60 `validate multilingual context certification`: DRAFT and OPEN against `main`; branch-only validation work.
- PR #66 `chore(agent): autonomous control plane + local-first recipe media`: DRAFT and OPEN against `main`.
- None of these historical lines is treated as merged production behavior without explicit merge evidence.
- The historical autonomous-control-plane one-time mobile repair workflow remains a branch-scoped control-plane artifact; it is not treated as current-main production automation.

## Remaining Master Prompt closure
1. Exhaustive route↔DTO↔test↔mobile consumer matrix.
2. Exhaustive database reader/writer/transaction/relation/index reconciliation.
3. Security/privacy/authorization/retention/secret/config closure.
4. Remaining common/platform/test and legacy operational source closure.
5. Historical branch/PR and documentation reconciliation.
6. Full validation ledger and final source-of-truth consistency pass.
7. Freeze the canonical findings catalog only after all preceding gates are directly evidenced.
8. Only after audit closure begin separate remediation using the frozen findings catalog.
