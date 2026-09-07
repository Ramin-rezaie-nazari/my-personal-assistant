# Recipe hero web-search pipeline

## Verified starting state — 2026-09-07

The content Supabase project currently contains 13,029 recipes and 11,643 distinct recipe hero rows. A direct database query currently confirms 1,386 recipes without a hero. No imported rows have been counted as complete in this batch yet.

## Pipeline contract

The production path uses the existing `apps/backend/scripts/recipe-image-google-first-result-import.mjs`, which was already present in the repository and is explicitly designed around the requested Google Images first-result behavior.

For each unresolved recipe it:

1. Searches Google Images first with the recipe name plus `recipe`.
2. Tries both `tbm=isch` and `udm=2` Google image-result endpoints.
3. Extracts the first original image URL exposed by the Google result page.
4. Downloads and validates the candidate with `sharp` before importing it.
5. Converts the image to WebP at or below 60KB.
6. Writes the canonical object `recipes/<recipeId>/hero.webp`.
7. Writes a single `recipe_images` hero relation with Google-result provenance, dimensions, byte size and canonical storage key.
8. Records failures in `recipe_image_import_attempts` so the run can be audited.

The workflow then has an explicit fallback step: if the Google-first step fails, `apps/backend/scripts/recipe-image-import-all-safe.mjs` runs the existing licensed Wikimedia Commons pipeline against the remaining unresolved corpus. This prevents a Google block from leaving the entire batch stranded.

## Operational design

- Google concurrency is capped at 2 for autonomous runs.
- Google delay is 2.5 seconds between recipe attempts.
- Push/scheduled runs use `RECIPE_GOOGLE_LIMIT=0`, meaning all currently unresolved recipes are eligible; manual dispatch can limit a run to a smaller batch.
- Network failures and image downloads have retry/backoff logic.
- The importer re-checks current hero coverage before selecting work, so already-resolved recipes are skipped.
- The workflow runs on `main` and `agent/mypa-autonomous-control-plane` pushes, supports manual dispatch, and retains the scheduled trigger.
- GitHub Actions secrets are still external; the workflow only reads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

## Provenance rule

Google search-result provenance is recorded as Google first-result provenance; the current Google importer does not claim a copyright license merely because Google returned the image. The Wikimedia fallback accepts only explicitly allowed licenses and records the license/attribution metadata. Release audit must keep this distinction visible.

## Validation rule

A batch is not considered complete merely because the workflow exits successfully. Required evidence is:

- unresolved recipe count decreases,
- every newly imported hero has `image_type=hero`, canonical `storage_key`, WebP MIME type and `byte_size <= 61440`,
- no recipe has more than one hero relation,
- canonical storage keys match `recipes/<recipeId>/hero.webp`,
- provenance fields are populated,
- and a fresh storage audit confirms the object exists.

No claim that all 1,386 recipes are complete is valid until those database and storage checks pass.
