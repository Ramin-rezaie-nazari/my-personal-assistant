# Test and Validation Matrix

Last updated: 2026-09-13
Review status: FINAL VERIFICATION / EVIDENCE-LIMITED DEPLOYMENT ITEMS REMAIN

## Automated repository evidence

### Backend CI — GREEN

The verified Backend CI line covers frozen dependency installation, Prisma schema validation/generation, migration deployment and idempotence, food-intelligence self-test, backend build, unit tests and API E2E tests.

### Mobile CI — GREEN

The verified Mobile CI line covers frozen-lockfile installation, mobile typecheck, source smoke tests, committed Jest specs, Expo validation and Android JavaScript bundling.

### Canonical Android native build

`.github/workflows/android-apk.yml` is the canonical native evidence path. It installs dependencies, typechecks mobile, generates the Android project with Expo prebuild, runs Gradle `assembleDebug`, and uploads the debug APK artifact.

The current verification run is the active native evidence candidate. Its final conclusion must be recorded before claiming latest-main native green.

## Environment-limited validation

The following are not proven by repository CI alone:

- physical-device UX and offline/device behavior
- real push notification delivery
- microphone/location/speech runtime behavior on a physical device
- production Supabase/Postgres RLS, Storage and service-role configuration
- production edge controls and runtime logging/exception disclosure

## Completion rule

A validation item is green only when implementation, relevant automated/runtime evidence and Project Brain documentation agree. Environment-limited items remain explicitly unvalidated until exercised in their target environment.
