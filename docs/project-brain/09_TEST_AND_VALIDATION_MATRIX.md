# Test and Validation Matrix

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: backend/mobile package scripts and Auth source. No test command has been executed in this environment.
Scope not yet read: CI jobs, test files across modules, E2E setup, runtime/device validation.
Evidence roots: `apps/backend/package.json`; `apps/mobile/package.json`; `apps/backend/src/modules/auth/`.
Confidence level: LOW until actual commands run.
Open questions: dependency installation state, DB availability, CI environment parity, native device gates.

## Known commands

Backend: `npm run build`, `npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run lint`. Evidence: `apps/backend/package.json`.

Mobile: `npm run typecheck`, plus Expo start scripts. Evidence: `apps/mobile/package.json`.

Current validation result: NOT_RUN.
