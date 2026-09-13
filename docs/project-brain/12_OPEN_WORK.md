# MYPA Open Work

Last updated: 2026-09-13
Status: FINAL VERIFICATION / EVIDENCE-LIMITED ITEMS REMAIN

This file contains only currently actionable work. Historical audit observations are preserved in `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md` and dated deep-read/audit continuation documents; an old OPEN label in a historical catalog is not evidence that the defect still exists.

## Current blockers / evidence gaps

1. Verify the canonical Android APK workflow against the latest `main`. The latest verified native run reached Gradle and reproduced the same Expo SDK 53 autolinking failure: generated `PackageList.java` imports legacy `expo.core.ExpoModulesPackage`. The remediation line now strengthens pnpm hoisting with `node-linker=hoisted` plus Expo/React Native/Metro public-hoist patterns; a fresh native run is required before this item can be closed.
2. Real physical-device UX, notification delivery, microphone/location/speech behavior and production deployment behavior remain environment-limited until exercised in those environments.
3. Production Supabase/Auth/RLS/Storage configuration cannot be claimed from repository-only evidence; repository-level authentication and database/session behavior are validated where CI covers them.
4. Keep Project Brain synchronized with the latest verified commit and CI evidence; never mark device or production capabilities green without direct evidence.

## Verified remediation completed

- Backend CI is green on the latest verification line through dependency installation, Prisma validation/generation, migration deployment/idempotence, food-intelligence self-test, backend build, unit tests and API E2E.
- Mobile CI is green on the latest verification line through frozen-lockfile installation, typecheck, source tests, committed Jest specs, Expo validation and Android JavaScript bundling.
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

## 2026-09-13 native-build remediation pass

- Polled the canonical Android run `34770782835` through completion instead of treating its in-progress state as success.
- Confirmed Install, mobile typecheck and Expo native prebuild were green.
- Inspected the full failed Gradle evidence and isolated the remaining native blocker to React Native autolinking generating `import expo.core.ExpoModulesPackage;` instead of Expo SDK 53's modern `expo.modules.ExpoModulesPackage`.
- Confirmed the failure is the known Expo SDK 53/pnpm autolinking class of issue and that the Expo package's own Android React Native config explicitly supplies the modern `packageImportPath`.
- Strengthened the repository pnpm layout from only `node-linker=hoisted` to `node-linker=hoisted` plus public hoisting for Expo, React Native, `@react-native/*`, and Metro packages so package-owned React Native configs can resolve through the standard Node module layout.
- This remediation was committed to `main` as `fc35d0e7428b0ec19e54552eab6f91f5207f9c8b`; the resulting native workflow is now the next required evidence gate.

## Completion rule

A work item is green only after implementation, relevant automated validation and documentation are consistent. Device/production evidence stays explicitly unvalidated until exercised outside repository CI.
