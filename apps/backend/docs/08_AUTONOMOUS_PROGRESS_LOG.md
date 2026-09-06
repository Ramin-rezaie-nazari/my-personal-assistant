# MYPA Autonomous Progress Log

> Living session-by-session engineering ledger. This file exists so a future agent can understand what was actually changed, what was validated, what is still blocked, and what must never be claimed without evidence.
>
> Companion source-of-truth documents: `03_PROJECT_BRAIN_BOOK.md`, `04_ARCHITECTURE_ATLAS.md`, `05_CURRENT_STATE.md`, `06_VALIDATION_LEDGER.md`.

## 2026-09-06 — Control-plane continuation

### Starting verified state

- Active branch: `agent/mypa-autonomous-control-plane`.
- Active PR: #66 → `main`.
- Branch head before this batch: `3e1af7279ab47eee387d146a5add58411611a85d`.
- Android workflow run for that head was still executing Gradle; no green Android claim was made.
- The existing state document explicitly kept fitness/recipe corpus population, physical-device validation, and Yoga native pose analysis unclaimed.

### Documentation policy reinforced

- Never declare CI green while a run is queued/in-progress.
- Never convert a static scaffold into a completed feature claim.
- Never claim the 1,500 fitness movements / 6,000 approved WebP assets until the actual target database passes import + audit + media verification.
- Never claim Yoga live pose analysis until a real compatible camera/pose provider is integrated and tested on a physical device.
- Never treat a debug Android build as equivalent to store readiness.

### New engineering work — onboarding persistence

#### Problem found

Mobile onboarding was persisted to AsyncStorage only. The backend already owns `UserProfile`, `UserPreference`, `UserOnboarding`, and `UserFact`, so a completed onboarding flow could leave the server-side Brain without the same user context.

#### Architecture decision

Use the existing user/profile models rather than adding another profile table or introducing a migration solely for onboarding metadata.

- `UserProfile` stores: gender, birth date, height, weight, primary goal.
- `UserPreference` stores: onboarding completion, notification preference, and presentation theme.
- `UserOnboarding` stores: completion state, current step, completion timestamp.
- `UserFact` stores the remaining structured onboarding facts with `source = onboarding` and confidence `1`.
- OS permission flags are recorded as facts for traceability; the app still treats OS permission state as device-owned and optional.

#### Backend changes

- Added `apps/backend/src/modules/users/dto/save-onboarding.dto.ts` with strict enum/range/date validation.
- Added authenticated `POST /users/onboarding`.
- Added `UsersService.saveOnboarding(...)` using a single Prisma transaction so profile, preferences, completion state, and facts succeed or fail together.
- Female onboarding deterministically maps to `UserPreference.theme = feminine`; all other genders map to `default`.
- Repeated onboarding saves are idempotent through `upsert` operations.

#### Mobile changes

- Added `apps/mobile/lib/onboarding-api.ts` using the canonical `MOBILE_API_URL` resolver and the authenticated access token.
- `apps/mobile/lib/onboarding.ts` now keeps the local-first contract while syncing completed onboarding to the backend.
- Failed remote sync does not destroy local onboarding progress; a pending marker causes a best-effort retry on the next onboarding-state read.

#### Regression coverage

- Added `apps/backend/src/modules/users/users.service.spec.ts` covering atomic onboarding persistence, female theme mapping, onboarding completion and structured facts.

### Validation state for this batch

**NOT YET GREEN.**

A fresh CI run was triggered after the implementation commits. At the time of this ledger entry, the Android run was in progress during environment/job setup and had not completed the Gradle gate. No test result from the new onboarding code is claimed until the actual run completes.

## Known remaining blockers

### P0 — Voice/native Android

- The lifecycle race has been narrowed and guarded in the tracked JS provider.
- Real Android candidate/device validation is still required.
- No “voice stable” release claim is allowed yet.

### P1 — Global market / pricing

- Stacked global market work still requires conflict, dependency and regression review before integration.
- No live market price data is fabricated.

### P1 — Verified food/recipe corpus

- Taxonomy persistence foundation exists.
- Large verified ingredient/cuisine/safety corpus remains unfinished.
- Full recipe corpus runtime import + audit remains unfinished.

### P1 — Fitness corpus

- Importer, balancing gate, audit and WebP media verifier exist.
- Full runtime population of 1,500 movements / 6,000 approved WebP assets remains unverified in this environment.

### P1 — Yoga live pose analysis

- Camera/session UI and safety contract exist.
- Current pose-analysis bridge is intentionally unconfigured.
- A real compatible pose provider plus physical-device validation is still required.

### P2 — Mobile release

- Mobile route/surface audits now exist.
- Backend URL resolution is centralized.
- Full iOS/Android device matrix, visual polish, accessibility, offline behavior and store-readiness remain separate release gates.

## Next safe order of work

1. Re-check the completed CI results for the current branch head; fix failures at root cause.
2. Validate onboarding persistence with backend test/typecheck/build evidence.
3. Finish nested mobile localization and recommendation-intelligence mobile wiring.
4. Complete the default/feminine theme rollout across the entire mobile shell.
5. Continue authorization, rate limiting, observability, background jobs, notifications, backup/restore and performance hardening.
6. Integrate Global Market / Price Intelligence only after conflict and regression review.
7. Populate and audit real recipe + fitness corpora against the local PostgreSQL environment.
8. Resolve native Yoga and Voice device gates.
9. Only then move the project-level index toward a release-quality 100% claim.

## Evidence rule

A progress percentage is a planning indicator. A feature is “complete” only when implementation, relevant data/schema, targeted tests, integration/regression tests, documentation, and required environment/device validation all agree.
