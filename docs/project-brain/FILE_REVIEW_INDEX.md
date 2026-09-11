# File Review Index

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: baseline manifests, AppModule and complete current-`main` Auth source tree.
Scope not yet read: repository-wide deterministic source inventory and all remaining audit scopes.
Evidence roots: current `main` commit `e38d4d16b0cf6e6ea714fa0bcc048e80187bcb3b`.
Confidence level: MEDIUM for listed files; LOW for completeness.
Open questions: exact automated line counts for the full repository; all remaining files.

## BATCH-0001 — Auth baseline

| Path | Language | Line count | Module/package | Purpose | Status |
|---|---|---:|---|---|---|
| `apps/backend/src/modules/auth/auth.module.ts` | TypeScript | unknown* | auth | Nest module wiring | READ_COMPLETELY |
| `apps/backend/src/modules/auth/auth.service.ts` | TypeScript | unknown* | auth | register/login/refresh/logout | READ_COMPLETELY |
| `apps/backend/src/modules/auth/controllers/auth.controller.ts` | TypeScript | unknown* | auth | HTTP routes | READ_COMPLETELY |
| `apps/backend/src/modules/auth/dto/register.dto.ts` | TypeScript | unknown* | auth | registration validation | READ_COMPLETELY |
| `apps/backend/src/modules/auth/dto/login.dto.ts` | TypeScript | unknown* | auth | login validation | READ_COMPLETELY |
| `apps/backend/src/modules/auth/dto/logout.dto.ts` | TypeScript | unknown* | auth | logout input validation | READ_COMPLETELY |
| `apps/backend/src/modules/auth/dto/refresh-token.dto.ts` | TypeScript | unknown* | auth | refresh input validation | READ_COMPLETELY |
| `apps/backend/src/modules/auth/guards/jwt-auth.guard.ts` | TypeScript | unknown* | auth | JWT guard adapter | READ_COMPLETELY |
| `apps/backend/src/modules/auth/services/session.service.ts` | TypeScript | unknown* | auth | session persistence/revocation | READ_COMPLETELY |
| `apps/backend/src/modules/auth/strategies/jwt.strategy.ts` | TypeScript | unknown* | auth | bearer JWT validation | READ_COMPLETELY |
| `apps/backend/src/modules/auth/utils/token.utils.ts` | TypeScript | unknown* | auth | access/refresh token creation | READ_COMPLETELY |

\* Exact line counts remain pending because the runtime has no local clone and the GitHub connector returns source as structured text rather than a filesystem line-countable tree.

No other source file is marked READ_COMPLETELY by this baseline solely from directory names.
