# Security and Privacy

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: current-main Auth/Core account/controller/DTO source; global validation/config; selected device, fitness, dashboard, notifications and Personal Brain security boundaries; mobile credential/session storage; CI permissions/workflows; operational scripts with service-role access; historical high-value control-plane workflows.
Scope not yet read: exhaustive authorization matrix, complete database/RLS review, log/retention audit, production infrastructure controls, complete mobile privacy surface, live deployment secrets/config and runtime penetration validation.
Evidence roots: `apps/backend/src/`; `apps/backend/prisma/`; `apps/backend/scripts/`; `apps/mobile/`; `.github/workflows/`; Project Brain findings appendix.
Confidence level: HIGH for listed source-level findings; MEDIUM globally until runtime/deployment/RLS evidence is available.

## Verified mechanisms

- Argon2 is used for password hashing and verification in `apps/backend/src/modules/auth/auth.service.ts`.
- Access and refresh JWTs use separate configured secrets; refresh tokens carry an explicit `type: 'refresh'` claim.
- `JwtStrategy.validate()` resolves the user through `UsersService.findById()`.
- Global `ValidationPipe` enables `whitelist`, `forbidNonWhitelisted`, `transform`, and implicit conversion in `apps/backend/src/bootstrap.ts`.
- `envValidationSchema` requires `DATABASE_URL`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET`, so development fallback getters do not by themselves prove production secret bypass.
- Backend CI uses read-only contents permissions in the observed main workflows; the historical one-time mobile repair workflow on the autonomous branch is an exception with `contents: write` and self-mutation behavior, but it is branch-scoped and not treated as current-main production behavior.

## Open security/privacy findings

### Authentication/session lifecycle

- **PB-172 — refresh-token rotation gap:** successful `/auth/refresh` creates a new refresh session without revoking the presented old refresh session. This allows refresh-token reuse until the old JWT expires or session state is otherwise removed.
- **PB-187 — persisted session lifetime drift:** `AuthService.createAuthResponse()` hard-codes a 30-day persisted session expiry while JWT refresh lifetime is configuration-driven.
- `/auth/refresh` and `/auth/logout` are intentionally unguarded at controller level because they operate on refresh-token material; the service performs explicit token/session validation/revocation. Abuse/rate-limit protections remain subject to broader infrastructure review.

### Authorization / endpoint surface

- **PB-170 — DeviceIntelligence endpoint:** current controller exposes the route without a JWT guard. The service currently returns placeholder-like data, but future real device data would require explicit authorization.
- **PB-171 — Fitness identity contract:** active Fitness controller reads `req.user.sub` while the JWT strategy returns the loaded User object. This is a cross-contract correctness/security risk until runtime behavior is validated and the request type/strategy contract is unified.
- **PB-173 — application-level rate limiting/security headers:** no `helmet` or explicit CORS/rate-limit setup was observed in `bootstrap.ts`/main application bootstrap; external proxy controls are unknown, so this remains a design/deployment review item.

### Mobile credentials/privacy

- **PB-182 — credential storage:** mobile `apps/mobile/lib/api.ts` stores both access and refresh tokens in AsyncStorage rather than platform secure credential storage.
- **PB-185 / PB-129 surface — supply chain:** mobile TTS preparation downloads executable model assets and does not cryptographically verify them with a checksum.
- Mobile CI validates typecheck, Expo configuration and Android JS export, but does not run a mobile test suite; this is a QA/release gap that also limits privacy/regression confidence.

### Data integrity / operational security

- **PB-189/PB-201 — image RESET:** service-role-backed image dataset import has destructive reset behavior, including global DB deletes; storage enumeration is capped at the first 1000 objects, creating orphan risk on large datasets.
- **PB-200 — nutrition provenance:** hard-coded estimation constants lack source/version provenance, weakening auditability of derived nutrition data.
- Migration-only raw SQL contracts (`ConversationTurn`, `DecisionOutcome`, `WorkoutPerformance`, `GoalCheckin` and others) remain outside the final Prisma model contract and require explicit ownership/reconciliation before production hardening is considered complete.

## Privacy/retention review remaining

Still required before security closure:

1. Complete user-data field inventory across User, UserFact, UserBehavior, UserInsight, conversation, device, notification, nutrition, fitness and memory domains.
2. Map every field to retention/deletion behavior and user-facing deletion/export semantics.
3. Verify raw SQL tables obey the same authorization and deletion lifecycle as Prisma models.
4. Verify logging/exception paths do not emit tokens, passwords, health/nutrition details or private user context.
5. Verify DB/RLS policies and service-role boundaries in the deployed Supabase/Postgres environment.
6. Validate refresh-token rotation/reuse detection with runtime integration tests.
7. Validate rate-limit, abuse-control and security-header behavior at the actual deployment edge.

No security or privacy area is marked fully green without source + test/runtime/deployment evidence.
