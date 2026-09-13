# MYPA Current State

Last updated: 2026-09-13
Review status: SOURCE HARDENING ACTIVE; LATEST CI RECHECK IN PROGRESS

## Canonical ownership

This root file is the canonical repository-wide current-state document. `apps/backend/docs/05_CURRENT_STATE.md` is a compatibility pointer and must not contain a competing project-state snapshot.

## Repository state

- Repository: `Ramin-rezaie-nazari/my-personal-assistant`
- Branch: `main`
- Latest source hardening commit in this pass: `4575a2a25cbac945f0635af13a6563a19f0c92c5`
- Scope: repository audit remediation plus final contract-hardening pass.

## Remediation completed in this pass

- Merged the major audit remediation PR (#71) into `main`.
- Repaired the frozen pnpm lockfile so all currently declared mobile dependencies are represented in the importer.
- Removed duplicate Android/EAS workflow definitions, leaving canonical APK and EAS preview paths.
- Restored the missing `shopping.dto.ts` contract exposed by CI and validated its basket/recipe-missing inputs.
- Added runtime DTO validation for water/daily tracking, habits, inventory adjustment, fitness profile/goal/equipment, recipe update, Assistant action confirmation and Price Intelligence writes.
- Unified Fitness authenticated identity access on `req.user.id` and kept Fitness persistence wired through Prisma.
- Made Fitness natural-goal IDs UUID-compatible and normalized Persian text handling.
- Hardened HTTP price normalization to preserve currency semantics and make deduplication currency-aware.
- Preserved transactional recipe-missing shopping writes and user ownership checks.
- Added and enforced runtime DTO contracts across Personal Brain, decision confirmation, User Intelligence, Recommendation Intelligence, Yoga, Calisthenics and Calendar action endpoints.
- Removed the remaining insecure AsyncStorage credential path from `apps/mobile/lib/brain-execution.ts`; its access/refresh credentials now use SecureStore with device-only keychain accessibility.
- Recorded new hardening findings PB-258 through PB-263 in the canonical audit appendix.

## Automated evidence

A Backend CI run on the earlier repaired line passed dependency installation, Prisma validation/generation, all migrations and idempotence, food-intelligence self-test, backend build, unit tests and API E2E. A later hardening run exposed one TypeScript contract mismatch in the new performance DTO; that was fixed before the current CI recheck.

The current Backend CI run is validating the latest hardening line after that fix. It must complete successfully before the source line is marked CI-green again.

Mobile CI has previously passed dependency installation on the reconciled lockfile and validated the mobile typecheck/tests/Expo/bundle path on the remediated line. The latest mobile-auth hardening still requires a fresh mobile CI result before being treated as fully validated.

The canonical Android APK workflow previously reached native Android project generation and Gradle debug APK build on the reconciled dependency state. Its result is tracked separately from later backend/mobile commits and is not used to claim validation of those later changes.

## Evidence limitations

- Real physical-device UX remains unvalidated here.
- Production deployment behavior, production Supabase/Auth/RLS/Storage configuration and real notification delivery remain environment-limited.
- Local media in a user's device/gallery is not directly validated by repository CI.

These are explicit evidence limits, not silently marked green findings.

## Project Brain

`docs/project-brain/12_OPEN_WORK.md` contains current actionable work/evidence gaps; historical audit observations remain preserved in `15_AUDIT_FINDINGS_APPENDIX.md` and dated continuation documents. The appendix now also records PB-258 through PB-263 from the latest source-hardening sweep.
