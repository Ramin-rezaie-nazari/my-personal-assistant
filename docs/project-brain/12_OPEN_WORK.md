# MYPA Open Work

Last updated: 2026-09-17
Status: MULTILINGUAL FOUNDATION IMPLEMENTED / FRESH CI + DEVICE VERIFICATION REQUIRED

This file contains currently actionable work and evidence gaps. Historical audit observations remain preserved in `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md` and dated continuation documents.

## Current repository work — multilingual feature slice

The Global Multilingual Assistant foundation is implemented in source and documented in `docs/project-brain/18_GLOBAL_MULTILINGUAL_ASSISTANT.md`. The remaining repository-side verification is to run fresh CI after the current commits and resolve any typecheck/source/native failures that appear.

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

1. **Fresh Mobile CI:** run mobile typecheck/source tests after the multilingual commits.
2. **Fresh Backend CI:** run backend build/unit/E2E after canonical response changes.
3. **Native Android verification:** build the canonical APK after the multilingual changes and verify the custom translation module still autolinks correctly.
4. **Physical Android/iOS device validation:** test representative locales from Latin, Cyrillic, Arabic-script and Indic families; verify locale persistence, RTL, input translation, response translation, TTS voice selection and no unexpected fallback language.
5. **Full 51-locale matrix:** verify translation-model and TTS availability per target OS/device and record explicit unsupported combinations rather than silently substituting another language.
6. **Repository-wide UI audit:** continue replacing remaining route/component hard-coded UI strings with the shared locale layer, especially older screens that predate the current localization work.

## Existing environment-bound work

- Production deployment validation for Auth/RLS/Storage/API connectivity and observability.
- Real notification delivery and background/foreground lifecycle behavior.
- Real microphone/location/speech behavior on physical devices.
- Production exercise dataset/media approval and ingestion.

## Completion rule

A multilingual work item is green only after implementation, relevant automated validation and documentation agree. Device/OS capability is not treated as verified until exercised and recorded on a real device.

## Global Daily Price Intelligence

Status: IMPLEMENTED / FRESH CI + PRODUCTION ACTIVATION REQUIRED

Implemented repository-side:
- Open Prices global daily feed with bounded recent ingestion.
- FAO FPMA slower benchmark feed.
- Country-native currency preservation.
- Daily source routing excludes monthly sources.
- 195-country daily coverage reporting with fresh/stale/no_data states.
- Dedicated public GitHub Actions daily scheduler.

Verification remaining:
1. Fresh Backend CI after the latest hardening.
2. Merge/activate the workflow on the default branch.
3. Configure production `DATABASE_URL` as a GitHub Actions secret.
4. Run one real collection and review the 195-country coverage output.
5. Add required Open Prices/ODbL attribution wherever its data is exposed in user-facing UI.