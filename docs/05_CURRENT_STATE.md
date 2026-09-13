# MYPA Current State

Last updated: 2026-09-13
Review status: FINAL VERIFICATION / EVIDENCE-LIMITED DEPLOYMENT ITEMS REMAIN

## Canonical ownership

This root file is the canonical repository-wide current-state document. `apps/backend/docs/05_CURRENT_STATE.md` is a compatibility pointer and must not contain a competing project-state snapshot.

## Repository state

- Repository: `Ramin-rezaie-nazari/my-personal-assistant`
- Branch: `main`
- Latest source commit in this verification pass: `2cadc1d41f3da8fc2c4cb11c96c1abd12e116a2c`
- Scope: audit remediation, contract hardening, security/privacy documentation reconciliation and final CI verification.

## Remediation completed

- Major audit remediation PR #71 is merged.
- Frozen pnpm lockfile is aligned with the workspace dependency graph.
- Duplicate Android/EAS workflow definitions were removed; canonical APK and EAS preview paths remain.
- Missing shopping DTO contract exposed by CI was restored.
- Runtime DTO validation was added across the previously identified unvalidated action/write boundaries.
- Fitness authenticated identity uses `req.user.id` and Fitness persistence is Prisma-backed.
- Fitness natural-goal IDs are UUID-compatible and Persian text handling is normalized.
- Price normalization preserves currency semantics and currency-aware deduplication.
- Personal Brain, Yoga, Calisthenics, Calendar, User Intelligence and Recommendation Intelligence action boundaries have runtime DTO validation.
- Mobile brain-execution credentials use `expo-secure-store` with device-only keychain accessibility and clear both credentials after refresh failure.
- Security/privacy documentation was reconciled to current remediation evidence.
- Audit findings PB-258 through PB-263 are recorded in the canonical appendix.

## Automated evidence

Backend CI on the immediately preceding hardening commit completed dependency installation, Prisma schema validation/generation, migration deployment and idempotence, food-intelligence self-test and backend build. Its unit-test phase exposed one stale controller-spec invocation after the DTO signature hardening; the test was corrected on `main` and a fresh CI cycle was triggered.

The latest Backend CI for `2cadc1d...` is the required final automated verification and must pass through unit and API E2E before CI-green is claimed for this line.

Mobile CI has a fresh run for `2cadc1d...` in progress. The prior reconciled mobile line passed the mobile validation/test/export path.

The canonical Android APK workflow remains the native-build evidence path. A previous run reached Android project generation and Gradle debug APK build, but it does not prove the latest source commit; physical-device behavior remains separately unvalidated.

## Evidence limitations

- Real physical-device UX remains unvalidated.
- Production deployment behavior, production Supabase/Auth/RLS/Storage configuration and real notification delivery remain environment-limited.
- Local media in a user's device/gallery is not directly validated by repository CI.

These are explicit evidence limits, not silently marked green findings.

## Project Brain

`docs/project-brain/12_OPEN_WORK.md` contains current actionable work/evidence gaps. Historical audit observations remain preserved in `15_AUDIT_FINDINGS_APPENDIX.md` and dated continuation documents. `10_SECURITY_AND_PRIVACY.md` is synchronized with the current remediation boundary.
