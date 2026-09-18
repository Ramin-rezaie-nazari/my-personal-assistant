# Project Brain Changelog

Last updated: 2026-09-18
Review status: PRE-DEVICE ENGINEERING GATES GREEN / PHYSICAL-DEVICE VALIDATION REMAINS

## 2026-09-11 — BATCH-0001 through BATCH-0013
- Initialized durable Project Brain and completed the enumerated Core, Prisma/migration, Assistant/Brain, Food/Recipe/Nutrition/Meals, Shopping/Inventory/Price, Life/Health/Fitness, Platform/Test/CI, Mobile, operational-script and historical branch/PR audit scopes.
- Reconciled PB-156 through PB-257, with false positives, duplicates and withdrawn findings explicitly recorded.

## 2026-09-13 — REMEDIATION / HARDENING PASS
- Merged the major remediation line and reconciled Project Brain against actual `main` behavior.
- Fixed missing `shopping.dto.ts` and hardened runtime DTO validation across Fitness, Shopping, Inventory, Daily Tracking, Habits, Assistant confirmation, Price Intelligence, Personal Brain, User Intelligence, Recommendation Intelligence, Yoga, Calisthenics, Calendar, Decision Feedback and Memory Intelligence.
- Replaced Fitness persistence timestamp IDs with UUIDs.
- Hardened recipe inventory matching with dimension-aware unit conversion and incompatible-unit rejection; added regression coverage.
- Fixed Personal Brain runtime DI metadata for `DecisionExecutionCoordinatorService`.
- Moved mobile brain-execution credentials from AsyncStorage to `expo-secure-store` with device-only keychain accessibility and refresh-failure cleanup.
- Removed duplicate Android/EAS workflows and kept the canonical APK path.
- Recorded PB-258 through PB-267 as CLOSED — REMEDIATED.
- Backend and Mobile CI reached green verification lines through their documented stages.

## 2026-09-13 — NATIVE ANDROID VERIFICATION PASS
- Polled canonical Android run `34770782835` through failure rather than assuming an in-progress run was successful.
- Confirmed dependency installation, mobile typecheck and Expo native prebuild completed successfully.
- Inspected the Gradle failure and isolated the blocker to Expo SDK 53/pnpm autolinking generating legacy `expo.core.ExpoModulesPackage` in `PackageList.java`.
- Escalated from the first public-hoisting-only remediation to `node-linker=hoisted` plus public hoisting patterns for Expo, React Native, `@react-native/*` and Metro.
- Committed the stronger `.npmrc` remediation as `fc35d0e7428b0ec19e54552eab6f91f5207f9c8b`.
- Added `apps/mobile/react-native.config.js` to explicitly pin Expo Android `packageImportPath` to `import expo.modules.ExpoModulesPackage;`.
- Fresh canonical Android run `34772364209` on `0d19d2b7dad5e9100505205328fbd523e544445b` completed successfully through real Gradle `assembleDebug` and APK artifact upload.
- Closed PB-268 as CLOSED — REMEDIATED with artifact `my-personal-assistant-debug-apk`, 58,443,390 bytes, SHA-256 `622b90eeef0898ab7d3eac9af75fac6e486da46eb4f741116d601f3d727f23da`.
- Synchronized `12_OPEN_WORK.md`, `05_CURRENT_STATE.md`, `10_SECURITY_AND_PRIVACY.md` and `15_AUDIT_FINDINGS_APPENDIX.md` with the new native evidence.

## 2026-09-13 — FINAL MOBILE AUDIT RECONCILIATION
- Re-audited the repository for `TODO`, `FIXME` and `@ts-ignore`; no `FIXME` or `@ts-ignore` matches remain, and the only `TODO` hit is an intentional dataset-script field name rather than an unfinished code marker.
- Audited `AsyncStorage` usage and confirmed current authentication credentials are handled by `expo-secure-store`; remaining AsyncStorage usage is for non-credential local state such as onboarding, push-registration device state and locale persistence.
- Reclassified `docs/project-brain/03_MOBILE_FEATURE_CATALOG.md` as a historical audit baseline so its old per-feature `OPEN_GAP` labels cannot be mistaken for current blockers, and corrected its authentication-storage note to reflect the current SecureStore implementation.
- Checked open GitHub issues; the only open issue is the older P0 Sherpa-ONNX Android voice-crash investigation. Current `main` no longer contains the referenced `react-native-sherpa-onnx`/local Persian TTS implementation, so this remains a legacy/device-history item rather than a repository blocker and was not silently closed.

## 2026-09-18 — Pre-device engineering gate closure
- Merged PR #92: Yoga/Supplements multilingual UI remediation (PB-272).
- Merged PR #93: onboarding/auth multilingual UI remediation (PB-274).
- Merged PR #95: shared locale hook across major food/shopping/insights routes (PB-275).
- Merged PR #96: Project Brain baseline synchronization.
- Merged PR #97: Smart Planning canonical legacy-fallback remediation (PB-276) with Backend CI verification.
- Local laptop error-only validator completed successfully on 2026-09-18; no error output.
- Current pre-device engineering gate is green; physical-device validation remains the next product gate.

## Current evidence boundary
- Backend CI: green on the verified remediation line.
- Mobile CI: green on the verified remediation line.
- Android native APK: green on run `34772364209` against commit `0d19d2b7dad5e9100505205328fbd523e544445b`.
- Production Supabase/Auth/RLS/Storage/edge controls and physical-device behavior remain explicitly environment-limited.