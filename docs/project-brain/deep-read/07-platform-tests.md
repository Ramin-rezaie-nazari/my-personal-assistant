# Platform and Tests Deep Read

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: backend/root and app package manifests; backend `main.ts`, `bootstrap.ts`, `tsconfig.json`, `eslint.config.mjs`; E2E config/setup/db-preparation/helper/specs; all 11 workflow files currently under `.github/workflows/`; Mobile `package.json`/`app.json`; GitHub workflow-run lookup for target commit (no usable PR-triggered run result exposed). File-level reading is complete for the enumerated platform/test/CI scope; no runtime command has been executed in this audit turn.
Scope not yet read: every remaining common/config/database/shared/content utility and operational script outside previously completed batches; exhaustive backend test inventory; full historical workflow/run inspection; production deployment manifests/secrets configuration; full Mobile native/build configuration; actual local/unit/E2E/build execution; runtime performance/resource tests.
Evidence roots: `.github/workflows/`; `apps/backend/package.json`; `apps/backend/src/main.ts`; `apps/backend/src/bootstrap.ts`; `apps/backend/tsconfig.json`; `apps/backend/eslint.config.mjs`; `apps/backend/test/`; `apps/mobile/package.json`; `apps/mobile/app.json`.
Confidence level: HIGH for inspected workflow/config findings; MEDIUM for repository-wide CI/test completeness until every test/config file and actual runs are reconciled.
Open questions: exact CI run status for target commit; full test coverage map; whether E2E DB setup's `db push` is unavoidable legacy behavior; production release policy and branch protection.

## Findings

- Global backend `ValidationPipe` is configured with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`, and `enableImplicitConversion: true`. Therefore DTO decorator presence materially changes runtime input semantics; inline controller bodies bypass this contract layer.
- Backend E2E setup uses `prisma db push` in `test/prepare-e2e-db.cjs`. CI migration steps may run `prisma migrate deploy`, but E2E database preparation can then force the database toward the current Prisma schema instead of proving the migration chain itself reproduces the target schema. This can mask migration-only/raw-SQL drift.
- E2E coverage inspected does not comprehensively assert anonymous rejection for known high-risk endpoints, including unguarded Price Intelligence and Shopping Intelligence paths. Existing happy-path E2E therefore does not give complete security-route confidence.
- The target commit did not expose a usable PR-triggered workflow result through the available GitHub run query, so no test/build pass is claimed from that source. No local runtime test was executed in this audit.
- `apps/backend/eslint.config.mjs` weakens static safety by permitting explicit `any` and using warning-level unsafe rules. This reduces the ability of CI to reject contract mismatches that compile but fail at runtime.
- `.github/workflows/mypa-mobile-typecheck-repair-once.yml` is not a pure verification workflow: it has write permissions and is designed to edit source, commit and push changes. This is a governance/reproducibility risk because CI can become an actor that changes the audited codebase.
- `.github/workflows/android-build.yml` and `android-apk.yml` provide overlapping Android build workflows, creating duplicated build/release responsibility.
- `.github/workflows/eas-android.yml` and `eas-preview.yml` also provide substantially overlapping EAS Android preview-build workflows through different CLI invocation methods.
- Mobile `package.json` has only `start`, `android`, `ios`, `web`, and `typecheck` scripts. No dedicated unit/integration/E2E script or test runner dependency was found; current Mobile quality gates therefore rely on typecheck and CI/build workflows plus a small number of library specs.
- `apps/mobile/app.json` has Expo Router `typedRoutes: false`, removing compile-time verification for route strings.
- Recipe content workflows are operationally separate from canonical Prisma recipe paths in parts of the audited repository: recipe image import/legacy ingestion use Supabase service-role secrets and direct scripts, while recipe content release applies Prisma migrations and imports. This reinforces the already recorded legacy/new recipe schema drift issue.

## Platform/Test issue IDs

- PB-106: E2E DB preparation uses `prisma db push` and can mask migration-chain drift.
- PB-107: E2E unauthenticated/high-risk endpoint coverage incomplete.
- PB-108: Mobile typecheck-repair workflow can mutate and push source automatically.
- PB-109: Duplicate Android build workflows.
- PB-110: ESLint static safety rules weakened by any/unsafe warning settings.
- PB-123: Duplicate EAS Android preview workflows.
- PB-125: Mobile automated test coverage lacks screen/integration E2E setup.
- PB-127: Expo Router typed routes disabled.

## Remaining work

Complete exhaustive test-file inventory and common/platform source inventory, inspect branch protection/release settings where available, reconcile all test commands and expected outputs, and only then close this deep read. Runtime execution remains explicitly unverified until actually run.
