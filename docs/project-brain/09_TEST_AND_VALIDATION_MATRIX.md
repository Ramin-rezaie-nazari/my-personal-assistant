# Test and Validation Matrix

Last updated: 2026-09-18
Review status: AUTOMATED CI GREEN / ENVIRONMENTAL VALIDATION REQUIRED

## Automated repository evidence

### Backend CI — GREEN

Current main Backend CI run 35318539437 completed successfully through frozen dependency installation, Prisma schema validation/generation, migration deployment and idempotence, food-intelligence self-test, backend build, backend unit tests and backend API E2E.

### Mobile CI — GREEN

Current main Mobile CI run 35318539524 completed successfully through frozen-lockfile installation, mobile typecheck, source tests, committed Jest specs, Expo validation and Android JavaScript bundling.

### Canonical Android native build

.github/workflows/android-apk.yml is the canonical native evidence path. It installs dependencies, typechecks mobile, generates the Android project with Expo prebuild, runs Gradle assembleRelease, verifies the packaged JavaScript bundle and uploads the standalone release APK.

A fresh post-merge native run is still required after the multilingual/local-first main changes.

## Local runtime validation

The canonical development data plane is local PostgreSQL via docker-compose.local.yml.

Still environment-bound:
- local PostgreSQL startup and Prisma migration execution on the user's laptop;
- one real global Open Prices collection;
- observed 195-country coverage report;
- laptop-local daily scheduler lifecycle.

These are not implied green by GitHub CI.

## Physical-device validation

Still environment-bound:
- Android/iOS locale persistence and RTL rendering;
- representative locale translation input/output;
- locale-specific TTS voice availability;
- translation-model availability;
- dynamic-content localization behavior;
- real notification delivery;
- microphone/location/speech runtime behavior.

## Release/deployment boundary

VPS deployment, production PostgreSQL configuration, production secrets, external push-provider configuration and release observability remain intentionally deferred until the release phase.

Supabase is not part of the current canonical application architecture.

## Completion rule

A validation item is green only when implementation, relevant automated/runtime evidence and Project Brain documentation agree. Environment-limited items remain explicitly unvalidated until exercised in their target environment.
