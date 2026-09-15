# MYPA 1500-Exercise Video Completion Roadmap

Last updated: 2026-09-15
Status: ACTIVE — TARGET IS 1500/1500 EXERCISES WITH VERIFIED USABLE VIDEO, ZERO PURCHASES

## North-star outcome

MYPA is complete for this workstream only when every canonical exercise in the 1,500-exercise catalog has at least one usable demonstration video that is an exact match, technically usable, commercially reusable by MYPA, fully attributed/provenanced, deliverable through an approved MYPA media path, and represented by a validated `ExerciseMedia` record with approval evidence.

**Zero-cost constraint:** this workstream will not buy, subscribe to, or procure third-party media licenses. Every final video must come from a free source with explicit compatible rights (for example CC0, Public Domain, CC BY or another explicitly compatible free license) or be self-produced/owned by MYPA. "Free download" alone is never enough.

The success metric is:

`approved video coverage = canonical exercises with >=1 approved usable video / 1500`

The target is **1500/1500**.

## Current evidence baseline

The current free-first pass uses 51 canonical exercise queries and produced 190 source records, 653 media candidates, 604 mapped candidates, 28/51 exercises with candidates, 475 high-confidence candidates, 82 commercial-license leads, 122 blocked-platform candidates, 449 unresolved/manual-review candidates, 8 fetch failures, and 0 strong open-license/public-domain results from that automated pass.

This proves discovery works but does not prove final coverage.

## Execution phases

### Phase 0 — Canonical 1,500 catalog

Build and validate exactly 1,500 canonical exercises with stable IDs/slugs, aliases and useful movement metadata.

Green gate: `canonicalExerciseCount = 1500` and `duplicateConflictCount = 0`.

### Phase 1 — 1,500-row media queue

Create one resumable media work item per canonical exercise with lifecycle states such as:

`missing → discovery → candidate-found → rights-review → approved → acquired → validated`

For gaps that cannot be filled externally for free:

`rights-blocked → self-produced → acquired → validated`

Green gate: `queueRows = 1500` and every row has a canonical exercise ID.

### Phase 2 — Free exact-match discovery

Search, in order, Wikimedia Commons, government/public-domain collections, open-source/open-license exercise libraries, compatible free stock sources, curated seed sources, and exercise-specific search-engine queries using names and aliases.

Every candidate must map to a canonical exercise with an explainable exact-match score.

Green gate: every exercise has either a candidate or a recorded discovery gap showing the free routes attempted.

### Phase 3 — Asset-level rights verification

For every candidate capture exact asset URL, source page, license and license URL, creator/attribution, commercial-use permission, hosting/redistribution permission, modification permission, platform restrictions, and provenance. Automated classification never equals final approval.

Green gate: every approved external asset has explicit compatible free-rights evidence.

### Phase 4 — Close gaps with free sources first

Prioritize exact candidates with incomplete rights evidence, alternative free sources, public-domain/government material, dedicated exercise queries, and additional open collections. Keep re-running only the missing/gap exercises in resumable batches.

### Phase 5 — Zero-cost self-production fallback

When an exercise still lacks an approved free external video after reasonable discovery, do **not** create a paid procurement task. Create a self-production task: film the exact exercise with an owned/authorized person and setting, avoid third-party copyrighted music/logos/material, store creator/owner/provenance evidence, and mark `acquisitionMode = owned_upload`.

This is the guaranteed path to reach 1500/1500 without purchasing third-party media rights.

### Phase 6 — Acquire, normalize and validate

Download only approved external assets or ingest self-produced assets. Preserve provenance, calculate SHA-256, validate MIME/dimensions/playback, normalize only when permitted, generate poster metadata when needed, and connect to canonical `ExerciseMedia`.

Green gate per exercise: `approvedUsableVideoCount >= 1`.

### Phase 7 — Product and playback validation

Validate Exercise Library, Exercise Detail, intended media delivery path, mobile playback/link behavior, attribution display where required, and runtime filtering so unapproved candidates never surface.

### Phase 8 — Regression protection

Fail checks when any canonical exercise has zero approved usable videos, approved provenance is incomplete, a blocked/unapproved host is referenced, mapping is ambiguous, or a new exercise is added without a media queue row.

## Batch strategy

Use resumable batches of 50–100 exercises with live progress, persisted reports, deterministic deduplication, retry of failed pages only, separate rights queues, and coverage checkpoints after each batch.

## Required dashboard

```text
Canonical exercises: 1500
Exercises with candidate: X/1500
Exercises with free-rights-qualified candidate: Y/1500
Exercises approved: Z/1500
Approved video coverage: Z/1500 (Z/1500 * 100)
Missing candidate: A
Rights blocked/manual: B
Self-produced required: C
Technical validation failed: D
```

Final green gate:

```text
APPROVED VIDEO COVERAGE = 1500 / 1500 (100%)
```

## Hard rules

- No paid media license, subscription or procurement in this workstream.
- Never treat a free download as permission.
- Never treat a domain count as exercise coverage.
- Never auto-approve based only on a license keyword.
- Never copy third-party media without compatible free rights.
- Preserve provenance and auditability.
- Prefer exact approved video over approximate candidates.
- Use self-produced media as the final zero-cost fallback.

## Immediate execution sequence

1. Build the authoritative 1,500-exercise catalog.
2. Build the 1,500-row acquisition queue.
3. Run full free exact-match discovery with live progress.
4. Promote only rights-qualified free candidates.
5. Produce a gap queue for every unsatisfied exercise.
6. Re-run discovery only for gaps in 50–100 exercise batches.
7. Convert the remaining tail into self-production tasks instead of paid procurement.
8. Ingest, validate and connect all approved media.
9. Continue until validated coverage reaches `1500/1500`.
