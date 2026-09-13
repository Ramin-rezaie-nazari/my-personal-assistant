# MYPA Open Work

Last updated: 2026-09-13
Status: FINAL VERIFICATION / EVIDENCE-LIMITED ITEMS REMAIN

This file contains only currently actionable work. Historical audit observations are preserved in `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md` and dated deep-read/audit continuation documents; an old OPEN label in a historical catalog is not evidence that the defect still exists.

## Current blockers / evidence gaps

1. Verify the canonical Android APK workflow against the latest `main`. The existing APK run reached native Gradle build, but it was created before the final backend-only hardening commits and therefore is not proof for the latest commit.
2. Verify the latest Mobile CI run after dependency/lockfile reconciliation through typecheck, source tests, committed Jest specs, Expo validation and Android JS bundle.
3. Verify the latest Backend CI run after the final DTO/controller hardening. A prior run on the restored shopping DTO commit was fully green through API E2E; newer hardening commits require their own final green run.
4. Real physical-device UX, notification delivery, microphone/location/speech behavior and production deployment behavior remain environment-limited until exercised in those environments.
5. Production Supabase/Auth/RLS/Storage configuration cannot be claimed from repository-only evidence; repository-level authentication and database/session behavior are validated where CI covers them.
6. Keep Project Brain synchronized with the latest verified commit and CI evidence; never mark device or production capabilities green without direct evidence.

## Verified remediation completed

- Backend Prisma schema validation/generation, migrations and migration idempotence passed in CI.
- Backend unit tests and API E2E passed on the remediation line before the latest DTO hardening commits.
- Mobile frozen-lockfile dependency mismatch was corrected and dependency installation passed.
- Duplicate Android/EAS workflows were removed, leaving canonical workflows.
- Fitness profile/goal/equipment controller writes use nested runtime-validated DTOs and authenticated `user.id`.
- Shopping, inventory, daily tracking and habit write inputs have runtime validation.
- Assistant confirmation uses a validated DTO.
- Recipe update uses a validated update DTO.
- Price Intelligence write endpoints use validated DTOs; HTTP price normalization preserves currency semantics and currency-aware deduplication.
- Fitness natural-goal parsing uses UUID-compatible IDs and normalized Persian text handling.

## Completion rule

A work item is green only after implementation, relevant automated validation and documentation are consistent. Device/production evidence stays explicitly unvalidated until exercised outside repository CI.
