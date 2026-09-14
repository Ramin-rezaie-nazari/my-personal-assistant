# MYPA Free-First Exercise Video Strategy

Last updated: 2026-09-14
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

The repo now contains a scalable Wikimedia Commons harvester:

`tools/discover-free-exercise-videos-commons.mjs`

It accepts an arbitrary list of exercise names/IDs, searches Commons at asset level, reads license/creator/media metadata, scores exactness and produces candidate records. It never auto-approves media.

For 1,500 exercises, the intended batch is:

`1500 exercise queries → Commons candidates → exact-match score → license class → human/content-policy approval → approved manifest → controlled downloader`

The system can be run over a larger query universe if additional naming variants are needed.

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

Current web research confirms:

- Commons has a dedicated strength-training exercise-video category with 27 listed files, including several exact demonstration clips.
- The exact FitnessScape exercise demos are licensed CC BY 3.0 on their Commons pages.
- Commons contains additional CC BY/CC BY-SA exercise/yoga/fitness demonstrations; CC BY assets are preferred for the initial commercial-safe free batch.
- SeniorForm publishes downloadable exercise video files as CC BY-SA 4.0.
- Pixabay currently advertises hundreds to thousands of free exercise/workout clips, but its Content License and standalone-redistribution restrictions prevent treating the whole library as an automatically safe exercise catalog.
- Videvo exposes free gym/functional-exercise clips with multiple asset-specific license types; only compatible licenses should be selected.

## Hard rule about "free"

"Free download" is not enough.

The asset must have a reuse basis compatible with MYPA's intended commercial app distribution. A free stock site may permit use in a project while prohibiting redistribution as a standalone library. A repository may be open-source while its media originates from a third party. A public-domain government source may still contain trademarks or third-party material.

## Next target

The next content batches should prioritize:

1. Full Commons exercise-query sweep over the 1,500 canonical movement names and aliases.
2. Commons category expansion for strength, cardio, stretching, yoga, Pilates, mobility, rehabilitation and calisthenics.
3. Government/public-domain exercise-video expansion.
4. Open-source/CC exercise video libraries such as SeniorForm.
5. Only after free coverage is measured, determine whether any remaining gaps justify a later licensed vendor strategy.

The success metric is not "number of sites found". The success metric is:

`exact exercise coverage = exercises with at least one approved, usable demonstration video / 1500`
