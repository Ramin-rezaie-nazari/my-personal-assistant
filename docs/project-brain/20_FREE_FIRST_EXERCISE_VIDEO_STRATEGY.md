# MYPA Free-First Exercise Video Strategy

Last updated: 2026-09-15
Status: ACTIVE — FREE-FIRST DISCOVERY / RIGHTS-GATED ACQUISITION

## Business constraint

The primary constraint for MYPA is not the absolute price of commercial fitness-media vendors; it is the inability to reliably make international payments from the current operating environment. Therefore the acquisition strategy prioritizes media that can be obtained without payment while preserving a defensible reuse basis for a commercial app.

## Target

- Canonical exercise target: 1,500 movements.
- Source-discovery target: up to 1,000 distinct source domains/collections as a first research milestone; larger discovery (10,000+ or more) is allowed if needed.
- Media objective: maximize exact-match exercise-video coverage using zero-cost sources first.

## Priority order

### Tier 1 — Exact open-license assets

Highest priority:

- CC0 / public domain.
- CC BY 3.0 / 4.0.
- Other permissive licenses only when their obligations are compatible with MYPA's intended distribution.

Wikimedia Commons is the primary discovery engine because individual file pages expose license, creator and media URLs, and it has explicit exercise/fitness video categories.

Verified examples include FitnessScape's bench press, squat, deadlift, pull-ups, shoulder press, leg raises, incline press, hanging crunches and bent-over row clips, each carrying CC BY 3.0 on the corresponding Commons file page.

### Tier 2 — Government/public-domain exercise media

Search U.S. federal sources and public-domain mirrors for exercise/fitness footage. Examples already identified:

- NASA Johnson's STEMonstrations — Exercise.
- U.S. government functional-fitness footage mirrored on Commons.
- U.S. Navy/DVIDS fitness-training footage mirrored on Commons.
- CDC public-domain b-roll where exercise-relevant assets can be identified.

Government/public-domain status is jurisdiction- and asset-specific. U.S. public-domain status does not automatically resolve trademarks, logos, privacy/personality rights or non-U.S. protection.

### Tier 3 — Open source exercise libraries

Examples:

- SeniorForm — exercise video files are stated to be open source under CC BY-SA 4.0 and available as downloadable files.
- Workout Guide / Everkinetic-derived exercise visual assets — CC BY-SA 4.0 for visual assets.
- Open Training exercise library — Everkinetic-derived images under CC BY-SA 3.0.

These can materially improve non-video visual coverage, but ShareAlike obligations must be handled deliberately before shipping in a commercial product.

### Tier 4 — Free stock platforms

Pexels, Pixabay, Videvo, Mixkit and similar libraries have large free collections. They are useful for exercise-themed imagery, intros and supporting clips, but should not be treated as permission to compile and redistribute an exercise stock library. Exact asset license, people/brand rights and MYPA's distribution model must be checked.

### Tier 5 — Paid vendors as fallback only

Large providers such as Your Move, Vital Animations, Funxtion, ExerciseVideoAPI, WorkoutDB and similar providers are useful fallback options when free sources fail to cover an exact movement. Because payment is currently constrained, they remain procurement leads rather than the primary plan.

## Discovery architecture

The repo contains a scalable Wikimedia Commons harvester:

`tools/discover-free-exercise-videos-commons.mjs`

It accepts an arbitrary list of exercise names/IDs, searches Commons at asset level, reads license/creator/media metadata, scores exactness and produces candidate records.

A free-first orchestration runner now exists:

`tools/run-free-exercise-video-pipeline.mjs`

It discovers candidates, promotes only exact CC0 / CC BY / Public Domain matches into a generated manifest, and optionally invokes the rights-gated downloader.

Search-engine fallback discovery is also implemented:

`tools/discover-fitness-1000-sources-search.mjs`

The first full run used 164 exercise/media discovery queries and completed with 0 failed queries, discovering 142 new domains; merged discovery inventory now contains 190 sources. These 142 are still discovery leads, not approved media sources.

Common Crawl remains an optional discovery adapter, but the current operating environment's direct access to `index.commoncrawl.org` failed at the transport layer (`UND_ERR_SOCKET` in Node and curl error 52). The primary discovery path therefore uses search-engine results instead of depending on Common Crawl availability.

## Source merge and asset discovery

`tools/merge-fitness-source-discovery.mjs` creates a derived inventory without mutating the seed registry. This keeps the original curated source list intact while allowing repeatable discovery expansion.

`tools/discover-fitness-video-assets-from-sources.mjs` fetches discovered source pages and extracts direct `<video>/<source>` URLs, social/player embeds, OpenGraph video URLs and JSON-LD `contentUrl`/`embedUrl` candidates. It now maps extracted candidates against the canonical exercise query corpus rather than relying only on source metadata.

