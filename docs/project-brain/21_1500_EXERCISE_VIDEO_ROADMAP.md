# MYPA 1500-Exercise Video Completion Roadmap

Last updated: 2026-09-15
Status: ACTIVE — TARGET IS 1500/1500 EXERCISES WITH VERIFIED USABLE VIDEO

## North-star outcome

MYPA is considered complete for this workstream only when every canonical exercise in the 1,500-exercise catalog has at least one usable demonstration video that:

1. is an exact match for the canonical exercise,
2. is technically usable in the MYPA mobile/web delivery model,
3. has an explicit, defensible right to be used by MYPA commercially,
4. has required creator/license/attribution/provenance metadata,
5. can be stored or delivered through an approved MYPA media path, and
6. is represented by a validated `ExerciseMedia` record with approval evidence.

The success metric is therefore:

`approved video coverage = canonical exercises with >=1 approved usable video / 1500`

The target is **1500/1500**, not a target number of domains or raw candidate files.

## Zero-cost constraint

This workstream is hard-constrained to **zero monetary cost** for acquisition and production.

Disallowed for the completion path:

- paid stock/video subscriptions,
- paid APIs or procurement services,
- one-time purchases or licensed video packs that require payment,
- recurring SaaS/media fees,
- paid fallback procurement.

Allowed completion lanes are limited to:

1. genuinely free/open external media with asset-level rights compatible with MYPA commercial use, hosting/redistribution and any required transformation,
2. media already owned by MYPA/project with defensible provenance, or
3. self-produced exercise demonstration media created by the project team/user and therefore owned or otherwise explicitly controlled by MYPA/project.

`Free to watch` or `free to download` is not enough. A third-party file may enter the approved lane only when the exact asset rights satisfy the manifest contract.

The project must never fabricate a license, re-label third-party media as self-produced, or claim 100% coverage before the actual media exists and passes validation.

## Current evidence baseline

The 1,500-exercise canonical catalog and acquisition queue are built successfully.

The full Wikimedia Commons exact-discovery pass has now completed:

- 1,500/1,500 exercise queries executed.
- 0 discovery errors.
- 6/1,500 exercises promoted into the approved free/open manifest from exact CC0/CC BY/Public Domain candidates.
- 1,494/1,500 exercises remain without an approved video.
- The Commons lane is therefore useful as a small free/open source, but is not sufficient as the sole acquisition strategy.

This result is evidence that the pipeline mechanics are working while the source mix must be expanded aggressively.

## Implemented acceleration infrastructure

The repository now contains the implementation needed to move the workstream from the 51-item starter set toward the 1,500-item target:

- `tools/build-fitness-canonical-1500.mjs` builds a deterministic 1,500-row canonical metadata catalog from openly published exercise metadata sources and deliberately excludes source media from the catalog build.
- `tools/build-fitness-video-acquisition-queue.mjs` creates a one-row-per-exercise queue with batch numbers and lifecycle status fields.
- `tools/run-fitness-1500-video-pipeline.mjs` orchestrates canonical catalog creation, queue creation, exact Wikimedia Commons discovery, rights-safe open-license promotion and completion-gate reporting.
- `tools/discover-free-exercise-videos-commons.mjs` is resumable, rate-limited and checkpointed for large discovery runs.
- `tools/discover-fitness-media-federated.mjs` supports direct/source-adapter discovery and retains source-query failures rather than hiding them.
- `tools/discover-fitness-1000-sources-search.mjs` discovers additional web source domains through search-engine fallback; those results are leads only until exact asset rights are verified.
- `tools/discover-fitness-video-assets-from-sources.mjs` extracts media candidates from discovered source pages.
- `tools/review-fitness-video-rights.mjs` performs rights evidence classification without silently granting approval.
- `tools/summarize-fitness-media-coverage.mjs` reports discovery and coverage evidence separately from approval.
- `tools/check-fitness-media-tools.mjs` syntax-checks the expanded media toolchain.
- `apps/backend/package.json` exposes canonical, queue, discovery, rights-review, coverage and master-runner commands.

## Completion roadmap

### Phase 0 — Lock the canonical 1,500-exercise source of truth

Goal: establish the authoritative catalog before trying to fill it with media.

Green gate:

`canonicalExerciseCount = 1500` and `duplicateConflictCount = 0`.

### Phase 1 — Build a media acquisition queue for all 1,500

Goal: turn every exercise into an explicit work item.

Each exercise receives statuses such as:

`missing → discovery → candidate-found → rights-review → approved → acquired → validated`

Green gate:

`queueRows = 1500` and every row has a canonical exercise ID.

### Phase 2 — Expand exact-match free/open discovery sources

Goal: maximize zero-cost coverage before any self-production work.

Run separate discovery passes for:

- Wikimedia Commons exact files/categories/search.
- Government/public-domain libraries and official mirrors.
- Open-source/open-license exercise libraries.
- Free media libraries only where the exact asset license and downstream distribution model are compatible.
- Existing curated/seed sources.
- Search-engine fallback with exercise-specific queries, aliases, muscle/equipment synonyms and movement-pattern terms.

Every candidate must be mapped back to one or more canonical exercises with an explainable matching score.

Green gate:

Every exercise has either at least one candidate or an explicit `discovery-gap` record explaining which zero-cost discovery strategies were exhausted.

### Phase 3 — Strengthen asset-level rights verification

