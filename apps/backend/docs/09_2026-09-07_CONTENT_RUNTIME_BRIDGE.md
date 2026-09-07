# 2026-09-07 — Content runtime bridge milestone

This appendix records the concrete work added during the autonomous continuation of the recipe/fitness corpus effort.

## What was implemented

- Recipe release media remains exactly one finished-dish hero per recipe; preparation/process galleries are not release media.
- The real licensed recipe-image dataset remains the primary source. Unresolved images may use the audited licensed Wikimedia Commons fallback. Generated recipe illustrations are not accepted as release heroes.
- `apps/backend/scripts/recipe-image-import-all-safe.mjs` was hardened to search compound recipe names more effectively while retaining license and relevance checks. Candidate selection is now scored across multiple exact/name/food/dish query variants instead of accepting the first loosely matching result.
- `apps/backend/scripts/recipe-image-dataset-import-v2.mjs` was fixed after CI exposed a syntax error in its reset path; the reset implementation is now explicit and parse-safe.
- `apps/backend/scripts/recipe-content-import.mjs` was separated from release media. It now imports recipe names, ingredients, servings, and contiguous procedural steps without inserting a temporary non-WebP/gallery image. Release media is owned by the canonical image mirror/fallback pipeline.
- `apps/backend/scripts/recipe-source-mapping-repair.mjs` was added. It downloads the canonical CC BY-SA 3.0 dataset mapping CSV, parses quoted CSV fields correctly, matches normalized recipe titles, and repairs malformed `recipe_source_raw.image_name` rows before media import.
- The content bootstrap now runs source-mapping repair immediately before the canonical recipe image mirror. This specifically covers the malformed `#NAME?` / CSV-parse-corruption class observed in the connected content DB.
- The recipe fallback budget was expanded from 20 to 60 passes at 25 recipes per pass so the fallback has enough capacity to process the full unresolved corpus rather than silently capping at 500 candidates.
- `apps/backend/scripts/recipe-media-runtime-sync.mjs` was hardened to perform each runtime recipe/media replacement transactionally and to reject non-WebP source rows before writing runtime media.
- `apps/backend/scripts/recipe-media-runtime-audit.mjs` remains the final runtime gate for exact coverage, WebP format, duplicate absence, missing hero URLs, and `Recipe.imageUrl` ↔ `RecipeMedia.url` consistency.
- The Full Content Media Corpus workflow validates actual WebP decodability with `sharp`, exact 500 movements per discipline, and >=50 movements at each difficulty level 1–10.
- A package/lockfile regression was detected from CI and corrected by restoring `@nestjs/platform-express` to the backend manifest; the subsequent frozen-lockfile installation passed.

## Actual connected-content evidence

The connected content Supabase project was inspected directly on 2026-09-07:

```text
recipes:                    13,029
recipes with hero rows:     11,643
recipes without hero:        1,386
hero storage objects:       11,645
```

The 1,386 unresolved recipes break down as:

```text
missing recipes total:     1,386
valid source mappings:     1,347
invalid/missing mapping:      30
no source row:                 0
```

Existing import-attempt history also showed 62 conservative Wikimedia misses, 27 `#NAME?` dataset misses, 3 additional Commons misses, plus a small number of transient download/storage failures. These signals are now explicitly addressed by the mapping-repair step, scored Commons search, and retry-safe pipeline.

These numbers are evidence for the connected content project only. They are not a claim that the application's separate runtime database is already populated.

## Validation evidence

- `Recipe Media Real-Image Smoke` run `34098247424`: GREEN. Frozen-lockfile install, real-food fixture, final-media generator, and one-real-image contract all passed.
- `Content Mirror Validation` run `34098387241`: GREEN.
- Full Content Media Corpus run `34098695871`: frozen-lockfile install passed, then exposed the dataset importer syntax bug; that bug has since been fixed.
- Content bootstrap run `34101802210`: all three corpus entry jobs reached their intended credential gates and stopped because the required runtime DB/Supabase secrets are still unavailable to GitHub Actions. The latest run therefore does not represent a corpus/data failure.
- The active branch remains `agent/mypa-autonomous-control-plane`; no new content milestone was intentionally committed to `main`.

## Remaining blocker

The repository-side pipeline is now wired end-to-end, but last-mile population still cannot be claimed GREEN while the automation environment lacks:

```text
MYPA_FITNESS_DATABASE_URL
MYPA_RECIPE_DATABASE_URL
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Once those are present, the release path is explicit:

```text
Recipe source mapping repair
  → recipe content import / audit
  → exact real-image dataset mirror
  → scored Wikimedia fallback for unresolved recipes
  → Supabase exact-one hero audit
  → transactional Prisma runtime media sync
  → runtime exact-one/WebP audit

Fitness DB import
  → level balance
  → content audit
  → 4-stage media mirror
  → media verification
```

No claim of 13,029 fully imaged runtime recipes or 1,500 fully mirrored exercise movements is made until the final jobs actually pass.
