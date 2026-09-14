# MYPA Fitness Video & Media Foundation

Last updated: 2026-09-14
Status: IMPLEMENTED FOUNDATION + MOBILE EXERCISE SURFACE + VIDEO DISCOVERY PIPELINE / FINAL ASSET APPROVAL REMAINS CONTENT-GATED

## Goal

Make every publishable MYPA exercise capable of carrying a real instructional media set without coupling the app to BODINEXT, runtime scraping, or an unverified third-party URL.

The existing fitness content system has a canonical `Exercise` / `ExerciseMedia` / `ExerciseRelationship` surface used by the Fitness API. This pass adds stronger media provenance requirements, a usable mobile exercise browsing/detail experience, and a local rights-aware discovery pipeline for the 1,500-record exercise catalog.

## Implemented

- JWT-protected fitness exercise list/detail surfaces.
- Approved-media filtering and approved video/media counts.
- Mobile Exercise Library and Exercise Detail screens.
- Authenticated mobile content API with refresh support.
- Backend unit coverage for media rights gates.
- `tools/discover-exercise-videos.mjs` scans the local 1,500-exercise catalog and searches Wikimedia Commons plus optional Pexels/Pixabay APIs, preserving candidate provenance and rights classification.

## Media lifecycle

```text
Candidate source -> provenance -> rights verification -> technical validation -> storage/delivery -> editorial approval -> published media
```

## Rights-aware discovery

### Wikimedia Commons

The tool queries the public MediaWiki API and inspects per-file media/license metadata. Explicit CC0/public-domain, CC BY, and CC BY-SA candidates are classified as open-license candidates; anything else remains rights-review-required.

### Pexels

With `PEXELS_API_KEY`, the tool queries the Pexels video API. Pexels states its content can be used for commercial purposes under its license, while restrictions still apply to standalone redistribution and rights attached to depicted people, trademarks or brands. Candidates remain review-required until matched to MYPA's delivery model.

### Pixabay

With `PIXABAY_API_KEY`, the tool queries the Pixabay video API. Pixabay permits free use and adaptation under its Content License, including commercial use subject to prohibited uses. Candidates remain review-required until their exact use in MYPA is checked.

### Direct permission

When automated discovery does not find a strong exact match, the tool emits a ready-to-use permission query. A creator's written authorization can then be recorded as the rights basis before production approval.

## Important boundary

A search result is not automatically a production-approved asset. Exact exercise matching, license terms, attribution, depicted-person/brand rights, standalone-distribution rules, and any direct permission evidence must be checked.

The local ExerciseDB V1 OSS corpus remains research/import material while its stated non-commercial terms apply. It must not be shipped in a monetized build without an appropriate commercial license.

## Delivery behavior

The current mobile exercise detail page can show approved images and expose an approved video play action. Full in-app playback will use the Expo video stack once the dependency is integrated and CI-validated.

## Production acquisition priority

1. MYPA-owned recordings.
2. Explicitly licensed recordings with in-app display rights.
3. Open-license/public-domain recordings with compatible terms.
4. Authorized external delivery where embedding/display is explicitly allowed and stable.

Runtime scraping is not a dependency, and BODINEXT media is not copied or mirrored merely because it is publicly reachable.

## Verification requirements

- approved media requires complete provenance;
- non-owned media has a canonical source URL;
- video media has a MIME type;
- consumer APIs expose only published exercises and approved media;
- discovery/import/review is restartable and idempotent;
- final coverage is measured from approved exact matches, not raw search-result count.

Physical-device playback and production CDN/storage behavior remain environment-specific gates.
