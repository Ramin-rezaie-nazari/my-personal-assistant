# MYPA Fitness Media Source Research & Acquisition Plan

Last updated: 2026-09-14
Status: ACTIVE — SOURCE DISCOVERY / RIGHTS-GATED ACQUISITION

## 1. Scope and target

The Fitness content target is **1,500 exercise movements** for the long-term MYPA exercise library.

The current implementation already contains the exercise/media data contract, provenance fields, approval gate, exercise library/detail UI, and rights-aware discovery/downloader tooling. The next content phase is to discover a large source universe and then acquire only media that has a traceable reuse basis.

The operational discovery goal is **up to 1,000 distinct source sites/domains or source collections** across exercise videos, exercise illustrations, demonstrations, open datasets and licensed fitness-media vendors. A source count is not a permission count: every asset still requires an exact rights check.

## 2. Work completed before this research phase

Current feature branch: `feat/fitness-video-media-foundation-v2`.

PR #78 now contains the Fitness product/media foundation, durable programs, calculators, progress summary, source registry/inventory and rights-gated downloader/validator. The branch is still awaiting fresh green Backend + Mobile CI evidence.

Implemented Fitness layers include:

- Canonical `Exercise`, `ExerciseMedia`, `ExerciseRelationship` data surfaces.
- Search/filter/detail APIs for published exercises.
- Mobile Exercise Library and Exercise Detail.
- Provenance and rights fields including acquisition mode, rights basis, source reference, creator, storage key, reviewer/reviewedAt and content version.
- Approval gate for third-party media.
- Rights-aware candidate discovery tool.
- Explicit allow-listed downloader that only accepts approved records.
- Source registry and media-source inventory for the 1,000-source research target.
- Validator that prevents source-level discovery from becoming asset-level download permission.
- Durable program/version/session/assignment domain.
- Six MYPA-curated starter programs.
- BMI/BMR/TDEE/calorie/lean-mass/water/workout calculators.
- User progress summary.

## 3. The 1,000-source discovery model

The 1,000-source goal is a research inventory, not an instruction to scrape 1,000 sites indiscriminately.

Sources are classified as:

1. `open_license_media` — exact asset license permits reuse.
2. `public_domain_media` — exact asset is verified public domain.
3. `owned_upload` — MYPA has created/received the asset and owns the rights.
4. `licensed_vendor` — explicit commercial license permits in-app use/hosting.
5. `external_authorized` — direct written authorization or platform terms explicitly permit the intended use.
6. `candidate_only` — useful discovery source, but rights or exact asset permission is not yet sufficient.
7. `blocked` — terms, ownership, attribution, redistribution, or ambiguity prevents ingestion.

The source inventory should record at minimum:

- domain/source collection
- source type
- canonical URL
- asset type
- exercise coverage estimate
- exact-license URL or terms URL
- commercial-use status
- attribution requirements
- redistribution/hosting restrictions
- download/API mechanism
- rate-limit/robots constraints when relevant
- whether raw assets may be stored on MYPA infrastructure
- review status
- reviewer and review date
- sample asset IDs/URLs

## 4. Current verified research findings

### Open / low-friction sources

- Wikimedia Commons contains exact exercise demonstration video files with asset-level Creative Commons metadata. The first sample set contains 9 approved-candidate CC BY 3.0 assets in the MYPA manifest.
- Your Move currently advertises 25 free downloadable exercise videos for commercial use, while its broader library is separately licensed for white-label use/API access. The free set may not be redistributed as a standalone library.
- RepDB currently advertises a 601-exercise free dataset with commercial in-app use and required attribution; the paid Standard tier adds consistent looping animations under a separate paid license.

### Commercial white-label / API sources

- Your Move: 1,107+ white-label HD exercise videos, bulk/API delivery, commercial licensing, 84 yoga poses through the same API family. citeturn244014search0turn464066search11
- ExerciseVideoAPI: 290 filmed HD exercise videos, metadata JSON, perpetual commercial license, instant download and self-hosting claims; exact purchased contract still needs to be archived before production ingestion. citeturn244014search1turn464066search3
- WorkoutDB: about 873 exercises with demo media; Pro/Scale plans advertise commercial in-product use and CDN/API delivery. citeturn244014search2turn464066search7
- Funxtion FXCONTENT: 3,500+ exercise videos, 600+ classes, REST API and SDK, white-label delivery. citeturn244014search3turn486955search5
- Hyperhuman: licensed exercise clips/classes, yoga, Pilates, strength, HIIT, mobility and recovery content delivered through app/web/API/video-export channels depending on plan/provider. citeturn960706search0
- Fitscope Studio: thousands of studio fitness classes for apps/OEM/digital platforms under flexible licensing. citeturn960706search6turn486955search0
- CARAVAN Wellness: white-label exercise API with CDN-hosted video and search/filter/personalization. citeturn960706search5
- Exercise Animatic: commercial iOS/Android/app/platform use is explicitly described under its business-to-business license. citeturn373974search7turn960706search3
- MoveKit: 400+ consistent exercise animations with commercial app licensing; raw standalone redistribution and competing-library use are prohibited. citeturn373974search2turn960706search4
- Vital Animations: commercial use and self-hosting in paid iOS/Android apps are advertised, with complete collections covering gym, home, yoga, Pilates, women, mobility and stretching. citeturn960706search9
- White Label Workouts: 120+ exercise demos/explainers explicitly marketed for apps, client programs and coaching products. citeturn244014search7