A completed local batch produced the following baseline evidence:

- 142 discovered source pages processed.
- 117/142 pages fetched successfully (82.4%).
- 653 media candidates extracted.
- 604/653 candidates mapped to canonical exercises (92.5%).
- 28/51 starter canonical exercises covered (54.9%).
- 475 candidates scored high-confidence by the discovery heuristic.

These are discovery metrics only. They do not represent production-approved media coverage.

## Rights evidence stage

`tools/review-fitness-video-rights.mjs` fetches candidate pages and records explicit license evidence, license URLs, attribution hints and commercial/redistribution language. Classification buckets distinguish strong open-license candidates, public-domain candidates, commercial-license leads, ShareAlike/ND/NC cases, blocked platforms and unresolved rights-review cases. Nothing from this stage is considered production-approved automatically.

Completed local rights-review baseline for the 653 candidates:

- Reviewed: 653.
- Source-page fetch success: 645/653; 8 fetch failures.
- Open-license strong: 0.
- Public-domain candidates: 0.
- Commercial-license leads: 82.
- Blocked platforms: 122.
- Rights-review/manual cases: 449.

Candidate-level commercial leads are distributed narrowly: only 2 of the 51 starter canonical exercises currently have at least one commercial-license lead. No starter exercise currently has strong open-license/public-domain evidence in this automated pass.

A lightweight guard is available through:

`tools/check-fitness-media-tools.mjs`

It syntax-checks the media tools and validates the key JSON fixtures before the wider pipeline is executed.

A coverage report is generated by:

`tools/summarize-fitness-media-coverage.mjs`

It summarizes candidate coverage, rights buckets, commercial leads and discovery gaps per canonical exercise.

## Executable terminal workflow

From the repository root, the current configured source-discovery batch can be run with:

```bash
cd "$(git rev-parse --show-toplevel)" && \
git pull --ff-only origin feat/fitness-video-media-foundation-v2 && \
cd apps/backend && \
pnpm fitness:media:check && \
pnpm fitness:media:next
```

For a standalone rerun of the rights evidence stage over an existing candidate file:

```bash
cd "$(git rev-parse --show-toplevel)" && \
git pull --ff-only origin feat/fitness-video-media-foundation-v2 && \
cd apps/backend && \
FITNESS_MEDIA_RIGHTS_CONCURRENCY=3 \
FITNESS_MEDIA_RIGHTS_PROGRESS_EVERY=10 \
pnpm fitness:media:review 2>&1 | tee ../../fitness-media-rights-live.log
```

Coverage summary over an existing rights-review output:

```bash
cd "$(git rev-parse --show-toplevel)" && \
cd apps/backend && \
pnpm fitness:media:coverage
```

`fitness:media:next` merges the current search discovery output, extracts asset candidates, runs rights-evidence review and then generates the coverage report. It expects the generated search discovery file from the previous source-sweep step to exist locally.

## Download gate

`tools/download-approved-exercise-media.mjs` only downloads an explicitly approved manifest record. Required evidence includes:

- approved=true
- acquisition mode
- rights basis
- license URL
- source reference
- download URL
- allow-listed host

The downloader streams to disk, calculates SHA-256, verifies optional expected checksums and writes an auditable report. It is not a generic site scraper.

## Current free-media evidence

Current research has verified multiple exact CC-licensed Wikimedia demonstrations and identified additional open-license/public-domain families, including government footage and open-source exercise-video projects, but the automated 653-candidate review has not yet produced a strong open-license/public-domain classification for the 51-exercise starter corpus. Paid providers remain fallback leads because the current operating environment cannot reliably procure them internationally.

## Hard rule about "free"

"Free download" is not enough.

The asset must have a reuse basis compatible with MYPA's intended commercial app distribution. A free stock site may permit use in a project while prohibiting redistribution as a standalone library. A repository may be open-source while its media originates from a third party. A public-domain government source may still contain trademarks or third-party material.

## Next target

1. Treat the current 653-candidate result as a discovery baseline, not an approval set.
2. Prioritize the 23 uncovered starter exercises and improve candidate-to-exercise matching where needed.
3. Build exact asset-level rights evidence for the 82 commercial-license leads, including license scope, attribution, hosting/redistribution and depicted-person/brand constraints.
4. Re-run free-first Commons/public-domain/open-source discovery across the full starter corpus, then expand the query corpus toward the 1,500 canonical movements and aliases.
5. Expand discovery through strength, cardio, stretching, yoga, Pilates, mobility, rehabilitation and calisthenics categories.
6. Promote only exact candidates with explicit rights evidence into a human-approval queue.
7. Measure exact approved coverage before considering any paid provider.

The success metric is not "number of sites found". The success metric is:

`exact exercise coverage = exercises with at least one approved, usable demonstration video / 1500`
