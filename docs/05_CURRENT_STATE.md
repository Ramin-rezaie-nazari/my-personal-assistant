# MYPA Current State

Last updated: 2026-09-14
Review status: FITNESS BODINEXT-ALIGNED NON-MEDIA PRODUCT SLICE IMPLEMENTED / FREE-FIRST CONTENT-MEDIA PHASE OPEN / FRESH CI VERIFICATION PENDING

## Canonical ownership

This root file is the canonical repository-wide current-state document. `apps/backend/docs/05_CURRENT_STATE.md` is a compatibility pointer and must not contain a competing project-state snapshot.

## Repository state

- Repository: `Ramin-rezaie-nazari/my-personal-assistant`
- Main baseline: `f8a5681eebef5ecbac1e3e392b27a6a87d3396a0`
- Active feature branch: `feat/fitness-video-media-foundation-v2`
- PR: #78 — `feat(fitness): complete BODINEXT-aligned program and media foundation`
- The feature branch extends the verified baseline with Fitness exercise content/media architecture, durable programs, calculators, progress summary and consumer mobile surfaces. Fresh CI must verify the final head before this slice is marked green.

## Fitness target

- Planned Fitness catalog scale: **1500 canonical exercises**.
- The repository currently proves the canonical exercise/content/media architecture and seed/program foundations; it does not yet prove 1500 fully reviewed, commercially-safe production exercise records.
- Source-discovery milestone: **1000 distinct source sites/domains/collections**; larger research scale (10,000+ or more) is explicitly allowed where necessary.
- Acquisition priority: **free/open/public-domain first**, because international paid procurement is currently constrained.

## Verified baseline

- Major audit remediation PR #71 is merged.
- Frozen pnpm lockfile is aligned with the workspace dependency graph.
- Duplicate Android/EAS workflow definitions were removed; canonical APK and EAS preview paths remain.
- Runtime DTO validation was added across previously identified unvalidated action/write boundaries.
- Fitness authenticated identity uses `req.user.id` and Fitness profile persistence is Prisma-backed.
- Personal Brain, Yoga, Calisthenics, Calendar, User Intelligence, Recommendation Intelligence, Decision Feedback and Memory Intelligence action boundaries have runtime DTO validation.
- Recipe inventory matching is unit-aware and rejects incompatible dimensions.
- Personal Brain runtime DI metadata was hardened so the full application bootstrap can resolve `DecisionExecutionCoordinatorService`.
- Mobile brain-execution credentials use `expo-secure-store` and clear both credentials after refresh failure.
- Android Expo SDK 53 autolinking is explicitly pinned through `apps/mobile/react-native.config.js`.

## Fitness work implemented on the feature branch

### Exercise content/media foundation

- Canonical `Exercise`, `ExerciseMedia` and `ExerciseRelationship` database surfaces.
- Authenticated exercise list/detail APIs with search, discipline, muscle, equipment, difficulty and goal filters.
- Mobile Exercise Library and Exercise Detail screens.
- Provenance-aware media contract covering ownership, license, attribution, source reference, acquisition mode and approval.
- Local rights-aware video discovery tooling; discovery results remain candidates until exact-match and rights approval.
- Scalable Wikimedia Commons free-video discovery harvester for arbitrary exercise query lists.
- Rights-gated downloader for explicitly approved media records only.
- Downloader now streams to disk, verifies SHA-256 and writes an auditable report instead of buffering entire videos in RAM.
- Initial rights-gated sample manifest contains 9 exact Wikimedia demonstration assets under CC BY 3.0 with explicit license URLs.
- Source registry and approval validator guard against rights escalation.
- Machine-readable source inventory currently contains **47 source records** across open-license media, government/public-domain, commercial licensing, API/media, animation, stock and rights-review classes.

### Durable programs

