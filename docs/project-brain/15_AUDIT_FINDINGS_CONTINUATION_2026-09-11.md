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
Evidence: `apps/mobile/package.json` defines `start`, `android`, `ios`, `web`, and `typecheck`, but no test script or test runner. The mobile CI workflow runs frozen install, TypeScript typecheck, Expo config validation, and Android JS export; it does not execute any mobile unit/spec tests. The repository nevertheless contains committed mobile spec files such as `apps/mobile/lib/branding.spec.ts` and notification/yoga specs. Impact: those mobile regression tests are not part of the normal main-branch CI gate, so changes can pass the mobile CI workflow without exercising the available behavioral test suite. This is distinct from PB-179: PB-179 is that typecheck explicitly excludes test files; PB-246 is the absence of a CI test execution path for the tests that do exist.

## PB-247 — Personal Brain Smart Planning uses server-local calendar time instead of persisted user timezone
Status: OPEN — TIMEZONE/BEHAVIOR HIGH
Locations: `apps/backend/src/modules/personal-brain/services/smart-planning.service.ts`, `getPlan()` and `replan()`; active consumers in `apps/backend/src/modules/personal-brain/controllers/personal-brain.controller.ts`.
Evidence: `SmartPlanningService.getPlan()` creates day boundaries with `setHours(0, 0, 0, 0)` / `setDate()` and derives `currentHour` with `getHours()`. `replan()` likewise chooses preferred hours using `new Date().getHours()` and writes a scheduled timestamp with `setHours()`. The service does not load the user's persisted `UserSettings.timezone`. The active Personal Brain controller exposes authenticated `GET /plan` and `GET /schedule/replan`, so this is not an orphaned helper. Other active backend code, such as RemindersService, explicitly reads `UserSettings.timezone`, confirming that user-local timezone is an existing application contract rather than an unavailable concept. Impact: users whose timezone differs from the backend process timezone can receive a plan for the wrong local calendar day, have scheduled-task selection cross a local midnight incorrectly, or have `replan()` choose a server-local hour rather than the user's preferred local hour. This is a distinct active Personal Brain timezone surface, not a duplicate of PB-221 (Adaptive Learning's UTC date-key window) or PB-238 (User Intelligence event fallback timezone).

## Validation correction/reconciliation notes

### PB-232 — REQUIRES RECLASSIFICATION
The earlier claim that an inline TypeScript interface body is rejected by Nest's global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` was too strong. Nest's ValidationPipe excludes `Object` from `toValidate()`, and Nest documentation explicitly notes that TypeScript interfaces compile to `Object` metadata. Therefore the inline `RememberMemoryBody` does not establish the claimed runtime whitelist collision by itself. Withdraw the specific runtime-blocking claim; retain only a separate API type-safety/design concern if independently justified.

### PB-234 — NARROW SCOPE
`CreateCalendarEventDto` is a real class-DTO validation surface because it has no validation decorators. The inline PATCH body should not be counted as a ValidationPipe whitelist collision solely because it is an inline object/interface type. PB-234 should therefore be narrowed to the class DTO unless separate runtime evidence proves an independent PATCH issue.

### PB-237 — REQUIRES RECLASSIFICATION
The earlier claim that the inline `@Body() body: { action: BehaviorAction; context?: BehaviorContext }` is rejected by the global whitelist/forbid policy was too strong. The inline body has `Object` metatype and Nest's ValidationPipe skips native `Object` metatypes. Withdraw the specific claim that the global pipe blocks this endpoint; retain only a separate API validation/design concern if justified by the route contract.

### PB-243 — DUPLICATE/RECONCILIATION REQUIRED BEFORE FREEZE
The grouped validation finding overlaps materially with historical findings: PB-077 covers Habit DTO validation, PB-085 covers Life Execution DTO validation, PB-089 covers Fitness controller write validation, PB-093 covers Workout write-contract validation, and PB-083 covers Supplements DTO contract drift. Do not treat PB-243 as a clean unique finding until each module's scope is mapped against those historical entries. If it adds distinct evidence for Supplements or another active class-DTO surface not covered historically, merge that evidence into the appropriate existing ID rather than retaining a duplicate umbrella ID.

## Audit control
No production code changed. PB-244, PB-245, PB-246 and PB-247 are new audit evidence and must be merged into the canonical Appendix during the next safe full-file Appendix update. Runtime/build/device validation remains unverified.