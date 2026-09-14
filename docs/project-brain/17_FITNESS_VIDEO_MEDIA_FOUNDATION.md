# MYPA Fitness Video & Media Foundation

Last updated: 2026-09-14
Status: IMPLEMENTED FOUNDATION + MOBILE EXERCISE SURFACE / VIDEO ACQUISITION REMAINS CONTENT-GATED

## Goal

Make every publishable MYPA exercise capable of carrying a real instructional media set without coupling the app to BODINEXT, runtime scraping, or an unverified third-party URL.

The existing fitness content system has a canonical `Exercise` / `ExerciseMedia` / `ExerciseRelationship` surface used by the Fitness API. This pass adds stronger media provenance requirements and a usable mobile exercise browsing/detail experience.

## What is now implemented

- JWT-protected `GET /fitness/exercises` list/search/filter surface.
- JWT-protected `GET /fitness/exercises/:id` detail surface.
- Approved-media filtering on consumer detail responses.
- Approved media and approved video counts on exercise list results.
- Exercise detail response exposes `mediaReady` and `videoReady`.
- Media relationships expose target exercise IDs for reliable navigation.
- Mobile Exercise Library route with search, discipline filters, result count, refresh and exercise cards.
- Mobile Exercise Detail route with localized names, metadata, approved media gallery, instructions, coach cues, common mistakes, cautions and exercise relationships.
- Command Center now exposes a direct Exercises entry point.
- Mobile fitness-content API client supports authenticated requests and access-token refresh using the existing refresh session contract.
- Automated backend unit coverage exists for the new media rights gates.

## Media lifecycle

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

## Media roles

- `hero` — primary exercise preview/poster.
- `instructional_video` — main demonstration.
- `secondary_video` — alternate angle/tempo/coaching view.
- `demo_image` — still demonstration frame.
- `sequence_image` — ordered multi-step visual instruction.

The current catalog release gate remains at least four distinct approved WebP demonstration assets. Video is additive until the final player and content gates are proven together.

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
- approval/review status;
- content version.

Missing or ambiguous rights are **not publishable**.

## Current delivery behavior

The mobile exercise detail page can show approved images immediately. For an approved instructional video, the current mobile surface exposes a play action against the approved media URL. Full in-app playback should use the Expo video stack once the dependency is integrated and CI-validated; until then, the action deliberately avoids pretending an external URL is an in-app player.

## Video acquisition strategy

Preferred order:

1. MYPA-owned recordings uploaded to controlled storage/CDN.
2. Explicitly licensed recordings with rights allowing in-app display.
3. Open-license/public-domain recordings whose exact license is recorded and compatible with the product.
4. Authorized external delivery only when the provider permits embedding/display and the runtime contract is stable.

Do not make runtime scraping a dependency. Do not download or mirror BODINEXT media merely because it is publicly reachable.

## Catalog coverage strategy

The target is 500 published movements per discipline. Content is released in batches rather than presenting a fake catalog with missing or unverified media.

For each batch:

1. import/validate exercise metadata;
2. attach the required four approved WebP assets;
3. attach an approved instructional video when available;
4. verify provenance and license;
5. run content-balance validation;
6. publish only the exercises that satisfy all release gates.

Exercises may remain `draft` / `pending_media` without appearing as complete consumer content.

## Verification requirements

Repository-level validation should prove:

- media cannot be published as approved without the required provenance fields;
- non-owned approved media carries a canonical source URL;
- video media has a MIME type;
- exercise queries return only published exercises and approved consumer media;
- media ordering is deterministic;
- relationship navigation targets the actual exercise;
- content-balance checks continue to enforce the existing four-WebP requirement;
- import/review operations remain restartable and idempotent.

Physical-device playback and production CDN/storage behavior remain separate runtime gates.
