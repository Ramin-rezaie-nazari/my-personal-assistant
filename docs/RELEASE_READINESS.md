# MYPA Release Readiness Matrix

Updated: 2026-09-06
Branch: `agent/mypa-autonomous-control-plane`

This document is an evidence-based release gate. It deliberately distinguishes repository readiness from environment/device/account validation.

## Status legend

- **GREEN** — validated with recorded evidence.
- **YELLOW** — implementation exists, but one or more required validations remain outstanding.
- **RED** — known blocker or failed release gate.
- **PENDING** — not executed in the current environment.

## Engineering gates

| Gate | Status | Evidence / remaining work |
|---|---|---|
| Backend typecheck/build | GREEN | Latest validated local checkpoint in `apps/backend/docs/05_CURRENT_STATE.md`. |
| Backend Jest regression suite | GREEN | Latest validated local checkpoint: 160 suites / 429 tests. |
| Recommendation Intelligence | GREEN | Focused tests + E2E recorded in current state. Mobile runtime remains pending. |
| Shopping ownership hardening | GREEN | Focused runtime regression recorded in current state. |
| Refresh-token rotation/replay protection | GREEN | Consume-before-issue flow implemented; replay rejection tests exist. |
| Refresh-token storage | YELLOW | New sessions store SHA-256 fingerprints; backward-compatible plaintext lookup remains for legacy rows and should be drained during migration/rotation. |
| Request rate limiting | YELLOW | Bounded in-process guard implemented; auth endpoints have tighter limits. Distributed production deployment still needs shared storage/routing policy. |
| DB migration discipline | YELLOW | Additive taxonomy/recipe/fitness migrations exist; runtime migration/status/idempotence validation must be executed against the local PostgreSQL stack. |
| Fitness catalog | YELLOW | Import/audit tooling exists, but full 1,500-movement / 6,000-WebP corpus is not runtime-verified in this environment. |
| Recipe corpus | YELLOW | Importer and presentation stack exist; full corpus import/audit is not runtime-verified here. |
| Global market/price intelligence | YELLOW | Price Intelligence code exists in the active project; live-source coverage and production scheduled execution still require market-by-market evidence. |
| Mobile localization | YELLOW | Reactive locale architecture + top-level rollout implemented; nested UI audit and runtime validation remain. |
| Theme system | YELLOW | Default/feminine theme foundation is implemented; full UI token rollout and device validation remain. |
| Mobile API production endpoint | GREEN | Production mobile builds fail closed when `EXPO_PUBLIC_API_URL` is absent. |
| Device/wearable integration contract | GREEN | Provider-neutral normalized health contract and protected integration-status endpoint are implemented; no synthetic health values are emitted while native providers are unavailable. |
| Native health providers | RED / PENDING | iOS HealthKit and Android Health Connect bridges, permissions, incremental sync, dedupe, and physical-device validation are not yet configured. |
| Android native voice/TTS | RED | Known Persian local-voice native SIGABRT remains; physical-device root-cause and regression validation required. |
| Yoga camera / pose provider | RED | Camera bridge is still unconfigured; no production pose provider is connected and validated. |
| Mobile release build | RED / PENDING | Historical Android Gradle failure reproduced `expo.core.ExpoModulesPackage`; corrected hoisted-linking configuration is staged but a completed green release build + artifact verification is still required. Recent Android workflow attempts also failed during dependency installation, so the build gate remains red until a successful run is evidenced. |
| Physical Android smoke test | PENDING | Required: install release artifact, cold/warm launch, permissions, auth, onboarding, main food flow, voice lifecycle, background/foreground. |
| Physical iOS smoke test | PENDING | Required before claiming cross-platform release readiness. |
| Observability | YELLOW | Health checks exist; structured production metrics/crash reporting and operational dashboards are not yet fully validated. |
| Backup/restore + disaster recovery | PENDING | Must be validated in the eventual production PostgreSQL/VPS environment. |
| Production secrets/config | YELLOW | Repository configuration is fail-closed for missing production JWT secrets; production secret storage and deployment environment are still external gates. |
| Scalability | YELLOW | Architecture is designed toward scale, but no credible 100k-user load test has been executed here. |

## Play Store gates

These gates cannot be completed by source changes alone:

1. A valid Google Play Console developer/account setup.
2. Release signing credentials / keystore configured in the deployment environment.
3. Successful EAS/Gradle release build and installable artifact verification.
4. Real Android smoke testing on at least one representative physical device.
5. Final privacy/data-safety declarations based on the shipped production data flows.
6. Production backend/API endpoint and database deployed and verified.
7. Store metadata, screenshots, icon/adaptive icon, content rating, and policy declarations completed in Play Console.

## Current release decision

**Do not label the repository `Play Store Ready` yet.**

The codebase has substantial production-ready foundations, but the remaining RED/PENDING gates are external/runtime release blockers rather than documentation-only gaps.

## Smallest human-required release actions

When the code-side gates are exhausted, the remaining human/device work is:

- run the documented local validation commands against the developer Mac PostgreSQL stack;
- produce and install the Android release artifact;
- execute physical Android/iOS smoke tests;
- validate Persian TTS candidates and voice lifecycle on-device;
- configure production PostgreSQL/VPS, secrets, signing and Play Console;
- complete final store policy/data-safety declarations.
