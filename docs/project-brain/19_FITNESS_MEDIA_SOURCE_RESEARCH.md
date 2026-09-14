# MYPA Fitness Media Source Research & Acquisition Plan

Last updated: 2026-09-14
Status: ACTIVE — SOURCE DISCOVERY / RIGHTS-GATED ACQUISITION

## 1. Scope and target

The Fitness content target is **1,500 exercise movements** for the long-term MYPA exercise library.

The current implementation already contains the exercise/media data contract, provenance fields, approval gate, exercise library/detail UI, and rights-aware discovery/downloader tooling. The next content phase is to discover a large source universe and then acquire only media that has a traceable reuse basis.

The operational discovery goal is **up to 1,000 distinct source sites/domains or source collections** across exercise videos, exercise illustrations, demonstrations, open datasets and licensed fitness-media vendors. A source count is not a permission count: every asset still requires an exact rights check.

## 2. Work completed before this research phase

Current feature branch: `feat/fitness-video-media-foundation-v2`.

PR #78 currently contains the Fitness product/media foundation, durable programs, calculators and progress summary. The latest known PR snapshot has 56 commits, 29 changed files, +1531/-73, and the final feature head still requires fresh green Backend + Mobile CI evidence.

Implemented Fitness layers include:

- Canonical `Exercise`, `ExerciseMedia`, `ExerciseRelationship` data surfaces.
- Search/filter/detail APIs for published exercises.
- Mobile Exercise Library and Exercise Detail.
- Provenance and rights fields including acquisition mode, rights basis, source reference, creator, storage key, reviewer/reviewedAt and content version.
- Approval gate for third-party media.
- Rights-aware candidate discovery tool.
- Explicit allow-listed downloader that only accepts approved records.
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

## 4. High-value sources found so far

### Wikimedia Commons exercise demonstrations

Several exact exercise demonstration videos were found on Wikimedia Commons with explicit Creative Commons licenses. These are strong early candidates because each file page exposes the author and license metadata.

Verified examples:

- Pull-ups — FitnessScape — CC BY 3.0.
- Squat — FitnessScape — CC BY 3.0.
- Shoulder press — FitnessScape — CC BY 3.0.
- Bench press — FitnessScape — CC BY 3.0.
- Deadlift — FitnessScape — CC BY 3.0.
- Leg raises — FitnessScape — CC BY 3.0.
- Incline press — FitnessScape — CC BY 3.0.
- Hanging crunches — FitnessScape — CC BY 3.0.

Additional Commons demonstrations were found under CC BY-SA licenses (for example burpee and forward lunge). They remain rights-reviewed candidates rather than the first production download batch because ShareAlike obligations need to be handled consistently with MYPA's distribution model.

## 5. Commercial dataset/vendor leads

A current example found during research is RepDB. Its free tier states that 600+ exercise records and associated flat WebP illustrations may be used in commercial applications with visible attribution, while forbidding redistribution as a standalone dataset. The paid tiers add animations and different licensing. This is potentially useful for the exercise catalog/illustration layer, but the exact current license must be accepted and recorded before ingestion.

Another current lead is Vital Animations / ExerciseDB Pro, which advertises 1,500+ exercise animations with a commercial license and download/hosting rights. This is a vendor lead, not a free asset source; MYPA should evaluate cost, contract scope and whether the purchased license covers our exact use case before acquisition.

ExerciseDB-style GitHub mirrors remain candidate-only when their media ownership/licensing is unclear. A repository containing metadata is not evidence that the associated third-party media may be redistributed.

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

This is the desired behavior even when researching 1,000 sources: **discovery is broad, acquisition is narrow and auditable**.

## 7. Current acquisition boundary

MYPA will not mirror or bulk-copy BODINEXT media, and it will not treat a public search result, a third-party CDN URL, a scraped exercise dataset or a generic "free" label as permission.

The workflow is:

`discover → exact asset match → inspect license/permission → determine commercial/hosting rights → record provenance → approve → download/import → checksum → catalog → attribution → test in app`

## 8. Next execution batches

### Batch A — exact open-license demonstrations

Populate an initial manifest of exact Commons files whose file page explicitly states an eligible CC license, beginning with CC BY assets. Verify source page, creator, license and direct/redirect download endpoint before changing approval state.

### Batch B — open-license image/illustration coverage

Search Openverse/Wikimedia/public-domain collections for exercise illustrations and stills. Do not auto-approve merely because an API returns an asset; retain exact-license evidence.

### Batch C — licensed commercial vendors

Evaluate commercial packs that cover hundreds/thousands of movements. Compare per-app, redistribution, hosting/CDN, revenue, geography and sublicensing terms. A single clean commercial contract may outperform hundreds of fragmented sources.

### Batch D — 1,000-source inventory expansion

Expand the research inventory to ~1,000 distinct sources/collections with deduplication by canonical domain/collection identifier. This is research breadth only; candidate sources do not enter production until rights review.

## 9. Verification status

- Product/media architecture: implemented on feature branch.
- Rights-aware discovery: implemented.
- Rights-gated downloader: implemented.
- Exact open-license sample set: identified; manifest population is in progress.
- 1,000-source research inventory: not yet complete.
- 1,500-movement catalog population: not yet complete.
- Real external media download: environment dependent; current runtime has no outbound DNS/network access for large external media transfer.
- Final in-app playback: not yet green-verified.
- Fresh feature-branch Backend/Mobile CI: still pending confirmation.
