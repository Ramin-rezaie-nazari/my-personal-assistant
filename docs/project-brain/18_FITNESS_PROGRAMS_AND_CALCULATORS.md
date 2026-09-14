# MYPA Fitness Programs & Calculators

Last updated: 2026-09-14
Status: IMPLEMENTED ON FEATURE BRANCH / CI VERIFICATION PENDING

## Scope

This slice closes the main BODINEXT-style Fitness product gaps identified in `16_BODINEXT_TO_MYPA_FEATURE_MAPPING.md` that do not depend on third-party video assets.

## 1500-exercise target and current status

MYPA Fitness is being designed around a **1500-exercise target catalog** so the consumer experience can cover a broad commercial-quality movement library rather than a small hard-coded seed.

Important accuracy boundary: the current repository evidence proves the **canonical exercise architecture and media/provenance foundation**, but does not yet prove that 1500 fully populated, reviewed, commercially-safe exercise records are already present in production data. The 1500 figure is therefore the current catalog target / execution scope for the next ingestion phase, not a claim that all 1500 records are already green.

The exercise foundation already implemented includes:

- canonical Exercise records with localized name, aliases, discipline, movement pattern, muscles, equipment, difficulty, goals, instructions, coach cues, common mistakes and cautions;
- ExerciseMedia with URL/source/license/attribution/mime/duration/poster/checksum/status/position metadata;
- ExerciseRelationship for alternatives, progressions and regressions;
- rights/provenance fields including acquisition mode, source reference, rights basis, creator, storage key, transformation marker, reviewer and review time;
- published-only consumer reads and approved-media-only detail exposure;
- mobile Exercise Library and Exercise Detail surfaces;
- discovery tooling that keeps third-party media as candidate-only until exact-match and rights verification.

## Work completed so far in this Fitness slice

### Durable program domain

- `FitnessProgram` — discoverable program catalog entry.
- `FitnessProgramVersion` — versioned, publishable program definition.
- `FitnessProgramSession` — durable week/day session with structured prescription payload.
- `FitnessPlanAssignment` — per-user enrollment and progress state.

The session generator remains the dynamic/adaptive engine. The durable program layer is the stable consumer-facing plan surface.

### Curated program catalog

The migration seeds six initial first-party program definitions:

- Strength Foundation — 8 Weeks.
- Hypertrophy & Sculpt — 8 Weeks.
- Fat Loss Home — 6 Weeks.
- Calisthenics Foundation — 8 Weeks.
- Mobility & Yoga Reset — 4 Weeks.
- General Fitness — 6 Weeks.

These are MYPA-curated starter programs, not copied BODINEXT programs.

### Program API

- `GET /fitness/programs`
- `GET /fitness/programs/:id`
- `GET /fitness/programs/current`
- `POST /fitness/programs/start`
- `POST /fitness/programs/:id/sessions/complete`
- `POST /fitness/programs/:id/status`

All routes inherit the Fitness controller JWT boundary. Session completion is constrained to the currently assigned week/day so progress cannot be double-counted or completed out of order.

### Calculator API

`POST /fitness/calculators` now provides a reusable calculation primitive for:

- BMI.
- BMR using Mifflin-St Jeor.
- TDEE from BMR × activity factor.
- conservative calorie targets for fat loss/gain.
- workout calorie estimate when a per-minute estimate is supplied.
- lean mass estimate when body-fat percentage is supplied.
- lifestyle water target estimate.

Body metrics are sent as JSON rather than query parameters to avoid unnecessary exposure in URLs/logs. The API exposes methodology text and keeps the water calculation explicitly non-medical.

### Progress summary API

- `GET /fitness/progress/summary`

Returns authenticated user-level workout count/minutes/calories, performance completion/difficulty averages, and active-program progress percentage.

### Mobile consumer surfaces

- Fitness Program Library.
- Program Detail with current-session execution.
- Session completion and plan progress.
- Fitness Calculators screen.
- Command Center shortcuts to Exercises and Programs.

## Current execution state after this work

The non-media Fitness product layer is substantially implemented on the feature branch: exercise content contracts, exercise discovery/detail, durable programs, six curated programs, calculators, authenticated progress summary and mobile consumer surfaces are in place.

The next execution phase is the **1500-exercise content + authorized media ingestion phase**. That phase should be treated as a separate content pipeline, not mixed into the program-domain architecture.

## 1000-source discovery phase

The requested next research step is to discover up to **1000 candidate websites / source domains** that may contain exercise demonstrations or structured exercise content.

Discovery output must classify each candidate before any acquisition attempt:

1. exact domain/source;
2. content type (video/image/text/catalog/API);
3. ownership / creator identity where discoverable;
4. license or explicit permission basis;
5. commercial-use compatibility;
6. attribution requirements;
7. hotlink/API/download restrictions;
8. whether content is suitable for MYPA ingestion;
9. candidate-only vs approved status;
10. source URL/reference and acquisition notes.

The 1000-source list is a **discovery corpus**, not an automatic license grant. A website appearing in the list must never be treated as permission to copy its videos.

## Download / acquisition policy

A bulk downloader may only execute against assets whose rights basis is explicitly approved by the MYPA media contract, such as:

- MYPA-owned media;
- media with a compatible open license;
- content covered by a verified commercial/redistribution license;
- externally authorized media where permission and delivery terms are documented.

It must not blanket-download BODINEXT content or arbitrary third-party exercise videos merely because a URL is reachable.

For every approved asset, the acquisition record should persist source reference, acquisition mode, rights basis, creator, attribution, checksum, storage key, reviewer and review timestamp before publication.

## Remaining Fitness gaps before full media/content completion

- Populate the planned 1500-exercise catalog with canonical published records using a commercially-safe source strategy.
- Resolve durable program prescriptions against canonical published `Exercise` records once the exercise catalog is selected/imported; the current payload uses stable exercise keys as an interim bridge.
- Add richer exercise-level program analytics and PR/volume trend charts to the consumer dashboard.
- Add true in-app video playback after the authorized video source strategy is finalized.
- Build and execute the rights-aware acquisition/import pipeline for approved media only.
- Keep third-party video acquisition separate from program/content architecture.

## Verification boundary

The new program/calculator/progress slice is not considered green until Backend CI and Mobile CI complete successfully on the final branch head. Production Supabase behavior and physical-device UX remain environment-specific evidence.
