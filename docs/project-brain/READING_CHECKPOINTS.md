# Reading Checkpoints

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: current-main manifests/AppModule; complete identified Core source files; full Prisma schema; all 39 migration SQL files; complete Assistant TypeScript source/test scope; complete enumerated Brain; Food/Recipe/Nutrition/Meals/Recommendation/Budget; Shopping/Inventory/Shopping Intelligence and substantial Price Intelligence; Life/Health enumerated modules; Fitness/Workout/Calisthenics/Gym/Yoga and related Personal Brain fitness consumers; Platform/Test/CI enumerated manifests/E2E/workflows; substantial Mobile routes/clients/components; all seven Mobile component files; Mobile `lib/motion.tsx`; both Mobile scripts; remaining identified Mobile library/notification contract files; backend route/API/controller inventory and selected backend↔mobile consumer reconciliation; BATCH-0013 operational scripts; backend common/config/bootstrap/database/i18n/images; historical high-value PR/branch reconciliation; Mobile screen/domain client review; CI/release/onboarding/session lifecycle review; raw SQL/Destructive-operation sweep; Brain retention/deletion; account erasure; backend CI/E2E database lifecycle; duplicate UsersController and HealthController reconciliation; root repository docs (`docs/PR_FEATURE_VOICE.md`, `docs/branding.md`, `docs/food-entity-resolution.md`, `docs/recipe-image-data-architecture.md`), `docs/roadmap/C-visual-ux-roadmap.md`; Mobile package/config/README/env; Mobile app `_layout.tsx`, `assistant.tsx`, `auth.tsx`, `brain-overview.tsx`, `calendar.tsx`, `command-center-v2.tsx`, `daily.tsx`; Mobile notification registration/runtime and local Persian TTS; root package/workspace and a chunk of root lockfile; continued localization and cross-layer contract checks; additional Mobile route screens `habits.tsx`, `inventory.tsx`, `insights.tsx`, `language.tsx`, `meals.tsx`, `meal-builder.tsx`, `meal/[id].tsx`, `notifications.tsx`, `reminders.tsx`, `onboarding.tsx`, `price-history.tsx`, `recipe-match.tsx`, `shopping.tsx`, `smart-meals.tsx`, `supplements.tsx`, `yoga.tsx`; Mobile `lib/i18n.ts`; `tools/recipe-image-pipeline.ts`; `tools/recipes/quality-policy.md`; `tools/recipes/source-manifest.json`; continuation full reads of `apps/mobile/lib/assistant-api.ts`, `brain-execution.ts`, `brand.ts`, `branding.spec.ts`, `branding.ts`, `calendar-api.ts`, `command-actions.ts`, `design-system.ts`, `inventory-api.ts`, `onboarding.ts`, `price-api.ts`, `recipe-api.ts`, `shopping-api.ts`, `shopping-basket-api.ts`; backend `src/app.module.ts`, `app.controller.ts`, `app.service.ts`, `main.ts`, `bootstrap.ts`, `common/config/config.module.ts`, `common/config/env.validation.ts`, `common/config/app-config/app-config.service.ts`, `common/database/prisma.module.ts`, `common/database/prisma.service.ts`; Mobile components `BrandMark.tsx`, `BrandWordmark.tsx`; backend operational script inventory and continued line-level reads of fitness content balance, food resolvers/self-tests, localized food resolvers, recipe content audit/import, ingredient intelligence and guaranteed media mirror; mobile assets/branding canonical SVG/guide/readme.
Scope not yet read: remaining repository source outside current audited trees, full matrices, exhaustive operational scripts, runtime execution, complete security/privacy reconciliation.
Evidence roots: target `main` @ `e38d4d16b0cf6e6ea714fa0bcc048e80187bcb3b`; audit branch `audit/project-brain-2026-09-11`; `apps/backend/`; `apps/mobile/`; `.github/workflows/`; `docs/`; `docs/project-brain/`; `tools/`.
Confidence: HIGH for completed file reads; MEDIUM for cross-module conclusions; no runtime test/build/device verification claim.
Open questions: exact repository-wide inventory/line counts; live DB drift; full consumer matrices; exact CI run results; physical-device behavior; script canonicality/deprecation policy; complete route↔DTO↔mobile consumer reconciliation; deployed RLS/edge controls; complete retention/deletion coverage for every persisted user-sensitive table; exact deletion policy for migration-only tables; whether any externally managed liveness check bypasses the app `/health` route requirement.

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
Scope completed so far: backend root startup/config/database/i18n/images; Auth controller/service/token/session; broad active controller inventory across Core, Brain, Food/Commerce, Life/Health, Fitness, Dashboard and Intelligence; AppModule wiring checks; selected Mobile route/consumer searches; historical branch/PR status checks; active-vs-orphan UsersController reconciliation; HealthController/HealthService active-vs-orphan reconciliation.
Findings added/reconciled: PB-186, PB-187, PB-171 narrowed, PB-182 re-confirmed, PB-205, PB-211, PB-213, PB-214.
Unresolved: full route DTO/output/error/test/mobile-consumer mapping; final duplicate-controller reconciliation beyond currently identified pairs; runtime HTTP validation.

