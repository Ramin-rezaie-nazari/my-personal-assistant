# Test and Validation Matrix

Last updated: 2026-09-18
Review status: PRE-DEVICE ENGINEERING GATES GREEN / PHYSICAL-DEVICE VALIDATION REQUIRED

## Automated repository evidence

### Backend CI — GREEN

Current main Backend CI run 35318539437 completed successfully through frozen dependency installation, Prisma schema validation/generation, migration deployment and idempotence, food-intelligence self-test, backend build, backend unit tests and backend API E2E.

### Mobile CI — GREEN

Current main Mobile CI run 35318539524 completed successfully through frozen-lockfile installation, mobile typecheck, source tests, committed Jest specs, Expo validation and Android JavaScript bundling.

### Canonical Android native build

.github/workflows/android-apk.yml is the canonical native evidence path. It installs dependencies, typechecks mobile, generates the Android project with Expo prebuild, runs Gradle assembleRelease, verifies the packaged JavaScript bundle and uploads the standalone release APK.

Repository native evidence is green on run `34772364209`, and the user's latest local error-only validator also completed the Android release Gradle build with no error output. A post-merge push-triggered native run is not exposed by the current GitHub connector, so it is not claimed as additional evidence.

## Local runtime validation

The canonical development data plane is local PostgreSQL via docker-compose.local.yml.

The user's 2026-09-18 error-only validation run completed local PostgreSQL startup, Prisma generation/migrations, backend build/tests, one global price collection, mobile checks and Android release build with no error output. The validator intentionally suppresses successful numeric coverage output, so the exact observed 195-country coverage is not recorded in the repository.

Remaining operational validation is scheduler lifecycle across restart/sleep and production/VPS deployment behavior; these are post-device operational gates, not blockers to beginning physical mobile testing.

## Physical-device validation

This is the remaining product-validation gate:
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

All repository/source/CI/local engineering gates required before physical mobile testing are green based on current evidence. Only physical-device behavior remains in the product validation gate; operational production/VPS work remains a separate release phase.
