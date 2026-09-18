# MYPA Open Work

Last updated: 2026-09-18
Status: MULTILINGUAL FOUNDATION IMPLEMENTED / NATIVE + DEVICE VERIFICATION REQUIRED

This file contains currently actionable work and evidence gaps. Historical audit observations remain preserved in `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md` and dated continuation documents.

## Current repository work — multilingual feature slice

The Global Multilingual Assistant foundation is implemented in source and documented in `docs/project-brain/18_GLOBAL_MULTILINGUAL_ASSISTANT.md`. Fresh main-branch Backend CI (`35318539437`) and Mobile CI (`35318539524`) are green; remaining validation is native APK/device capability rather than source/CI health.

### Implemented

- Canonical 51-language base registry remains the product language set.
- Iranian Azerbaijani Turkish is a separate regional locale (`az`) and Turkish (Türkiye) remains `tr`.
- Mobile locale selection persists the selected language and exposes the regional variant without replacing the 51-language base count.
- Bidirectional mobile translation bridge exists for assistant input/output.
- Assistant chat translates selected-locale input into the canonical assistant language before Brain processing and localizes the response back into the selected locale.
- Assistant TTS follows the selected application locale with locale-specific BCP-47 speech tags.
- Local backend assistant responses are now canonical English instead of hard-coded Persian, preventing foreign-language leakage from the local provider into another selected locale.
- The new architecture and evidence boundary are documented in `18_GLOBAL_MULTILINGUAL_ASSISTANT.md` and `docs/05_CURRENT_STATE.md`.

## Verification still required

1. **Native Android verification:** build the canonical APK after the multilingual changes and verify the custom translation module still autolinks correctly.
2. **Physical Android/iOS device validation:** test representative locales from Latin, Cyrillic, Arabic-script and Indic families; verify locale persistence, RTL, input translation, response translation, TTS voice selection and no unexpected fallback language.
3. **Full 51-locale matrix:** verify translation-model and TTS availability per target OS/device and record explicit unsupported combinations rather than silently substituting another language.
4. **Repository-wide UI audit:** continue replacing remaining route/component hard-coded UI strings with the shared locale layer, especially older screens that predate the current localization work.

## Existing environment-bound work

- Production deployment validation for Auth/RLS/Storage/API connectivity and observability.
- Real notification delivery and background/foreground lifecycle behavior.
- Real microphone/location/speech behavior on physical devices.
- Production exercise dataset/media approval and ingestion.

## Completion rule

A multilingual work item is green only after implementation, relevant automated validation and documentation agree. Device/OS capability is not treated as verified until exercised and recorded on a real device.

## Global Daily Price Intelligence

Status: IMPLEMENTED / LOCAL RUNTIME VERIFICATION REQUIRED

Implemented repository-side:
- Open Prices global daily feed with bounded recent ingestion.
- FAO FPMA slower benchmark feed.
- Country-native currency preservation.
- Daily source routing excludes monthly sources.
- 195-country daily coverage reporting with fresh/stale/no_data states.
- Laptop-local daily scheduler with configurable local execution time.
- Persistent local PostgreSQL via `docker-compose.local.yml`.
- No Supabase dependency and no cloud scheduler in the canonical development path.

Verification remaining:
1. Run the local PostgreSQL container and apply Prisma migrations on the development laptop.
2. Run one real local global-price collection and record the observed 195-country coverage.
3. Add required Open Prices/ODbL attribution wherever its data is exposed in user-facing UI.
4. Validate the monthly FPMA collector locally when the benchmark feed is needed.
5. Keep provider coverage truthful: a country with no fresh observation remains `no_data` or `stale`; values must not be fabricated.

## Infrastructure direction

- Development: local PostgreSQL + local Node scheduler on the laptop.
- Release: move the same PostgreSQL/Prisma architecture to a VPS.
- CI: ephemeral PostgreSQL is acceptable for automated tests only.
- Supabase: explicitly out of the canonical application architecture.