## BATCH-0013 — Backend operational scripts and cross-layer continuation
Status: IN_PROGRESS
Completed so far: package-wired recipe/food/image/country scripts, duplicate/versioned resolver and country variants, image reprocessors, relevant recipe migrations, local guaranteed image pipeline variants, release workflow, Brain retention/deletion/account-erasure cross-checks, backend CI/E2E database lifecycle, continued Mobile screen/domain review, root docs/roadmap review, root/mobile package/config review, notification/voice/native review, localization cross-checks, tools/recipe policy/source manifest review.
Findings added: PB-188..PB-206, PB-207..PB-214, PB-215, PB-216, PB-217.
Documentation contract refinement: PB-194 now also cites `docs/recipe-image-data-architecture.md` because the documented hard 60KB cap is itself inconsistent with the higher-level 100–150KB image target.
Important corrections: PB-112 NOT_APPLICABLE; PB-167 NOT_APPLICABLE; PB-171 narrowed to active Fitness controller only; active Users controller uses `req.user.id`; active Health nested controller is profile/nutrition API while root public liveness controller is orphaned.
New source-level findings in this continuation: PB-215 Mobile daily route localization/RTL omission; PB-216 repeated localization/RTL omission across the inspected secondary route family; PB-217 React hook call-order violation in `apps/mobile/app/meals.tsx`.
Unresolved: remaining operational scripts, exhaustive duplicate lineage, complete platform/common/test inventory, exact canonical/deprecated status, execution validation, remaining workflow entrypoints, exhaustive route/DB/security closure.

## BATCH-0014 — Mobile library + backend startup/config continuation
Status: IN_PROGRESS
Completed reads: Mobile domain/auth/branding/calendar/design-system/onboarding/command-action/price/recipe/shopping/inventory clients; backend AppModule/startup/config/database core; BrandMark/BrandWordmark; Mobile app nested route `app/meal/[id].tsx`; Mobile root/config/assets/branding source files; backend operational script inventory continuation including fitness balance, food resolver and localized resolver chain, recipe-content audit/import, ingredient intelligence, and guaranteed media mirror.
Reconciliations: `apps/mobile/lib/brand.ts` is an apparent orphan branding source; search for `from './brand'` and distinctive `BRAND_COLORS` usage returned no matches, while `apps/mobile/lib/branding.ts` is the active/canonical branding source used by runtime components and tested by `branding.spec.ts`. This is now recorded as PB-219 and remains an audit-only finding.
The `recipe-content-audit.mjs` script was found to call the same non-final Prisma delegates (`recipeStep`/`recipeMedia`) implicated by PB-188, so PB-188 scope was broadened to both content operational scripts. The same audit script also has logically non-functional orphan counters/gating; this is PB-220.
`apps/backend/scripts/recipe-ingredient-intelligence.mjs` uses a positional `LIMIT` (`recipes.slice(0, LIMIT)`) with no offset/checkpoint; restartability assessment remains pending broader operational-script comparison before creating a separate canonical finding.
`apps/backend/scripts/recipe-media-guaranteed-mirror-v5.mjs` was read in segments; it persists a manifest and processes a bounded dataset prefix, while generated and downloaded media are constrained to 64KB. No new canonical finding was added from this script yet; package wiring search found no explicit package entry by this filename.
Findings added: PB-218, PB-219, PB-220.
No production code changed; audit branch contains documentation/catalog updates only.

## Repository documentation checkpoint
Status: IN_PROGRESS
Completed reads: root docs directory inventory; `docs/PR_FEATURE_VOICE.md`; `docs/branding.md`; `docs/food-entity-resolution.md`; `docs/recipe-image-data-architecture.md`; `docs/roadmap/C-visual-ux-roadmap.md`.
Observation reconciled: the recipe-image architecture document hard-codes a 60KB maximum, so the image-size contract discrepancy is broader than scripts alone and remains under PB-194.

## Mobile route checkpoint
Status: IN_PROGRESS
Completed reads in this continuation: `apps/mobile/README.md`, `.env.example`, `package.json`, `tsconfig.json`, `app.json`, `app/_layout.tsx`, `app/assistant.tsx`, `app/auth.tsx`, `app/brain-overview.tsx`, `app/calendar.tsx`, `app/command-center-v2.tsx`, `app/daily.tsx`, `app/habits.tsx`, `app/inventory.tsx`, `app/insights.tsx`, `app/language.tsx`, `app/meals.tsx`, `app/meal-builder.tsx`, `app/meal/[id].tsx`, `app/notifications.tsx`, `app/reminders.tsx`, `app/onboarding.tsx`, `app/price-history.tsx`, `app/recipe-match.tsx`, `app/shopping.tsx`, `app/smart-meals.tsx`, `app/supplements.tsx`, `app/yoga.tsx`, `app/goals.tsx`/`workout.tsx`/`fitness.tsx` were probed and returned Not Found from the contents API; `lib/api.ts` (source-level), `lib/i18n.ts`, `lib/notifications/push-registration.ts`, `lib/notifications/push-runtime.ts`, `lib/local-persian-tts.ts`; `scripts/start-lan.cjs`; `scripts/prepare-khadijah-tts-model.cjs`; Mobile assets branding folder and root app-icon; current nested `app/meal/[id].tsx` was directly re-read.
New findings: PB-215, PB-216, PB-217, PB-219.
Remaining: other app routes/nested route files if discovered, remaining lib/domain clients/providers, component/test/assets inventory, full route↔client↔backend matrix.

## Tools checkpoint
Status: IN_PROGRESS
Completed reads: `tools/recipe-image-pipeline.ts`, `tools/recipes/quality-policy.md`, `tools/recipes/source-manifest.json`.
Observation: tools policy explicitly documents an approximately 60KB image target, reinforcing that the image-size contract must be reconciled at the policy layer as well as scripts.

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
