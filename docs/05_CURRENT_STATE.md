# MYPA Current State

Last updated: 2026-09-14
Review status: FITNESS EXERCISE CONTENT/MEDIA FOUNDATION IMPLEMENTED / RUNTIME VERIFICATION PENDING

## Canonical ownership

This root file is the canonical repository-wide current-state document. `apps/backend/docs/05_CURRENT_STATE.md` is a compatibility pointer and must not contain a competing project-state snapshot.

## Repository state

- Repository: `Ramin-rezaie-nazari/my-personal-assistant`
- Branch: `main`
- Latest fully verified functional baseline: `0d19d2b7dad5e9100505205328fbd523e544445b`
- Subsequent commits now include the Exercise Content/Media foundation work; that new slice is not yet covered by the previous CI/native verification evidence.
- Scope of the latest verified baseline: audit remediation, request-boundary hardening, security/privacy reconciliation and final CI/native verification.

## Remediation completed in verified baseline

- Major audit remediation PR #71 is merged.
- Frozen pnpm lockfile is aligned with the workspace dependency graph.
- Duplicate Android/EAS workflow definitions were removed; canonical APK and EAS preview paths remain.
- Missing shopping DTO contract exposed by CI was restored.
- Runtime DTO validation was added across the previously identified unvalidated action/write boundaries.
- Fitness authenticated identity uses `req.user.id` and Fitness persistence is Prisma-backed.
- Fitness natural-goal IDs are UUID-compatible and Persian text handling is normalized.
- Price normalization preserves currency semantics and currency-aware deduplication.
- Personal Brain, Yoga, Calisthenics, Calendar, User Intelligence, Recommendation Intelligence, Decision Feedback and Memory Intelligence action boundaries have runtime DTO validation.
- Recipe inventory matching is unit-aware for compatible metric mass/volume/count units and rejects incompatible dimensions rather than making false numeric matches.
- Personal Brain runtime DI metadata was hardened so the full application bootstrap can resolve `DecisionExecutionCoordinatorService`.
- Mobile brain-execution credentials use `expo-secure-store` with device-only keychain accessibility and clear both credentials after refresh failure.
- Security/privacy documentation was reconciled to current remediation evidence.
- Audit findings PB-258 through PB-268 are recorded in the canonical appendix and currently closed/remediated.
- Android Expo SDK 53 autolinking is explicitly pinned through `apps/mobile/react-native.config.js`, with the supporting pnpm hoisting remediation retained.

## New Exercise Content/Media foundation (unverified until CI)

- Canonical `Exercise`, `ExerciseMedia` and `ExerciseRelationship` Prisma models were added as a multi-file schema slice.
- A migration was added for the new exercise content/media tables and indexes.
- Authenticated read APIs were added for exercise listing/search/filtering and exercise detail.
- Exercise media now carries provider, license, attribution, approval status, dimensions, duration, poster and checksum metadata.
- Existing fitness generators are intentionally not yet rewritten against the new catalog; that integration follows runtime verification of this foundation.

## Automated evidence for the verified baseline

### Backend CI — GREEN

The latest verified Backend CI line completed successfully through dependency installation, Prisma schema validation/generation, migration deployment and idempotence, food-intelligence self-test, backend build, unit tests and API E2E tests.

### Mobile CI — GREEN

The latest verified Mobile CI line completed successfully through dependency installation, mobile typecheck, source tests, committed Jest specs, Expo project validation and Android JavaScript bundling.

### Android native APK — GREEN

The canonical native evidence path is `.github/workflows/android-apk.yml`. Workflow run `34772364209` (run #79), head `0d19d2b7dad5e9100505205328fbd523e544445b`, completed successfully through Expo prebuild, real Gradle `assembleDebug`, and APK upload. The produced artifact is `my-personal-assistant-debug-apk`, 58,443,390 bytes, SHA-256 `622b90eeef0898ab7d3eac9af75fac6e486da46eb4f741116d601f3d727f23da`.

## Evidence limitations

- The new Exercise Content/Media foundation has not yet received a CI run after these commits.
- No production exercise dataset or approved production video catalog has been imported yet.
- Real physical-device UX remains unvalidated.
- Production deployment behavior, production Supabase/Auth/RLS/Storage configuration and real notification delivery remain environment-limited.
- Microphone/location/speech behavior on a physical device is not proven by repository CI alone.
- Local media in a user's device/gallery is not directly validated by repository CI.
- Direct local repository execution is unavailable in the remediation container because outbound GitHub network access is blocked; GitHub Actions remains the authoritative automated execution evidence for this pass.

These are explicit evidence limits, not silently marked green findings.

## Project Brain

`docs/project-brain/12_OPEN_WORK.md` contains current actionable work/evidence gaps. `docs/project-brain/16_BODINEXT_TO_MYPA_FEATURE_MAPPING.md` is the reference-product gap analysis, and `docs/project-brain/17_EXERCISE_CONTENT_MEDIA_IMPLEMENTATION.md` documents the new exercise/media foundation and remaining work. Historical audit observations remain preserved in `15_AUDIT_FINDINGS_APPENDIX.md` and dated continuation documents. `10_SECURITY_AND_PRIVACY.md` must remain synchronized with the same verification boundary.
