# Audit Findings Continuation — 2026-09-11

Temporary audit-control note. Canonical findings source remains `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md`; these notes must be merged into that Appendix before audit freeze. No remediation starts before Master Prompt audit closure.

## PB-244 — Backend `.env.example` omits required runtime environment variables
Status: OPEN — CONFIG/ONBOARDING HIGH
Location: `apps/backend/.env.example`, compared with `apps/backend/src/common/config/env.validation.ts`.
Evidence: `env.validation.ts` marks `APP_NAME`, `DATABASE_URL`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET` as required. The committed `.env.example` contains only `NODE_ENV`, `PORT`, and `APP_NAME`; it provides no `DATABASE_URL` or JWT secret placeholders.
Impact: a developer/operator following the repository's example environment file cannot construct a complete valid backend environment from that file alone; startup configuration will fail validation unless the missing required variables are supplied through undocumented/external setup. This is a repository onboarding/configuration contract gap, not a claim about production secret management.

## PB-245 — Backend README remains a stock NestJS starter document and omits MYPA operational setup
Status: OPEN — DOCUMENTATION/ONBOARDING MEDIUM
Location: `apps/backend/README.md`.
Evidence: the README still identifies the project as a generic NestJS starter repository, gives only generic `pnpm install/start/test` instructions, and contains no MYPA-specific environment setup, Prisma migration/generation workflow, required runtime variables, module architecture, or repository-specific operational scripts. The actual backend has project-specific required environment validation and a large set of Prisma/recipe-intelligence operational commands.
Impact: a new engineer can follow the README and still fail to obtain a runnable MYPA backend or misunderstand the canonical setup/operational workflow. This is documentation/onboarding debt rather than a runtime defect; canonical project documentation exists elsewhere but is not surfaced by the backend README.

## PB-246 — Mobile CI has no automated test execution despite committed mobile spec files
Status: OPEN — TEST/CI MEDIUM-HIGH
Locations: `.github/workflows/mobile-ci.yml`, `apps/mobile/package.json`, `apps/mobile/` `*.spec.ts`/`*.test.ts` files.
Evidence: `apps/mobile/package.json` defines `start`, `android`, `ios`, `web`, and `typecheck`, but no test script or test runner. The mobile CI workflow runs frozen install, TypeScript typecheck, Expo config validation, and Android JS export; it does not execute any mobile unit/spec tests. The repository nevertheless contains committed mobile spec files such as `apps/mobile/lib/branding.spec.ts` and notification/yoga specs. Impact: those mobile regression tests are not part of the normal main-branch CI gate, so changes can pass the mobile CI workflow without exercising the available behavioral test suite. This is distinct from PB-179/PB-152: those findings concern the compiler excluding test files; PB-246 concerns the absence of a CI test execution path.

## PB-247 — Personal Brain Smart Planning uses server-local calendar time instead of persisted user timezone
Status: OPEN — TIMEZONE/BEHAVIOR HIGH
Locations: `apps/backend/src/modules/personal-brain/services/smart-planning.service.ts`, `getPlan()` and `replan()`; active consumers in `apps/backend/src/modules/personal-brain/controllers/personal-brain.controller.ts`.
Evidence: `SmartPlanningService.getPlan()` creates day boundaries with `setHours(0, 0, 0, 0)` / `setDate()` and derives `currentHour` with `getHours()`. `replan()` likewise chooses preferred hours using `new Date().getHours()` and writes a scheduled timestamp with `setHours()`. The service does not load the user's persisted `UserSettings.timezone`. The active Personal Brain controller exposes authenticated `GET /plan` and `GET /schedule/replan`, so this is not an orphaned helper. Other active backend code, such as RemindersService, explicitly reads `UserSettings.timezone`, confirming that user-local timezone is an existing application contract rather than an unavailable concept. Impact: users whose timezone differs from the backend process timezone can receive a plan for the wrong local calendar day, have scheduled-task selection cross a local midnight incorrectly, or have `replan()` choose a server-local hour rather than the user's preferred local hour. This is distinct from PB-026/PB-221/PB-238 because it is the active Smart Planning service surface.

## PB-248 — Context Engine exposes an empty controller artifact while the service is used internally
Status: OPEN — ARCHITECTURE/API SURFACE MEDIUM
Locations: `apps/backend/src/modules/context-engine/controllers/context-engine.controller.ts`, `apps/backend/src/modules/context-engine/context-engine.module.ts`, active internal consumer `apps/backend/src/modules/personal-brain/services/brain-state.service.ts`.
Evidence: `ContextEngineModule` is active and `ContextEngineService` is injected into Personal Brain's `BrainStateService`, so the underlying context engine is not orphaned. However, `ContextEngineController` is registered under `@Controller('context-engine')` and injects `ContextEngineService` while defining no HTTP route methods. This creates an active module with an externally mounted controller artifact that exposes no actual endpoint and has no observed API purpose. Impact: the HTTP surface suggests a Context Engine API exists when the real contract is internal service-to-service use; future consumers can infer a route that does not exist or extend the wrong layer. This is an API-surface/documentation cleanup finding, not a claim that the internal context engine is unused.

## PB-249 — Active root backend route is still the generic NestJS “Hello World” starter endpoint
Status: OPEN — API/ARCHITECTURE MEDIUM
Locations: `apps/backend/src/app.controller.ts`, `apps/backend/src/app.service.ts`, `apps/backend/src/app.module.ts`.
Evidence: `AppModule` registers `AppController` and `AppService`; `AppController` exposes public `GET /`, and `AppService.getHello()` returns the literal `Hello World!`. The repository's actual application APIs live under domain controllers such as Auth, Dashboard, Personal Brain, Food, Meals, Shopping, etc. The root controller is therefore not a meaningful MYPA health/readiness contract; it is a leftover Nest starter surface. Impact: the public root endpoint can be mistaken for the canonical service health/readiness endpoint and leaves a starter artifact active in the production API surface. It also reinforces the documentation/onboarding drift captured separately in PB-245. This is not being counted as a health-route security finding; the dedicated health controller remains a separate concern.

## Validation correction/reconciliation notes

### PB-232 — REQUIRES RECLASSIFICATION
The earlier claim that an inline TypeScript interface body is rejected by Nest's global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` was too strong. Nest's ValidationPipe excludes `Object` from `toValidate()`, and Nest documentation explicitly notes that TypeScript interfaces compile to `Object` metadata. Therefore the inline `RememberMemoryBody` does not establish the claimed runtime whitelist collision by itself. Withdraw the specific runtime-blocking claim; retain only a separate API type-safety/design concern if independently justified.

