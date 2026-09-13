# Project Brain Changelog

Last updated: 2026-09-13
Review status: FINAL VERIFICATION / EVIDENCE-LIMITED DEPLOYMENT ITEMS REMAIN

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

## Current evidence boundary
- Backend CI: green on the verified remediation line.
- Mobile CI: green on the verified remediation line.
- Android native APK: green on run `34772364209` against commit `0d19d2b7dad5e9100505205328fbd523e544445b`.
- Production Supabase/Auth/RLS/Storage/edge controls and physical-device behavior remain explicitly environment-limited.