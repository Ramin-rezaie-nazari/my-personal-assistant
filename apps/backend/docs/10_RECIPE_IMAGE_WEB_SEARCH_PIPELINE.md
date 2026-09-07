# Recipe hero web-search pipeline

## Verified starting state — 2026-09-07

The content Supabase project currently contains 13,029 recipes, 11,643 distinct recipe hero rows, and 1,386 recipes without a hero. The existing `recipe_image_import_attempts` table contains 99 historical attempts (96 skipped, 3 failed). The unresolved count is therefore measured from the actual database, not from a stale local report.

## Pipeline contract

The new `apps/backend/scripts/recipe-image-web-search-import.mjs` is intentionally separate from the older Wikimedia-only fallback so unresolved recipes are not trapped in the previous retry strategy.

For each unresolved recipe the importer:

1. Searches Google Images first using a food-qualified query and Creative Commons usage-rights filter.
2. Parses candidate image URLs and probes them with `sharp` before accepting them.
3. Falls back to Bing Images when Google does not yield a usable candidate.
4. Falls back to Wikimedia Commons with explicit license filtering when web search candidates are unavailable.
5. Selects the first usable candidate from the ordered search pipeline, rejecting obvious non-image/invalid candidates, very small images, extreme aspect ratios, and known non-food UI assets.
6. Converts the selected image to WebP at or below 60KB.
7. Writes the canonical object `recipes/<recipeId>/hero.webp`.
8. Writes exactly one `recipe_images` hero row for the previously unresolved recipe, including source URL, source name, license/provenance metadata, dimensions, byte size and canonical storage key.
9. Records failed/skipped attempts without treating historical skips as permanent truth; later runs can retry unresolved recipes with the improved pipeline.

## Operational design

- Default batch size: 100 recipes.
- Default concurrency: 3 image workers.
- Google requests have a minimum delay and all network layers retry transient 429/5xx failures with backoff.
- The workflow is idempotent for already-resolved recipes because it queries current hero coverage before processing.
- The GitHub Actions workflow now runs on both `main` and `agent/mypa-autonomous-control-plane` pushes for the recipe-image pipeline, and retains manual dispatch plus the existing scheduled path.
- Runtime secrets remain external to the repository. The workflow only uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from GitHub Actions secrets.

## Important provenance rule

Google/Bing results do not independently prove a copyright license merely because an image appears in search. The importer records the search provenance explicitly when a web-search candidate is used and does not represent an unverified search result as CC-licensed. Wikimedia candidates are accepted only when an allowed license is positively detected. This distinction must remain visible in release audits.

## Validation rule

A batch is not considered complete merely because the workflow exits successfully. The target evidence is:

- unresolved recipe count decreases,
- every newly imported hero has `image_type=hero`, canonical `storage_key`, WebP MIME type and `byte_size <= 61440`,
- hero row count equals distinct hero recipe count for the release corpus,
- no recipe has more than one hero row,
- canonical storage keys match `recipes/<recipeId>/hero.webp`,
- provenance fields are populated,
- and a fresh runtime/storage audit confirms the object exists.

No claim that all 1,386 recipes are complete is valid until those database and storage checks pass.
