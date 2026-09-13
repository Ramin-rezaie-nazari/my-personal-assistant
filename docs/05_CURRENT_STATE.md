# MYPA Current State

Last updated: 2026-09-13
Review status: FINAL VERIFICATION / EVIDENCE-LIMITED DEPLOYMENT ITEMS REMAIN

## Canonical ownership

This root file is the canonical repository-wide current-state document. `apps/backend/docs/05_CURRENT_STATE.md` is a compatibility pointer and must not contain a competing project-state snapshot.

## Repository state

- Repository: `Ramin-rezaie-nazari/my-personal-assistant`
- Branch: `main`
- Latest functional verification commit: `0d19d2b7dad5e9100505205328fbd523e544445b`
- Subsequent commits only synchronize Project Brain/current-state evidence; they do not alter the verified native implementation.
- Scope: audit remediation, request-boundary hardening, security/privacy reconciliation and final CI/native verification.

## Remediation completed

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

## Automated evidence

### Backend CI — GREEN

The latest verified Backend CI line completed successfully through dependency installation, Prisma schema validation/generation, migration deployment and idempotence, food-intelligence self-test, backend build, unit tests and API E2E tests.

### Mobile CI — GREEN

The latest verified Mobile CI line completed successfully through dependency installation, mobile typecheck, source tests, committed Jest specs, Expo project validation and Android JavaScript bundling.

### Android native APK — GREEN

The canonical native evidence path is `.github/workflows/android-apk.yml`. Workflow run `34772364209` (run #79), head `0d19d2b7dad5e9100505205328fbd523e544445b`, completed successfully through Expo prebuild, real Gradle `assembleDebug`, and APK upload. The produced artifact is `my-personal-assistant-debug-apk`, 58,443,390 bytes, SHA-256 `622b90eeef0898ab7d3eac9af75fac6e486da46eb4f741116d601f3d727f23da`.

## Evidence limitations

- Real physical-device UX remains unvalidated.
- Production deployment behavior, production Supabase/Auth/RLS/Storage configuration and real notification delivery remain environment-limited.
- Microphone/location/speech behavior on a physical device is not proven by repository CI alone.
- Local media in a user's device/gallery is not directly validated by repository CI.
- Direct local repository execution is unavailable in the remediation container because outbound GitHub network access is blocked; GitHub Actions remains the authoritative automated execution evidence for this pass.

These are explicit evidence limits, not silently marked green findings.

## Project Brain

`docs/project-brain/12_OPEN_WORK.md` contains current actionable work/evidence gaps. Historical audit observations remain preserved in `15_AUDIT_FINDINGS_APPENDIX.md` and dated continuation documents. `10_SECURITY_AND_PRIVACY.md` must remain synchronized with the same verification boundary.