### PB-234 — NARROW SCOPE
`CreateCalendarEventDto` is a real class-DTO validation surface because it has no validation decorators. The inline PATCH body should not be counted as a ValidationPipe whitelist collision solely because it is an inline object/interface type. PB-234 should therefore be narrowed to the class DTO unless separate runtime evidence proves an independent PATCH issue.

### PB-237 — REQUIRES RECLASSIFICATION
The earlier claim that the inline `@Body() body: { action: BehaviorAction; context?: BehaviorContext }` is rejected by the global whitelist/forbid policy was too strong. The inline body has `Object` metatype and Nest's ValidationPipe skips native `Object` metatypes. Withdraw the specific claim that the global pipe blocks this endpoint; retain only a separate API validation/design concern if justified by the route contract.

### PB-243 — DUPLICATE/RECONCILIATION REQUIRED BEFORE FREEZE
The grouped validation finding overlaps materially with historical findings: PB-077 covers Habit DTO validation, PB-085 covers Life Execution DTO validation, PB-089 covers Fitness controller write validation, PB-093 covers Workout write-contract validation, and PB-083 covers Supplements DTO contract drift. Do not treat PB-243 as a clean unique finding until each module's scope is mapped against those historical entries. If it adds distinct evidence for Supplements or another active class-DTO surface not covered historically, merge that evidence into the appropriate existing ID rather than retaining a duplicate umbrella ID.

## Historical catalog reconciliation completed during continuation

The audit branch's `docs/project-brain/12_OPEN_WORK.md` was re-read for the PB-001..PB-155 range that had previously been missing from the canonical Appendix snapshot. It confirms several apparent later duplicates are already represented historically:
- PB-026 covers Brain daily/weekly/life-context UTC boundaries.
- PB-043 covers Nutrition/Meals UTC dateKey defaults.
- PB-074 covers Goal check-in UTC dateKey.
- PB-076 covers Habit UTC today/streak/weekly window.
- PB-079 covers Calendar inline patch/UTC semantics.
- PB-077, PB-083, PB-085, PB-089 and PB-093 cover the major historical DTO/contract validation surfaces referenced in PB-243.
- PB-152 covers Mobile test files being excluded from TypeScript typecheck, while PB-125 covers broader Mobile automated-test limitations; PB-246 is retained only for the distinct absence of a CI test execution path after verifying the current Mobile package/workflow.

This historical catalog is an index/cross-check, not a substitute for recovering the exact historical Appendix text. The canonical Appendix still requires a safe full-file merge/recovery before freeze.

## Operational-script/workflow cross-check

`apps/backend/package.json` currently exposes recipe-image and recipe-intelligence scripts, but `.github/workflows/recipe-content-release.yml` invokes `pnpm recipe:content:import` and `pnpm recipe:content:audit`. Those commands are not present in the current backend package manifest. This confirms PB-206 from a fresh package/workflow comparison; it is not a new duplicate finding.

## BATCH-0020 — DB transaction + ownership/security continuation
Status: IN_PROGRESS
Scope completed: repository-wide searches for Prisma transactions, destructive `deleteMany` paths, JWT guard placement, request-user ownership accessors, and date/time serialization. Active transactional patterns were compared against known non-transactional findings rather than treating every multi-write-looking method as defective. Examples confirmed as already transactional include recipe ingredient writes, meal creation, nutrition logging, and fitness content batch updates. Ownership checks are consistently visible in the inspected active Shopping, Inventory, Meals, Users, Dashboard, Goals, Habits, Health, Recipes, Profile, Workout and Settings controller surfaces; no new canonical IDOR finding was created from this sweep. `req.user.sub` remains present in the known Users/Fitness paths and was not reclassified from existing findings without strategy/guard evidence. The broad `toISOString()` sweep also surfaced known timezone-sensitive date-key consumers (Dashboard, Daily, Habits, Workout, Daily Command Center, Personal Brain, Mobile Calendar), but these overlap existing timezone findings and were not duplicated.

Important DB observations for next pass: raw SQL readers/writers remain concentrated in Goals, LifeTasks, LifeExecution, Recipe Presentation, Personal Brain, Price Intelligence and operational Fitness scripts; those surfaces still require relation/index/schema reconciliation before freeze. Destructive paths include expected user-scoped deletes in Workout, Calendar, Reminders, Decision Audit and persistent plan state, while recipe content import performs multiple child deletes and remains part of the operational atomicity/restartability review.

No new canonical finding was created in BATCH-0020. No production code changed.

## Audit control
No production code changed. PB-244, PB-245, PB-246, PB-247, PB-248 and PB-249 are new audit evidence and must be merged into the canonical Appendix during the next safe full-file Appendix update. PB-232/PB-234/PB-237 remain reclassified/narrowed as above; PB-243 remains provisional and must not be treated as a final unique issue until merged against historical IDs. Runtime/build/device validation remains unverified.
