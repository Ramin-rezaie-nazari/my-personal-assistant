# Audit Findings Continuation — 2026-09-11

Temporary audit-control note. Canonical findings source remains `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md`; these notes must be merged into that Appendix before audit freeze. No remediation starts before Master Prompt audit closure.

## PB-244 — Backend `.env.example` omits required runtime environment variables
Status: OPEN — CONFIG/ONBOARDING HIGH
Location: `apps/backend/.env.example`, compared with `apps/backend/src/common/config/env.validation.ts`.
Evidence: `env.validation.ts` marks `APP_NAME`, `DATABASE_URL`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET` as required. The committed `.env.example` contains only `NODE_ENV`, `PORT`, and `APP_NAME`; it provides no `DATABASE_URL` or JWT secret placeholders.
Impact: a developer/operator following the repository's example environment file cannot construct a complete valid backend environment from that file alone; startup configuration will fail validation unless the missing required variables are supplied through undocumented/external setup. This is a repository onboarding/configuration contract gap, not a claim about production secret management.

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
No production code changed. PB-244 is new audit evidence and must be merged into the canonical Appendix during the next safe full-file Appendix update. Runtime/build/device validation remains unverified.