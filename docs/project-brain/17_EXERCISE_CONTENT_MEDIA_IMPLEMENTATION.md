# Exercise Content + Media Implementation

Last updated: 2026-09-18
Status: FOUNDATION + CI VERIFIED / PRODUCTION CONTENT INGESTION + DEVICE VALIDATION PENDING

## Goal

Build a product-ready Exercise Library that can support the existing Gym, Calisthenics and future fitness generators without keeping exercise knowledge fragmented inside provider implementations.

The target is a BODINEXT-level visual exercise experience without copying or scraping BODINEXT content.

## Implemented in this pass

### Canonical data foundation

- Added `Exercise` as a first-class Prisma model in `apps/backend/prisma/exercise-content.prisma`.
- Added `ExerciseMedia` for video/image/animation assets.
- Added `ExerciseRelationship` for alternatives, progressions and regressions.
- Enabled Prisma multi-file schema loading through `apps/backend/prisma.config.ts`.
- Added migration `20260914120000_add_exercise_content_media_foundation`.

### Exercise content fields

The canonical entity now supports:

- stable slug and localized Persian name
- aliases
- discipline
- movement pattern
- primary and secondary muscles
- equipment
- difficulty
- goals
- instructions
- coach cues
- common mistakes
- cautions
- content status
- source/license/attribution metadata

### Media contract

Every media record carries:

- media kind
- playable/source URL
- provider
- license
- attribution
- MIME type
- duration
- dimensions
- language
- poster
- checksum
- approval status
- ordering

This deliberately makes media provenance part of the data model rather than an undocumented URL stored on an exercise.

### Backend read surface

Authenticated endpoints were added under `/fitness`:

- `GET /fitness/exercises`
- `GET /fitness/exercises/:id`

The list API supports search plus discipline, muscle, equipment, difficulty and goal filters with pagination.

The detail API returns the exercise, approved media and progression/regression/alternative relationships.

## Media acquisition rule

MYPA will not runtime-scrape BODINEXT or copy third-party exercise videos without an applicable right to use them.

Accepted media sources for the production catalog are:

1. MYPA-owned recordings.
2. Explicitly licensed media with a license compatible with storage/display in the app.
3. Media from a source whose terms explicitly permit the intended embedding/display model.
4. Public-domain or compatible open-license media with attribution and license metadata preserved.

A media item without a known source/provider and license is not production-approved.

## Intended delivery architecture

`Exercise`
→ `ExerciseMedia`
→ `licensed/owned source or MYPA Storage/CDN`
→ `Mobile Player`

The app should not depend on a third-party webpage remaining available in order to render the core exercise catalog.

## What is deliberately not marked green yet

- No production exercise dataset has been imported yet.
- No production video catalog has been approved yet.
- No mobile exercise library/detail UI has been connected yet.
- Backend CI now verifies the Prisma schema/migrations and backend API E2E on current main; production dataset/media approval remains pending.
- Existing Gym/Calisthenics/Yoga generators have not yet been migrated to consume the canonical Exercise entity.

These are real remaining steps, not hidden placeholders.

These remaining content/catalog items are not blockers for the current physical mobile validation pass.

## Next implementation sequence

1. Verify Prisma multi-file schema + migration in CI.
2. Build the exercise import/authoring pipeline with license validation.
3. Populate the first real exercise catalog from independently authored/licensed metadata.
4. Add the first approved media batch.
5. Connect Gym/Calisthenics/Yoga selection to the canonical Exercise IDs.
6. Build mobile library, detail and media-player UX.
7. Add curated programs and durable program/session assignment.

## Quality gate

An exercise is considered production-ready only when its structured metadata is complete enough for recommendation logic and it has either approved media or an explicitly accepted content state that the UX can handle without pretending media exists.
