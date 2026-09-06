# MYPA Autonomous Progress Log

> Living session-by-session engineering ledger. This file exists so a future agent can understand what was actually changed, what was validated, what is still blocked, and what must never be claimed without evidence. Every completed engineering batch must add an entry here so work is not repeated blindly.
>
> Companion source-of-truth documents: `03_PROJECT_BRAIN_BOOK.md`, `04_ARCHITECTURE_ATLAS.md`, `05_CURRENT_STATE.md`, `06_VALIDATION_LEDGER.md`.

## 2026-09-06 — Current autonomous corpus/release continuation

### Work performed in this continuation

- Inspected the real GitHub Actions result for the content-corpus bootstrap.
- Found a concrete environment blocker: the Actions runner received empty `MYPA_FITNESS_DATABASE_URL`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`, so the job stopped before install/import. No corpus completion claim is allowed from that run.
- Separated corpus responsibilities in the bootstrap workflow so missing fitness infrastructure can no longer prevent recipe-image work from being reasoned about independently.
- Fixed the workflow's strict-mode expression so it no longer contains a logically redundant `true-or-true` expression.
- Added the missing `apps/backend/scripts/recipe-content-audit.mjs` because `package.json` already exposed `recipe:content:audit` but the implementation was absent on the active branch.
- The recipe audit checks real recipe rows for required fields, ingredient integrity, step numbering/order, verification, media coverage, provenance/license metadata, broken media references, and duplicate normalized names; an empty recipe table is a hard failure, not a false green.
- Hardened `apps/backend/scripts/fitness-media-verify.mjs` so approved media validation checks HTTP success and image/WebP content rather than only URL shape; empty approved-media sets are not treated as completion.
- Added explicit progress/audit notes so subsequent autonomous sessions can start from evidence instead of repeating source inspection.

### Important evidence from the runner

- Workflow run `34034400326` / job `101489715731` reached the secret-check step and failed before any content import.
- Therefore: no statement such as "all 1,500 movements", "all 6,000 WebPs", or "all recipe images downloaded" is valid yet.

### What is deliberately NOT marked complete

- Runtime fitness corpus: not green until the real target database is populated and the release audit plus media verification both pass.
- Runtime recipe corpus: not green until real recipe data exists and the recipe-content audit passes.
- Recipe image corpus: not green until the actual Storage import runs and coverage is audited against the real recipe set.
- Yoga live pose analysis: not green while the mobile camera bridge remains `UnconfiguredYogaCameraBridge` and no compatible native frame/pose provider is installed.
- HealthKit/Health Connect: not green until native integrations exist, permissions/privacy behavior is validated, and device builds are tested.
- Play Store readiness: not green until signed release artifacts, installation/upgrade checks, store privacy/data declarations, backend production configuration, and device validation are evidenced.

### Tests / validation to run when environment becomes available

- Backend: install with frozen lockfile, Prisma generate, typecheck, unit tests, build, migration validation, API/E2E regression.
- Fitness: import -> balance levels -> audit -> WebP URL/content verification; release gate must prove 500 published movements per discipline, 10 levels, >=50 per level, and >=4 approved WebP assets per movement.
- Recipes: recipe import/population -> recipe-content audit -> recipe-image corpus import -> image coverage/quality/provenance audit -> mobile presentation regression.
- Mobile: route audit, surface audit, TypeScript typecheck, Expo prebuild, Android Gradle APK build, then physical-device behavior where required.
- Native: real Android Health Connect and iOS HealthKit permission/sync checks; real Yoga camera/pose pipeline; Persian local TTS lifecycle/crash validation.

### Repetition-prevention rule

Before starting a new batch, read this file plus `05_CURRENT_STATE.md`, `03_PROJECT_BRAIN_BOOK.md`, and `04_ARCHITECTURE_ATLAS.md`. Do not redo a completed implementation merely because a prior run was not green. Re-run only the validation that was actually missing, then fix the root cause of any new failure.

## 2026-09-06 — Control-plane continuation

### Starting verified state

- Active branch: `agent/mypa-autonomous-control-plane`.
- Active PR: #66 -> `main`.
- The existing state document explicitly kept fitness/recipe corpus population, physical-device validation, and Yoga native pose analysis unclaimed.

### Documentation policy reinforced

- Never declare CI green while a run is queued/in-progress.
- Never convert a static scaffold into a completed feature claim.
- Never claim the 1,500 fitness movements / 6,000 approved WebP assets until the actual target database passes import + audit + media verification.
- Never claim Yoga live pose analysis until a real compatible camera/pose provider is integrated and tested on a physical device.
- Never treat a debug Android build as equivalent to store readiness.

### New engineering work — onboarding persistence

- Reused existing `UserProfile`, `UserPreference`, `UserOnboarding`, and `UserFact` models instead of adding redundant profile storage.
- Added authenticated atomic onboarding persistence and mobile deferred retry semantics.
- Added regression coverage.
- CI/device status remains pending and is never inferred from source code alone.

## 2026-09-06 — Smart Meals source-of-truth integration

- Found a recommendation-drift risk: Smart Meals was locally constructing a simplified score while a canonical backend Recommendation Intelligence service already existed.
- Added a typed mobile client to the authenticated Brain recommendation endpoint.
- Changed Smart Meals presentation to use backend scores/reasons/coverage as its authoritative result.
- Kept the recipe detail surface as the final navigation target.
- CI/device verification remains pending and is not inferred from source inspection.

## 2026-09-06 — Native build blocker resolved at configuration level, verification pending

- Confirmed the earlier Android build was not a transient runner issue: Gradle consistently generated `PackageList.java` with the obsolete `expo.core.ExpoModulesPackage` import under pnpm isolated linking.
- Changed the repository linker policy to `node-linker=hoisted` and triggered a fresh Android run.
- Kept the blocker red until the new Gradle result is completed and the APK artifact is actually uploaded.

## 2026-09-06 — Onboarding remote-sync hardening

- Found that `persistOnboardingToBackend` treated a missing token as success, which could erase the deferred-sync obligation.
- Changed the function to fail when authentication is unavailable.
- Added a module-level in-flight guard around background retry to prevent repeated concurrent requests during bootstrap reads.

## 2026-09-06 — Fitness importer hardening

- Found that Gym/Calisthenics candidates were truncated to the target before media enrichment.
- Changed ingestion to collect an oversampled candidate pool, enrich media, and only then choose the deterministic target set, preferring records with four available media assets.
- Full corpus population and audit remain intentionally unclaimed until runtime evidence exists.

## 2026-09-06 — GitHub Actions smoke validation

- Added a minimal manual GitHub Actions smoke workflow with an `echo` step and deterministic shell equality check.
- The smoke run completed successfully; this proves runner scheduling and a basic shell job, not the application release pipeline.
- Converted the smoke workflow to `workflow_dispatch` only so normal development commits do not spend Actions minutes on a redundant sanity check.

## 2026-09-06 — Refresh-token storage hardening

- Kept refresh-token rotation/replay rejection behavior.
- Changed new session persistence to store a SHA-256 fingerprint rather than the raw bearer token.
- Added compatibility lookup/delete logic for legacy sessions that still contain the raw token.
- Added focused session-service tests for fingerprint storage and legacy compatibility.
- Runtime/typecheck/test validation for the exact latest commit is not claimed from source inspection alone.

## 2026-09-06 — Theme refresh hardening

- Confirmed `HomeShell` already consumes the reactive visual theme context.
- Closed the transition gap where the provider could retain its initial theme after onboarding/settings changed by refreshing the persisted theme whenever the app route changes.
- Physical-device visual validation is still required.
