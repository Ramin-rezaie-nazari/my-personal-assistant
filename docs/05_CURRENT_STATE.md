# MYPA Current State

Last updated: 2026-09-14
Review status: FITNESS PROGRAM/MEDIA FOUNDATION IMPLEMENTED / CI VERIFICATION PENDING

## Canonical ownership

This root file is the canonical repository-wide current-state document. `apps/backend/docs/05_CURRENT_STATE.md` is a compatibility pointer and must not contain a competing project-state snapshot.

## Repository state

- Repository: `Ramin-rezaie-nazari/my-personal-assistant`
- Main baseline: `f8a5681eebef5ecbac1e3e392b27a6a87d3396a0`
- Active feature branch: `feat/fitness-video-media-foundation-v2`
- The feature branch extends the verified baseline with Fitness exercise content/media, durable programs and calculators. The new slice must not be treated as fully green until CI verifies the final head.

## Verified baseline

- Major audit remediation PR #71 is merged.
- Frozen pnpm lockfile is aligned with the workspace dependency graph.
- Duplicate Android/EAS workflow definitions were removed; canonical APK and EAS preview paths remain.
- Missing shopping DTO contract exposed by CI was restored.
- Runtime DTO validation was added across previously identified unvalidated action/write boundaries.
- Fitness authenticated identity uses `req.user.id` and Fitness profile persistence is Prisma-backed.
- Personal Brain, Yoga, Calisthenics, Calendar, User Intelligence, Recommendation Intelligence, Decision Feedback and Memory Intelligence action boundaries have runtime DTO validation.
- Recipe inventory matching is unit-aware and rejects incompatible dimensions.
- Personal Brain runtime DI metadata was hardened so the full application bootstrap can resolve `DecisionExecutionCoordinatorService`.
- Mobile brain-execution credentials use `expo-secure-store` and clear both credentials after refresh failure.
- Android Expo SDK 53 autolinking is explicitly pinned through `apps/mobile/react-native.config.js`.

## Fitness work now implemented on the feature branch

### Exercise content/media foundation

- Canonical `Exercise`, `ExerciseMedia` and `ExerciseRelationship` database surfaces.
- Authenticated exercise list/detail APIs with filtering and approved-media gates.
- Mobile Exercise Library and Exercise Detail screens.
- Provenance-aware media contract covering ownership, license, attribution, source reference and approval.
- Local rights-aware video discovery tooling; discovery results are candidates only until rights/exact-match approval.

### Durable programs

- `FitnessProgram` catalog entries.
- Versioned `FitnessProgramVersion` definitions.
- Durable `FitnessProgramSession` week/day records.
- Per-user `FitnessPlanAssignment` enrollment and progress.
- Program list/detail/current/start/complete/status APIs.
- Six curated MYPA starter programs spanning strength, hypertrophy/sculpt, fat loss home, calisthenics, mobility/yoga and general fitness.
- Mobile Program Library and Program Detail/execution screens.

### Fitness calculators

- BMI.
- BMR (Mifflin-St Jeor).
- TDEE from activity factor.
- Calorie guidance for fat loss/gain.
- Workout calorie estimate when a per-minute estimate is supplied.
- Optional lean-mass estimate from body-fat percentage.
- Lifestyle water target estimate with explicit non-medical methodology wording.
- Mobile calculator surface.

## Automated evidence

### Verified baseline

The previous Backend CI, Mobile CI and Android native APK evidence remains valid for the baseline commit listed above.

### New Fitness slice

The durable program/calculator changes and current exercise/media changes are **pending fresh CI verification** on the final feature-branch head. No new slice is marked green from code inspection alone.

## Evidence limitations

- Real physical-device UX remains unvalidated.
- Production Supabase/Auth/RLS/Storage/CDN behavior remains environment-limited.
- Final instructional-video availability is content/legal-gated.
- The local ExerciseDB V1 OSS corpus is non-commercial research material and must not be shipped in a monetized build without compatible commercial rights.

## Project Brain

- `docs/project-brain/16_BODINEXT_TO_MYPA_FEATURE_MAPPING.md` remains the reference-product gap analysis.
- `docs/project-brain/17_FITNESS_VIDEO_MEDIA_FOUNDATION.md` documents the media foundation and acquisition boundary.
- `docs/project-brain/18_FITNESS_PROGRAMS_AND_CALCULATORS.md` documents the durable program/calculator slice.
- `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md` remains the canonical audit findings record.
- `docs/project-brain/12_OPEN_WORK.md` remains the canonical actionable-work list.
