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
- Polled canonical Android run `34770782835` instead of assuming an in-progress run was successful.
- Confirmed dependency installation, mobile typecheck and Expo native prebuild completed successfully.
- Inspected the Gradle failure and isolated the blocker to Expo SDK 53/pnpm autolinking generating legacy `expo.core.ExpoModulesPackage` in `PackageList.java`.
- Confirmed the canonical Android workflow performs real `expo prebuild` and Gradle `assembleDebug`; this is a genuine native evidence gate.
- The first public-hoisting-only remediation had already failed; escalated to `node-linker=hoisted` plus public hoisting patterns for Expo, React Native, `@react-native/*` and Metro.
- Committed the stronger `.npmrc` remediation as `fc35d0e7428b0ec19e54552eab6f91f5207f9c8b`.
- Recorded PB-268 as OPEN — REMEDIATION IN VERIFICATION; it cannot be marked green until a fresh native run produces the APK.
- Updated `12_OPEN_WORK.md`, `13_DECISION_LOG.md` and `15_AUDIT_FINDINGS_APPENDIX.md` with the evidence boundary and remediation decision.

## Current evidence boundary
- Backend CI: green on the verified remediation line.
- Mobile CI: green on the verified remediation line.
- Android native APK: latest attempted run reproduced PB-268; fresh verification is pending after the stronger pnpm layout fix.
- Production Supabase/Auth/RLS/Storage/edge controls and physical-device behavior remain explicitly environment-limited.
