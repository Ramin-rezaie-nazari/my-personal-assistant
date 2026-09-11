# MYPA Project Brain — Overview

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: current `main` repository metadata, root/backend/mobile package manifests, `apps/backend/src/app.module.ts`, and the complete Auth module source tree listed below.
Scope not yet read: complete repository source inventory; all backend/mobile source beyond the first Auth batch; Prisma schema/migrations; CI internals; generated/imported data; runtime validation.
Evidence roots: `package.json`; `apps/backend/package.json`; `apps/mobile/package.json`; `apps/backend/src/app.module.ts`; `apps/backend/src/modules/auth/`.
Confidence level: MEDIUM for the retrieved Auth/module evidence; LOW for repository-wide completeness.
Open questions: deterministic total source-file count; local Mac path/dirty state; complete route-to-mobile mapping; schema/migration reconciliation; full test/CI results.

## Product and architecture baseline

`apps/backend/src/app.module.ts` imports the current backend domain modules, including auth/users/profile/onboarding/preferences, assistant/personal brain, nutrition/food/recipes, shopping/inventory, life execution, fitness disciplines, device intelligence, decision/adaptive learning, dashboard/command center and content. Evidence: `apps/backend/src/app.module.ts:1-89`.

The backend package declares NestJS, Prisma/PostgreSQL, JWT/Passport, Argon2 and validation dependencies, with commands for build, typecheck, unit tests, E2E tests and recipe/content scripts. Evidence: `apps/backend/package.json`.

The mobile package is Expo/React Native with Expo Router, notifications, camera, AsyncStorage and a `typecheck` script. Source behavior has not yet been audited in this fresh baseline. Evidence: `apps/mobile/package.json`.

## Audit baseline

This Project Brain is intentionally conservative. A directory existing is not evidence of its internal behavior. Historical Project Brain material on `agent/mypa-autonomous-control-plane` is treated as historical evidence only until the corresponding current-`main` source is reread.
