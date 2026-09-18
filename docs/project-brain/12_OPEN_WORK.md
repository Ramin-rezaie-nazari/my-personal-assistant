# MYPA Open Work

Last updated: 2026-09-18
Status: PRE-DEVICE ENGINEERING GATES GREEN / PHYSICAL DEVICE VALIDATION REQUIRED

This file contains currently actionable work and evidence gaps. Historical audit observations remain preserved in docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md and dated continuation documents.

## Current repository work — multilingual feature slice

The Global Multilingual Assistant foundation and the pre-device engineering remediation pass are implemented. Current source/CI evidence is green, including PR #97 Backend CI run 35377244969; remaining product validation is the physical device gate.

### Implemented

- Canonical 51-language base registry remains the product language set.
- Iranian Azerbaijani Turkish is a separate regional locale (az) and Turkish (Türkiye) remains tr.
- Mobile locale selection persists the selected language and exposes the regional variant without replacing the 51-language base count.
- Bidirectional mobile translation bridge exists for assistant input/output.
- Assistant chat translates selected-locale input to the canonical assistant language before Brain processing and localizes responses back before rendering.
- Assistant TTS follows the selected application locale with locale-specific BCP-47 speech tags.
- Local backend assistant responses are canonical English to prevent foreign-language leakage.
- Open Prices attribution is now shown in the price-history UI with a source link; the attribution must still be confirmed in the built app/device.
- UI/i18n audit slices PB-272 through PB-275 are remediated and CI-verified; the repository-wide audit has no known pre-device blocker.

## Verification still required

1. Native Android verification: CLOSED — repository native evidence is green on run 34772364209 and the user's local error-only validator completed Expo prebuild and Android release Gradle build with no error output.
2. Physical Android/iOS device validation: test representative Latin, Cyrillic, Arabic-script and Indic locales; verify locale persistence, RTL, translation input/output, TTS voice selection and no unexpected fallback language.
3. Full 51-locale matrix: verify translation-model and TTS availability per target OS/device and record unsupported combinations explicitly.
4. Repository-wide UI audit: source audit is green for the current known slices PB-272 through PB-275; newly discovered isolated locale surfaces should be remediated before release.

## Remaining after the physical mobile gate

- Local scheduler lifecycle validation across restart/sleep conditions.
- Exact observed 195-country Open Prices coverage reporting from a non-error-only run.
- Production deployment validation for Auth/RLS/Storage/API connectivity and observability.
- Real notification delivery and background/foreground lifecycle behavior.
- Production exercise dataset/media approval and ingestion.

## Global Daily Price Intelligence

Status: IMPLEMENTED / LOCAL RUNTIME VERIFIED; COVERAGE MEASUREMENT STILL REQUIRED

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

Verification remaining before release:
1. Physical Android/iOS validation and full 51-locale device matrix.
2. Confirm the Open Prices/ODbL attribution visually during the same mobile pass.

Operational follow-up after device validation:
- record numerical 195-country coverage from a non-error-only local price run;
- validate the monthly FPMA collector when benchmark data is needed;
- validate scheduler restart/sleep lifecycle and release deployment.

## Infrastructure direction

- Development: local PostgreSQL + local Node scheduler on the laptop.
- Release: move the same PostgreSQL/Prisma architecture to a VPS.
- CI: ephemeral PostgreSQL is acceptable for automated tests only.
- Supabase: explicitly out of the canonical application architecture.