- `FitnessProgram` catalog entries.
- Versioned `FitnessProgramVersion` definitions.
- Durable `FitnessProgramSession` week/day records.
- Per-user `FitnessPlanAssignment` enrollment and progress.
- Program list/detail/current/start/complete/status APIs.
- Session completion is constrained to the assigned current week/day to prevent duplicate or out-of-order progress.
- Six curated MYPA starter programs spanning strength, hypertrophy/sculpt, fat loss home, calisthenics, mobility/yoga and general fitness.
- Mobile Program Library and Program Detail/execution screens.

### Fitness calculators

- BMI.
- BMR (Mifflin-St Jeor).
- TDEE from activity factor.
- Calorie guidance for fat loss/gain.
- Workout calorie estimate.
- Optional lean-mass estimate.
- Lifestyle water target estimate with explicit non-medical methodology wording.
- Sensitive body metrics are posted as JSON rather than included in URLs.
- Mobile calculator surface.

### Fitness progress

- Authenticated `GET /fitness/progress/summary` aggregating workout totals, performance averages and active-program completion percentage.
- Unit coverage added for the progress aggregation contract.

## Current content/media research

Free-first research has expanded beyond the initial vendors. High-value source families now include Wikimedia Commons exercise-video categories, exact CC BY demonstration files, U.S. government public-domain footage mirrored on Commons, SeniorForm's openly licensed exercise-video package, Workout Guide and Open Training visual libraries, CC Search/Openverse as discovery indexes, and asset-specific free stock sources such as Pixabay/Videvo.

Commercial providers such as YMove, Vital Animations, Funxtion, ExerciseVideoAPI, WorkoutDB, CARAVAN, Hyperhuman, Exercise Animatic, MoveKit and others remain fallback licensing leads rather than the primary acquisition path.

The detailed free-first plan is `docs/project-brain/20_FREE_FIRST_EXERCISE_VIDEO_STRATEGY.md`. The broader discovery plan remains `docs/project-brain/19_FITNESS_1000_SOURCE_DISCOVERY.md`.

## Acquisition boundary

The downloader is intentionally not a generic scraper. It requires explicit approval, compatible acquisition mode, rights basis, license URL, source reference, allow-listed download host and checksum/reporting.

It must not blanket-download BODINEXT media or arbitrary third-party exercise videos. "Free download" alone is not enough; the intended MYPA commercial app distribution/storage model must be compatible with the exact asset license.

## Automated evidence

### Verified baseline

The previous Backend CI, Mobile CI and Android native APK evidence remains valid for the baseline commit listed above.

### New Fitness slice

The final feature branch has received CI triggers during development, and one earlier Backend CI run failed at Prisma schema validation before subsequent schema fixes. The final feature branch head has not yet received a confirmed green Backend CI/Mobile CI result in the available tool evidence, so this slice is intentionally not marked green.

## Evidence limitations

- Real physical-device UX remains unvalidated.
- Production Supabase/Auth/RLS/Storage/CDN behavior remains environment-limited.
- Final instructional-video availability is content/legal-gated.
- The local ExerciseDB V1 OSS corpus is non-commercial research material and must not be shipped in a monetized build without compatible commercial rights.
- The execution environment used for this session does not provide outbound DNS/network access for actually transferring external video binaries; the repository downloader is therefore prepared and scalable, but external binary transfer remains unvalidated here.

## Project Brain

- `docs/project-brain/16_BODINEXT_TO_MYPA_FEATURE_MAPPING.md` remains the reference-product gap analysis.
- `docs/project-brain/17_FITNESS_VIDEO_MEDIA_FOUNDATION.md` documents the media foundation and acquisition boundary.
- `docs/project-brain/18_FITNESS_PROGRAMS_AND_CALCULATORS.md` documents programs, calculators, progress and the 1500-exercise target.
- `docs/project-brain/19_FITNESS_1000_SOURCE_DISCOVERY.md` documents the broad source-discovery corpus and expansion strategy.
- `docs/project-brain/20_FREE_FIRST_EXERCISE_VIDEO_STRATEGY.md` defines the free-first acquisition strategy.
- `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md` remains the canonical audit findings record.
- `docs/project-brain/12_OPEN_WORK.md` remains the canonical actionable-work list.
