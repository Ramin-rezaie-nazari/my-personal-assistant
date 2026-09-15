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

`tools/discover-fitness-video-assets-from-sources.mjs` fetches discovered source pages and extracts direct `<video>/<source>` URLs, social/player embeds, OpenGraph video URLs and JSON-LD `contentUrl`/`embedUrl` candidates. This is discovery only; it does not grant rights or download media.

The next rights-evidence stage is:

`tools/review-fitness-video-rights.mjs`

It fetches candidate pages and records explicit license evidence, license URLs, attribution hints and commercial/redistribution language. Classification buckets distinguish strong open-license candidates, public-domain candidates, commercial-license leads, ShareAlike/ND/NC cases, blocked platforms and unresolved rights-review cases. Nothing from this stage is considered production-approved automatically.

A lightweight guard is available through:

`tools/check-fitness-media-tools.mjs`

It syntax-checks the media tools and validates the key JSON fixtures before the wider pipeline is executed.

## Executable terminal workflow

From the repository root, the current configured free-first batch can be run with:

```bash
cd apps/backend && pnpm fitness:media:free:download
```

Safe preview without downloading:

```bash
cd apps/backend && pnpm fitness:media:free:dry-run
```

For source discovery plus asset extraction plus rights-evidence preparation, use:

```bash
cd "$(git rev-parse --show-toplevel)" && \
git pull --ff-only origin feat/fitness-video-media-foundation-v2 && \
cd apps/backend && \
pnpm fitness:media:check && \
pnpm fitness:media:next
```

`fitness:media:next` merges the current search discovery output, extracts asset candidates and then runs rights-evidence review. It expects the generated search discovery file from the previous source-sweep step to exist locally.

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

Current research has verified multiple exact CC-licensed Wikimedia demonstrations and identified additional open-license/public-domain families, including government footage and open-source exercise-video projects. Paid providers remain fallback leads because the current operating environment cannot reliably procure them internationally.

## Hard rule about "free"

"Free download" is not enough.

The asset must have a reuse basis compatible with MYPA's intended commercial app distribution. A free stock site may permit use in a project while prohibiting redistribution as a standalone library. A repository may be open-source while its media originates from a third party. A public-domain government source may still contain trademarks or third-party material.

## Next target

1. Finish the current 142-source asset extraction and rights-evidence pass and measure candidate yield.
2. Expand the query corpus from the current starter set to the full 1,500 canonical movements and aliases.
3. Run the free-first Commons sweep over that complete corpus.
4. Expand discovery through strength, cardio, stretching, yoga, Pilates, mobility, rehabilitation and calisthenics categories.
5. Add government/public-domain and open-source exercise-video candidates.
6. Promote only exact candidates with explicit rights evidence into a human-approval queue.
7. Measure exact approved coverage before considering any paid provider.

The success metric is not "number of sites found". The success metric is:

`exact exercise coverage = exercises with at least one approved, usable demonstration video / 1500`