### Structured exercise-data leads

- `smyrdev/exercises-dataset` advertises 1,324 exercises with multilingual instructions and muscle/volume data; repository licensing/provenance must still be reviewed before commercial reuse. citeturn960706search7
- Several GymVisual-derived GitHub datasets explicitly separate MIT-covered code/data from GymVisual-owned media and say a separate GymVisual license is needed. These are useful for provenance research but are **not** production media sources by default. citeturn719100search1turn719100search10
- ExerciseClips standard license explicitly excludes building an app/platform; an Extended Licence is required for that use case. citeturn244014search4

## 5. Source quality hierarchy

For MYPA production content, current ranking is:

1. owned/commissioned content;
2. exact open-license/public-domain asset with clear reuse terms;
3. one-time commercial white-label library with self-hosting rights;
4. commercial API with explicit in-app delivery rights;
5. embedding/streaming service where storage is prohibited;
6. stock/platform candidates requiring asset-level review;
7. public repositories with unclear media provenance.

The key optimization is not merely reaching 1,000 sources. One commercially clean, well-structured provider covering 500–1,500 exercises may be more valuable than hundreds of fragmented sources.

## 6. Downloader rule

`tools/download-approved-exercise-media.mjs` is intentionally restrictive.

A record must include:

- `approved: true`
- supported acquisition mode (`owned_upload`, `licensed`, `open_license`, `external_authorized`)
- `rightsBasis`
- `sourceReference`
- `downloadUrl`
- explicit allow-listed acquisition host(s)

The downloader refuses unapproved records, missing rights evidence, unsupported acquisition modes and non-allow-listed hosts. It records checksums, byte counts, MIME type and rights metadata in a download report.

The validator separately verifies the source registry and approved-media manifest so discovery cannot silently escalate into download permission.

## 7. Current source inventory state

The checked-in inventory now contains **37 source/collection records** spanning:

- Wikimedia Commons and exact asset pages;
- free/open exercise data;
- commercial exercise-video vendors;
- commercial animation libraries;
- API/media providers;
- stock-video platforms;
- embedding leads;
- explicitly blocked/rights-review sources.

These are de-duplicated by source/collection identity. Forks of the same dataset are not counted as distinct high-value sources unless they materially change rights or content provenance.

## 8. Execution batches

### Batch A — exact open-license demonstrations

Populate an initial manifest of exact Commons files whose file page explicitly states an eligible CC license, beginning with CC BY assets. Verify source page, creator, license and direct/redirect download endpoint before changing approval state.

### Batch B — open-license image/illustration coverage

Search Openverse/Wikimedia/public-domain collections for exercise illustrations and stills. Do not auto-approve merely because an API returns an asset; retain exact-license evidence.

### Batch C — commercial procurement shortlist

Compare YMove, ExerciseVideoAPI, WorkoutDB, Funxtion, Hyperhuman, Fitscope, CARAVAN, Exercise Animatic, MoveKit, Vital Animations and other leads for:

- total exercise coverage
- real video vs animation
- female/male representation
- yoga/Pilates/mobility/rehab coverage
- commercial-app rights
- white-label rights
- self-hosting rights
- API/CDN delivery
- offline/download rights
- sublicensing/redistribution restrictions
- price and renewal model
- attribution requirements
- geographic restrictions

### Batch D — 1,000-source discovery

Expand the research inventory toward ~1,000 distinct sources/collections with deduplication. Discovery breadth remains separate from production approval.

### Batch E — exact-match coverage measurement

After the source universe is large enough, map every approved asset against the MYPA 1,500-exercise canonical slug/taxonomy and calculate:

- exact coverage;
- near-match requiring human review;
- missing exercise media;
- duplicate/alternate demonstrations;
- modality gaps;
- equipment gaps;
- localization gaps.

This converts "we found lots of videos" into a measurable exercise-library completion percentage.

## 9. Verification status

- Product/media architecture: implemented on feature branch.
- Rights-aware discovery: implemented.
- Rights-gated downloader: implemented.
- Source registry/inventory: implemented; 37 records currently checked in.
- Exact open-license sample set: 9 approved-candidate records currently checked in.
- 1,000-source research inventory: **in progress**.
- 1,500-movement catalog population: **in progress / not yet proven complete**.
- Real external binary download in this assistant runtime: environment-limited because outbound DNS/network transfer is unavailable.
- Final in-app playback: not yet green-verified.
- Fresh feature-branch Backend/Mobile CI: pending confirmation.
