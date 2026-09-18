# Repository Audit

Last updated: 2026-09-18
Review status: SOURCE-LEVEL AUDIT CLOSED / ENVIRONMENTAL VALIDATION REMAINS

## Scope and evidence

The 2026-09-11 source audit and subsequent remediation are represented by the Project Brain deep-reads, matrices, validation ledger and canonical findings appendix. Current main is the source of truth for runtime architecture; historical audit branches are evidence only until explicitly merged.

The source-level audit gates are closed for the recorded repository scope. The canonical findings appendix preserves all recoverable findings and marks remediated, withdrawn, reconciled and evidence-limited items explicitly.

## Current architecture boundary

- Backend: modular NestJS + Prisma.
- Database: PostgreSQL; local development uses docker-compose.local.yml.
- Mobile: Expo/React Native.
- Global daily prices: Open Prices daily collector with FAO FPMA as slower benchmark/reference data.
- Daily price scheduler: laptop-local Node scheduler; no cloud scheduler is part of the current development architecture.
- Supabase: not a current application dependency.
- VPS: deferred to the release phase.

## Current source-level security/remediation state

The canonical findings appendix records the completed auth/session, runtime DTO, ownership, transaction, recipe/media, price-intelligence, mobile transport and native-build remediation work. PB-156 through PB-270 have explicit current statuses; no finding is silently treated as green solely from its historical label.

## Current CI evidence

Current main Backend CI run 35318539437 is GREEN through Prisma validation/generation, migrations and idempotence, food-intelligence self-test, backend build, unit tests and API E2E.

Current main Mobile CI run 35318539524 is GREEN through frozen-lockfile installation, typecheck, source tests, committed Jest specs, Expo validation and Android JavaScript bundling.

A fresh Android native APK run after the multilingual/local-first merge is still an environment/repository-evidence gate. The canonical workflow is .github/workflows/android-apk.yml.

## Remaining validation boundaries

- Local PostgreSQL startup and Prisma migration execution on the user's laptop.
- One real local global-price collection plus observed 195-country coverage.
- Laptop-local scheduler lifecycle across restart/sleep conditions.
- Native Android APK build after current-main changes.
- Physical Android/iOS locale, RTL, translation-model, TTS and dynamic-content validation.
- Full 51-locale translation/TTS capability matrix on target devices.
- Real notification/microphone/location/speech runtime behavior.
- VPS/release deployment and production observability.

## Governance

New audit findings must be recorded in docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md with exact evidence and impact. Project Brain must be updated alongside implementation changes. Unavailable runtime or device evidence remains explicitly unvalidated rather than inferred.

## Historical note

The exact prose of PB-001 through PB-155 is not recoverable from the exposed audit history. The limitation is documented and no missing finding text is fabricated.
