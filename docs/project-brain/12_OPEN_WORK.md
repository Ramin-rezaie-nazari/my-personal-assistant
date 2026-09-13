# MYPA Open Work

Last updated: 2026-09-13
Status: FINAL VERIFICATION / EVIDENCE-LIMITED DEPLOYMENT ITEMS REMAIN

This file contains only currently actionable work. Historical audit observations are preserved in `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md` and dated deep-read/audit continuation documents; an old OPEN label in a historical catalog is not evidence that the defect still exists.

## Current blockers / evidence gaps

1. Canonical Android APK native verification is now GREEN on `main` commit `0d19d2b7dad5e9100505205328fbd523e544445b`: workflow run `34772364209` completed successfully through Expo prebuild, real Gradle `assembleDebug`, APK upload, and produced artifact `my-personal-assistant-debug-apk` (58,443,390 bytes; SHA-256 `622b90eeef0898ab7d3eac9af75fac6e486da46eb4f741116d601f3d727f23da`). The Android native build is therefore no longer an open repository evidence gap.
2. Real physical-device UX, notification delivery, microphone/location/speech behavior and production deployment behavior remain environment-limited until exercised in those environments.
3. Production Supabase/Auth/RLS/Storage configuration cannot be claimed from repository-only evidence; repository-level authentication and database/session behavior are validated where CI covers them.
4. Keep Project Brain synchronized with the latest verified commit and CI evidence; never mark device or production capabilities green without direct evidence.

## Verified remediation completed

- Backend CI is green on the latest verification line through dependency installation, Prisma validation/generation, migration deployment/idempotence, food-intelligence self-test, backend build, unit tests and API E2E.
- Mobile CI is green on the latest verification line through frozen-lockfile installation, typecheck, source tests, committed Jest specs, Expo validation and Android JavaScript bundling.
- Canonical Android native APK CI is green on the latest remediation commit `0d19d2b7dad5e9100505205328fbd523e544445b`; the real Gradle build and APK upload both succeeded.
- Frozen pnpm lockfile dependency graph is aligned.
- Duplicate Android/EAS workflows were removed, leaving canonical workflows.
- Fitness profile/goal/equipment controller writes use nested runtime-validated DTOs and authenticated `user.id`.
- Shopping, inventory, daily tracking and habit write inputs have runtime validation.
- Assistant confirmation uses a validated DTO.
- Recipe update uses a validated update DTO.
- Price Intelligence write endpoints use validated DTOs; HTTP price normalization preserves currency semantics and currency-aware deduplication.
- Fitness natural-goal parsing uses UUID-compatible IDs and normalized Persian text handling.
- Personal Brain, Yoga, Calisthenics, Calendar, User Intelligence, Recommendation Intelligence, Decision Feedback and Memory Intelligence action boundaries use runtime DTO validation.
- Recipe inventory matching is unit-aware for compatible metric dimensions and rejects incompatible units.
- Personal Brain application bootstrap resolves `DecisionExecutionCoordinatorService` through runtime DI metadata.
- Mobile brain-execution credentials use `expo-secure-store` rather than AsyncStorage.

## 2026-09-13 native-build remediation pass — CLOSED

- The earlier canonical Android run `34770782835` was polled through failure and its Gradle evidence isolated the remaining native blocker to React Native autolinking generating `import expo.core.ExpoModulesPackage;` instead of Expo SDK 53's modern `expo.modules.ExpoModulesPackage`.
- The repository pnpm layout was strengthened with `node-linker=hoisted` plus public hoisting for Expo, React Native, `@react-native/*`, and Metro packages in commit `fc35d0e7428b0ec19e54552eab6f91f5207f9c8b`.
- A direct React Native CLI configuration override was then added in `apps/mobile/react-native.config.js` to pin Expo Android `packageImportPath` to `import expo.modules.ExpoModulesPackage;`.
- Fresh native workflow run `34772364209` on commit `0d19d2b7dad5e9100505205328fbd523e544445b` completed successfully, including real Gradle APK build and artifact upload. This closes the native autolinking finding at repository-CI level.

## Completion rule

A work item is green only after implementation, relevant automated validation and documentation are consistent. Device/production evidence stays explicitly unvalidated until exercised outside repository CI.