# MYPA Fitness Programs & Calculators

Last updated: 2026-09-14
Status: IMPLEMENTED ON FEATURE BRANCH / CI VERIFICATION PENDING

## Scope

This slice closes the main BODINEXT-style Fitness product gaps identified in `16_BODINEXT_TO_MYPA_FEATURE_MAPPING.md` that do not depend on third-party video assets.

## Implemented

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

All routes inherit the Fitness controller JWT boundary.

### Calculator API

`GET /fitness/calculators` now provides a reusable calculation primitive for:

- BMI.
- BMR using Mifflin-St Jeor.
- TDEE from BMR × activity factor.
- conservative calorie targets for fat loss/gain.
- workout calorie estimate when a per-minute estimate is supplied.
- lean mass estimate when body-fat percentage is supplied.
- lifestyle water target estimate.

The API exposes methodology text and keeps the water calculation explicitly non-medical.

### Mobile consumer surfaces

- Fitness Program Library.
- Program Detail with current-session execution.
- Session completion and plan progress.
- Fitness Calculators screen.
- Command Center shortcuts to Exercises and Programs.

## Remaining Fitness gaps before video phase

- Connect durable program prescriptions to canonical `Exercise` IDs rather than string `exerciseKey` values once the commercial-safe Exercise catalog is selected/imported.
- Add richer exercise-level program analytics (volume, adherence, PR/progression summaries) to the consumer dashboard.
- Add true in-app video playback only after the authorized video source strategy is finalized.
- Keep third-party video acquisition separate from program/content architecture.

## Verification boundary

The new program/calculator slice is not considered green until Backend CI and Mobile CI complete successfully on the final branch head. Production Supabase behavior and physical-device UX remain environment-specific evidence.
