# MYPA Open Work

Last updated: 2026-09-13
Status: FINAL VERIFICATION / ONLY ENVIRONMENT-LIMITED EVIDENCE REMAINS

This file contains only currently actionable work/evidence gaps. Historical audit observations are preserved in `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md` and dated deep-read/audit continuation documents; an old OPEN label in a historical catalog is not evidence that the defect still exists.

## Remaining work — repository work is complete

The repository implementation, automated validation, native Android build verification and Project Brain reconciliation are complete for this audit/remediation pass. There are no currently identified repository-side blockers that can be responsibly closed with more source edits alone.

The remaining items are environment-bound and should be validated in the next mobile/production test phase:

1. **Physical Android/iOS device validation:** complete the real user journeys and verify startup/navigation, authentication/session refresh, core daily flows, loading/error states, camera/location/microphone/speech permissions, voice/TTS behavior, notifications, background/foreground transitions and representative data mutations.
2. **Production environment validation:** verify deployed Supabase/Auth/RLS/Storage configuration, production API connectivity, edge/security controls, real notification delivery and production observability/error disclosure behavior.
3. **Final evidence capture:** record device/production results in Project Brain and only then promote those capabilities from environment-limited to verified.

## Automated evidence already green

- Backend CI is green through dependency installation, Prisma validation/generation, migration deployment/idempotence, food-intelligence self-test, backend build, unit tests and API E2E.
- Mobile CI is green through frozen-lockfile installation, typecheck, source tests, committed Jest specs, Expo validation and Android JavaScript bundling.
- Canonical Android native APK CI is green on `main` commit `0d19d2b7dad5e9100505205328fbd523e544445b`; workflow run `34772364209` completed through Expo prebuild, real Gradle `assembleDebug` and APK upload. Artifact: `my-personal-assistant-debug-apk`, 58,443,390 bytes, SHA-256 `622b90eeef0898ab7d3eac9af75fac6e486da46eb4f741116d601f3d727f23da`.

## Remediation ledger — closed

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
- PB-258 through PB-268 are recorded as CLOSED — REMEDIATED in the canonical findings appendix.

## 2026-09-13 native-build remediation pass — CLOSED

- The earlier canonical Android run `34770782835` was polled through failure and its Gradle evidence isolated the native blocker to React Native autolinking generating `import expo.core.ExpoModulesPackage;` instead of Expo SDK 53's modern `expo.modules.ExpoModulesPackage`.
- The repository pnpm layout was strengthened with `node-linker=hoisted` plus public hoisting for Expo, React Native, `@react-native/*`, and Metro packages in commit `fc35d0e7428b0ec19e54552eab6f91f5207f9c8b`.
- A direct React Native CLI configuration override was added in `apps/mobile/react-native.config.js` to pin Expo Android `packageImportPath` to `import expo.modules.ExpoModulesPackage;`.
- Fresh native workflow run `34772364209` on commit `0d19d2b7dad5e9100505205328fbd523e544445b` completed successfully, including real Gradle APK build and artifact upload. This closes the native autolinking finding at repository-CI level.

## Completion rule

A work item is green only after implementation, relevant automated validation and documentation are consistent. Device/production evidence stays explicitly unvalidated until exercised outside repository CI.
