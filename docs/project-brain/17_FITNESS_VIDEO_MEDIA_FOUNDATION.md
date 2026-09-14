# MYPA Fitness Video & Media Foundation

Last updated: 2026-09-14
Status: IMPLEMENTATION CONTRACT / MEDIA INGESTION FOUNDATION

## Goal

Make every publishable MYPA exercise capable of carrying a real instructional media set without coupling the app to BODINEXT, runtime scraping, or an unverified third-party URL.

The existing fitness content system already has a `FitnessExerciseCatalog` and `FitnessExerciseMedia` operational surface. The next step is to make the media contract explicitly video-capable and provenance-first while preserving the existing four-approved-WebP release gate for visual coverage.

## Product rule

An exercise is not considered fully media-ready merely because a URL exists.

A media asset is displayable only when its provenance and entitlement are known and its ingestion status is approved.

### Media lifecycle

```text
Candidate source
  -> provenance captured
  -> license/entitlement verified
  -> asset downloaded or referenced through an authorized delivery path
  -> technical validation
  -> optional normalization/transcode
  -> storage/CDN registration
  -> editorial approval
  -> published exercise media
```

## Supported media roles

- `hero` — primary exercise preview/poster.
- `instructional_video` — the main exercise demonstration.
- `secondary_video` — alternate angle, tempo or coaching view.
- `demo_image` — still demonstration frame.
- `sequence_image` — ordered multi-step visual instruction.

The current release gate remains at least four distinct approved WebP demonstration assets. Video coverage is additive and must not silently replace that gate until the product UX and automated validation are updated together.

## Provenance contract

Every candidate must carry:

- stable exercise identifier;
- provider/source name;
- source page or canonical source reference;
- creator/rights holder when known;
- license or explicit permission basis;
- attribution requirements;
- acquisition mode (`owned_upload`, `licensed`, `open_license`, `external_authorized`);
- original media URL/reference;
- stored media location when copied into MYPA storage;
- transformation history when normalized;
- review status;
- reviewer/review timestamp;
- content version.

Missing or ambiguous rights are **not publishable**.

## Video delivery strategy

Preferred order:

1. MYPA-owned recordings uploaded to controlled storage/CDN.
2. Explicitly licensed recordings with rights allowing in-app display.
3. Open-license/public-domain recordings whose exact license is recorded and compatible with the product.
4. Authorized external delivery only when the provider permits embedding/display and the runtime contract is stable.

Do not make runtime scraping a dependency. Do not download or mirror BODINEXT media merely because it is publicly reachable.

## Storage contract

```text
Exercise
  -> ExerciseMedia
      -> provenance + license
      -> technical metadata
      -> approval/version
      -> storage object or authorized playback reference
  -> API response
  -> mobile media player
```

Recommended technical metadata for video:

- MIME type;
- duration in milliseconds;
- width/height;
- aspect ratio;
- file size;
- poster asset;
- checksum/content hash;
- captions/subtitles when available;
- language;
- streaming/direct-file mode;
- storage key or authorized playback URL;
- created/updated timestamps.

## Catalog coverage strategy

The target is 500 published movements per discipline. Content should be released in batches, not as a fake catalog with missing media.

For each batch:

1. import/validate exercise metadata;
2. attach the required four approved WebP assets;
3. attach an approved instructional video where available;
4. verify provenance and license;
5. run content-balance validation;
6. publish only the exercises that satisfy all gates.

Exercises can exist as `draft` or `pending_media` without appearing as fully published consumer content.

## Why this is product-ready

The user-facing app gets a stable exercise identity and stable media contract. The source can later change from an external authorized provider to a MYPA-owned recording without changing the exercise, workout generator, Personal Brain, or mobile navigation.

This also lets MYPA scale the catalog without pretending that an unlicensed or unverified video is safe to ship.

## Verification requirements

Repository-level validation should prove:

- media cannot be published without provenance/approval;
- exercise queries return only publishable media for consumer surfaces;
- media ordering is deterministic;
- video metadata validation rejects unsupported or malformed assets;
- storage references are not confused with public source URLs;
- content-balance checks continue to enforce the existing four-WebP requirement;
- import/review operations are restartable and idempotent.

Physical-device playback and production CDN/storage behavior remain separate runtime gates.
