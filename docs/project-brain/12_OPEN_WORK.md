# MYPA Open Work

Last updated: 2026-09-19
Status: REPOSITORY PRE-DEVICE WORK CLOSED / DEVICE + ENVIRONMENT EXECUTION PENDING

This file contains currently actionable work and evidence gaps. Historical audit observations remain preserved in docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md and dated continuation documents.

## Current repository work — multilingual feature slice

The Global Multilingual Assistant foundation is implemented. Current main source/CI work through PR #101 is green; there are no known repository-side implementation/audit gaps. Remaining validation is execution-bound to the laptop, native build/device and release environments.

### Implemented

- Canonical 51-language base registry remains the product language set.
- Iranian Azerbaijani Turkish is a separate regional locale (az) and Turkish (Türkiye) remains tr.
- Mobile locale selection persists the selected language and exposes the regional variant without replacing the 51-language base count.
- Bidirectional mobile translation bridge exists for assistant input/output.
- Assistant chat translates selected-locale input to the canonical assistant language before Brain processing and localizes responses back before rendering.
- Assistant TTS follows the selected application locale with locale-specific BCP-47 speech tags.
- Local backend assistant responses are canonical English to prevent foreign-language leakage.
- Open Prices attribution is now shown in the price-history UI with a source link; the attribution must still be confirmed in the built app/device.
- UI/i18n audit slices PB-272 through PB-279 are remediated and merged; the automated 51-language contract checks are green. Device-specific locale/TTS capability remains environment-bound.

## Verification still required

1. Fresh post-PR #101 Android native APK evidence: run the canonical `.github/workflows/android-apk.yml` gate against current `main`.
2. Physical Android/iOS device validation: test representative Latin, Cyrillic, Arabic-script and Indic locales; verify locale persistence, RTL, translation input/output, TTS voice selection and no unexpected fallback language.
3. Full 51-locale matrix: verify translation-model and TTS availability per target OS/device and record unsupported combinations explicitly.
4. Laptop-only operational evidence: record the observed 195-country Open Prices coverage and exercise scheduler restart/sleep lifecycle.

## Existing environment-bound work

- Local PostgreSQL startup and Prisma migration execution: completed by the laptop validation runner.
- One real local global-price collection: completed by the laptop validation runner; observed 195-country coverage is still not numerically recorded.
- Laptop-local scheduler lifecycle validation across restart/sleep conditions.
- Production deployment validation for Auth/RLS/Storage/API connectivity and observability.
- Real notification delivery and background/foreground lifecycle behavior.
- Real microphone/location/speech behavior on physical devices.
- Production exercise dataset/media approval and ingestion.

## Global Daily Price Intelligence

Status: IMPLEMENTED / REPOSITORY + LOCAL RUNTIME VERIFIED; OBSERVED COVERAGE MEASUREMENT REMAINS ENVIRONMENT-BOUND

Implemented repository-side:
- Open Prices daily feed with bounded recent ingestion.
- FAO FPMA slower benchmark feed.
- Country-native currency preservation.
- Daily source routing excludes monthly sources.
- 195-country coverage reporting with fresh/stale/no_data states.
- Laptop-local daily scheduler with configurable local execution time.
- Persistent local PostgreSQL via docker-compose.local.yml.
- No Supabase dependency and no cloud scheduler in the canonical development path.
- Open Prices/ODbL source attribution in the price-history screen.

Verification remaining:
1. Record the observed 195-country Open Prices coverage numerically from the laptop's real collection output.
2. Confirm the Open Prices/ODbL attribution in the built mobile app during device validation.
3. Validate the monthly FPMA collector locally when benchmark data is needed.
4. Keep provider coverage truthful: no fresh observation remains no_data or stale; no fabricated prices.

## Infrastructure direction

- Development: local PostgreSQL + local Node scheduler on the laptop.
- Release: move the same PostgreSQL/Prisma architecture to a VPS.
- CI: ephemeral PostgreSQL is acceptable for automated tests only.
- Supabase: explicitly out of the canonical application architecture.