Goal: convert candidate quantity into legally usable media.

For each candidate, capture:

- exact asset URL,
- source page URL,
- license identifier and license URL,
- creator/attribution,
- rights basis,
- commercial-use allowance,
- hosting/redistribution allowance,
- modification/derivative allowance,
- platform restrictions,
- depicted-person/brand concerns where applicable,
- provenance and reviewer evidence.

Automated rules may classify candidates, but automation must never silently mark a candidate production-approved.

Green gate:

Every approved media item has explicit asset-level rights evidence required by the MYPA manifest contract.

### Phase 4 — Close coverage gaps using only zero-cost lanes

Goal: drive approved coverage from the current **6/1500** to **1500/1500** without payment.

Priority order:

1. exact open-license candidates already discovered but not yet approved,
2. additional open/public-domain/government source discovery,
3. exercise-specific search-engine discovery against new sources,
4. exact-match rights review for promising candidates,
5. dedicated query families for rare/specialized movements,
6. self-produced media for the remaining tail.

Every batch must report:

`covered / 1500`, `approved / 1500`, `missing`, `rights-blocked`, `manual-review`, `technical-validation-failed`, and `self-production-required`.

### Phase 5 — Self-produced zero-cost fallback

Goal: guarantee completion of the remaining tail without purchasing media.

For every exercise still missing an approved third-party video after all free/open routes are exhausted:

- create a self-production work item,
- record the exact canonical exercise and the required demonstration specification,
- produce/record the demonstration using project-owned personnel/assets or another zero-cost method whose resulting rights are controlled by MYPA/project,
- store provenance for the produced asset,
- ingest it through the same approval/validation contract as external media.

A self-production queue is **not** equivalent to having a video. Coverage remains missing until the actual media file exists and is validated.

The repository must never mark `self-produced` merely because a placeholder, storyboard, prompt or manifest row exists.

### Phase 6 — Acquire, normalize and validate media

Goal: turn approved candidates into reliable MYPA media.

For every approved asset:

- acquire only through the allow-listed approval path,
- preserve original source metadata,
- calculate SHA-256 checksum,
- normalize dimensions/format only when the rights basis permits transformation,
- generate poster/preview metadata when appropriate,
- store using deterministic storage keys,
- validate MIME type and playback metadata,
- connect the asset to the canonical `ExerciseMedia` record.

Green gate per exercise:

`approvedUsableVideoCount >= 1`.

### Phase 7 — Product integration and playback validation

Goal: ensure the approved video is actually useful to users.

Validate:

- Exercise Library shows the exercise.
- Exercise Detail exposes the approved video.
- Video URL/path resolves through the intended delivery path.
- Mobile playback/link action behaves as designed.
- Metadata and attribution remain available where required.
- No unapproved candidate can accidentally surface through the runtime query path.

Physical-device and production-storage validation remain separate evidence where required.

### Phase 8 — Continuous gap sweeps and regression protection

Goal: prevent the catalog from falling below 1,500/1,500 as content evolves.

Add automated checks that fail when:

- a canonical exercise has zero approved usable videos,
- an approved asset lacks required provenance/rights metadata,
- an asset points to a blocked/unapproved host,
- an exercise mapping becomes ambiguous,
- an approved media record is missing or invalid,
- a new exercise is added without entering the media queue.

## Operational batch strategy

Do not try to solve all 1,500 movements in one giant opaque job.

Use resumable batches, for example 50–100 exercises per batch, with:

- live progress output,
- persisted generated reports,
- retry of failed pages only,
- deterministic deduplication,
- rights-review queues separated from automatic discovery,
- coverage checkpoints after every batch.

The repository tools should make reruns safe and incremental rather than starting from zero.

## Required progress dashboard

Every major media run should emit at least:

```text
Canonical exercises: 1500
Exercises with candidate: X/1500
Exercises with rights-qualified candidate: Y/1500
Exercises approved: Z/1500
Approved video coverage: Z/1500 (Z/1500 * 100)
Missing candidate: A
Rights blocked/manual: B
Technical validation failed: C
Self-production required: D
```

The only final green metric is:

```text
APPROVED VIDEO COVERAGE = 1500 / 1500 (100%)
```

## Hard rules

- Never treat `free download` as sufficient permission.
- Never treat a source-domain count as exercise coverage.
- Never treat a candidate as approved solely because an automated classifier detected a license keyword.
- Never copy or mirror third-party media without the exact rights required by the intended MYPA distribution model.
- Preserve provenance and auditability for every approved asset.
- Prefer an approved exact video over many weaker approximate candidates.
- Paid procurement is outside this workstream and must not be used to close the coverage gap.
- Self-produced media must be real, usable media; placeholders do not count.

## Immediate execution sequence

1. Preserve the verified 6/1500 Commons result as the baseline.
2. Generate a gap-only work queue containing the 1,494 unsatisfied exercises.
3. Run additional zero-cost discovery adapters/search-engine passes in resumable batches of 50–100.
4. Re-evaluate rights at the exact asset level and promote only defensible approved candidates.
5. Merge approved external media with any verified project-owned/self-produced media.
6. Generate a self-production queue for the remaining tail.
7. Produce and ingest actual self-produced videos for every remaining gap.
8. Download/acquire, normalize, validate and connect only approved assets to `ExerciseMedia`.
9. Continue until the validated approval coverage report reaches `1500/1500`.
