# MYPA Content Corpus Audit — 2026-09-06

## Target

Release-quality access to the real recipe and fitness corpus, including approved image/media coverage, provenance, validation, and deterministic release gates.

## Implemented

- Fitness import pipeline downloads public exercise datasets and enriches missing media from Wikimedia Commons.
- Fitness release audit requires 500 published movements per discipline, ten difficulty levels, at least 50 publishable movements per level, and four approved WebP assets per movement.
- Fitness media verification validates response status/content type and falls back from HEAD to a bounded GET probe when providers do not support HEAD.
- Empty fitness media corpus is a hard failure.
- Recipe corpus audit now exists as `apps/backend/scripts/recipe-content-audit.mjs` and checks names, servings, ingredients, steps, quantities/units, verification state, media, provenance metadata, step numbering, and duplicate names.
- Content bootstrap workflow separates fitness and recipe jobs so one missing runtime secret does not mask independent failures in the other corpus.
- Recipe image import uses a real dataset source and transforms images to WebP <= 60 KB with provenance metadata.

## Evidence

A content bootstrap run on 2026-09-06 reached the runtime-secret gate and failed because `MYPA_FITNESS_DATABASE_URL`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` were not available to the GitHub Actions environment. No dataset download occurred in that run. Therefore corpus population is **not** marked green.

## Current release truth

- Fitness corpus population: **RED/PENDING** until an actual target database is populated and the strict audit + media verification both pass.
- Recipe image population: **RED/PENDING** until a real Supabase storage/database environment is connected and the post-import recipe audit passes.
- Recipe content population: **RED/PENDING** until the current Prisma `Recipe` tables contain a complete production-approved corpus; legacy `recipe_source_raw` / `recipe_images` storage tables must not be treated as proof of current Prisma `RecipeMedia` coverage.

## Human/environment dependency

The repository does not contain the production database URL or Supabase service-role credentials, and those values must remain secrets. The available connected Supabase project was previously observed to expose legacy recipe-image tables rather than the current MYPA Prisma recipe/fitness schema, so it is not treated as the production target without explicit evidence.

This audit intentionally refuses to claim "100%" from code presence alone. A final green release requires real corpus data, successful audits, backend/mobile CI, native health/camera validation, and store/release configuration evidence.
