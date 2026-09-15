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

## Current evidence baseline

The current free-first discovery pass uses 51 canonical exercise queries and produced:

- 190 total source records after merging 48 curated seed sources with 142 newly discovered source domains.
- 142 source pages sent through asset extraction.
- 117/142 source pages fetched successfully.
- 653 media candidates.
- 604 mapped candidates.
- 28/51 canonical exercises with at least one discovered candidate (54.9%).
- 475 high-confidence discovery candidates.
- Rights review completed for 653 candidates: 82 commercial-license leads, 122 blocked-platform candidates, 449 unresolved/manual-review candidates, 8 fetch failures, and 0 strong open-license/public-domain results from this specific automated pass.

This baseline proves the discovery pipeline works, but it does **not** prove production media coverage. The next stages must optimize exact exercise coverage and rights evidence.

## Implemented acceleration infrastructure

The repository now contains the implementation needed to move the workstream from the 51-item starter set toward the 1,500-item target:

- `tools/build-fitness-canonical-1500.mjs` builds a deterministic 1,500-row canonical metadata catalog from openly published exercise metadata sources and deliberately excludes source media from the catalog build.
- `tools/build-fitness-video-acquisition-queue.mjs` creates a resumable one-row-per-exercise queue with batch numbers and lifecycle status fields.
- `tools/run-fitness-1500-video-pipeline.mjs` orchestrates canonical catalog creation, queue creation, exact Wikimedia Commons discovery, rights-safe open-license promotion and completion-gate reporting, with optional approved-media download.
- `tools/check-fitness-media-tools.mjs` syntax-checks the expanded media toolchain.
- `apps/backend/package.json` exposes `fitness:media:canonical:build`, `fitness:media:queue:build`, `fitness:media:1500` and `fitness:media:1500:download`.

These tools are designed so the expensive work remains resumable and observable. They do not claim that an external license exists merely because an asset was found.

## Completion roadmap

### Phase 0 — Lock the canonical 1,500-exercise source of truth

Goal: establish the authoritative catalog before trying to fill it with media.

Deliverables:

- One committed machine-readable catalog of exactly 1,500 canonical exercises.
- Stable `exerciseId` / slug for every item.
- Canonical English name plus aliases and, where available, Persian name.
- Discipline/category, movement pattern, primary/secondary muscles, equipment and difficulty metadata.
- Duplicate/near-duplicate detection rules so variants are intentional rather than accidental.
- A generated coverage manifest with one row per exercise.

Green gate:

`canonicalExerciseCount = 1500` and `duplicateConflictCount = 0`.

### Phase 1 — Build a media acquisition queue for all 1,500

Goal: turn every exercise into an explicit work item.

Each exercise receives statuses such as:

`missing → discovery → candidate-found → rights-review → approved → acquired → validated`

The queue must retain candidates even when one source fails so that work is resumable and incremental.

Green gate:

`queueRows = 1500` and every row has a canonical exercise ID.

### Phase 2 — Expand exact-match discovery sources

Goal: maximize free/open discovery before any paid procurement.

Run separate discovery passes for:

- Wikimedia Commons exact files/categories/search.
- Government/public-domain libraries and official mirrors.
- Open-source/open-license exercise libraries.
- Free stock libraries only where the exact asset license and downstream distribution model are compatible.
- Existing curated/seed sources.
- Search-engine fallback with exercise-specific queries and aliases.

Important: broad source discovery is secondary. Every candidate must be mapped back to one or more canonical exercises with an explainable matching score.

Green gate:

Every exercise has either at least one candidate or an explicit `discovery-gap` record explaining which discovery strategies were exhausted.

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

### Phase 4 — Close coverage gaps in descending difficulty

Goal: drive the coverage numerator from the current baseline to 1,500.

Prioritize work in this order:

1. Exercises with strong exact candidates but incomplete rights evidence.
2. Exercises with commercial-license leads and a viable acquisition path.
3. Exercises with candidates that need better exact-match disambiguation.
4. Exercises with no candidate at all.
5. Rare or specialized movements that require dedicated query families or specialist sources.

Every batch should report:

`covered / 1500`, `approved / 1500`, `missing`, `rights-blocked`, `manual-review`, and `technical-validation-failed`.

### Phase 5 — Add a licensed fallback lane

Goal: guarantee completion of the remaining tail when free sources cannot satisfy rights or exactness.

For any exercise still missing an approved video after all free-first routes are exhausted:

- create a procurement lead,
- verify commercial license scope, hosting/CDN rights and attribution requirements,
- acquire only the exact required asset or package,
- record cost and license evidence,
- import through the approved-media pipeline.

Paid acquisition is a fallback, not a reason to lower the rights gate.

### Phase 6 — Acquire, normalize and validate media

Goal: turn approved candidates into reliable MYPA media.

For every approved asset:

- download only through the allow-listed approval path,
- preserve original source metadata,
- calculate SHA-256 checksum,
- normalize dimensions/format only when the license allows transformation,
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

## Immediate execution sequence

1. Run the canonical 1,500 catalog builder.
2. Build the 1,500-row acquisition queue.
3. Execute the master 1,500-item exact Commons discovery pass with live progress.
4. Promote only exact CC0/CC BY/Public Domain candidates into the approved-manifest lane.
5. Measure coverage and produce a gap list for every unsatisfied exercise.
6. Re-run discovery only for gaps and rights-review candidates in resumable batches.
7. Feed the remaining tail into the licensed fallback lane; the repository must not fabricate a license when a real commercial grant is required.
8. Download, validate and connect only approved assets to `ExerciseMedia`.
9. Continue until the validated approval coverage report reaches `1500/1500`.
