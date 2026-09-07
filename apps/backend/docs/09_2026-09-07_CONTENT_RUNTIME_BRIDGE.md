# 2026-09-07 — Content runtime bridge milestone

This appendix records the concrete work added during the autonomous continuation of the recipe/fitness corpus effort.

## What was implemented

- Recipe release media remains exactly one finished-dish hero per recipe; preparation/process galleries are not release media.
- The real licensed recipe-image dataset remains the primary source. Unresolved images may use the audited licensed Wikimedia Commons fallback. Generated recipe illustrations are not accepted as release heroes.
- `apps/backend/scripts/recipe-image-import-all-safe.mjs` was hardened to search compound recipe names more effectively while retaining license and relevance checks. Candidate selection is scored across multiple exact/name/food/dish query variants instead of accepting the first loosely matching result.
- `apps/backend/scripts/recipe-image-dataset-import-v2.mjs` was fixed after CI exposed a syntax error in its reset path; the reset implementation is now explicit and parse-safe.
- The primary dataset importer now retries transient 429/5xx/504 Storage failures and tolerates image decoder warnings without crashing the whole corpus.
- The primary dataset importer now has a public transport-mirror fallback using a public mirror of the same Kaggle image corpus. Original Kaggle CC BY-SA 3.0 provenance remains the release source; the GitHub mirror is recorded only as transport.
- `apps/backend/scripts/recipe-content-import.mjs` was separated from release media. It imports recipe names, ingredients, servings, and contiguous procedural steps without inserting a temporary non-WebP/gallery image. Release media is owned by the canonical image mirror/fallback pipeline.
- `apps/backend/scripts/recipe-source-mapping-repair.mjs` was added. It downloads the canonical CC BY-SA 3.0 dataset mapping CSV, parses quoted CSV fields correctly, matches normalized recipe titles, and repairs malformed `recipe_source_raw.image_name` rows before media import. The implementation was optimized to batch-read source rows rather than issuing one REST request per recipe.
- The content bootstrap now runs source-mapping repair immediately before the canonical recipe image mirror. This covers the malformed `#NAME?` / CSV-parse-corruption class observed in the connected content DB.
- The recipe fallback budget was expanded from 20 to 60 passes at 25 recipes per pass so the fallback has enough capacity to process the full unresolved corpus rather than silently capping at 500 candidates.
- `apps/backend/scripts/recipe-media-runtime-sync.mjs` was hardened to perform each runtime recipe/media replacement transactionally and to reject non-WebP source rows before writing runtime media.
- `apps/backend/scripts/recipe-media-runtime-audit.mjs` remains the final runtime gate for exact coverage, WebP format, duplicate absence, missing hero URLs, and `Recipe.imageUrl` ↔ `RecipeMedia.url` consistency.
- `apps/backend/src/modules/recipes/services/recipes.service.ts` now exposes approved canonical media in recipe-list responses and both approved media and procedural steps in recipe-detail responses, so populated release media is actually consumable by the app API rather than being stranded in the database.
- The Full Content Media Corpus workflow validates actual WebP decodability with `sharp`, exact 500 movements per discipline, and >=50 movements at each difficulty level 1–10.
- Content validation was expanded to syntax-check every new recipe/media/runtime `.mjs` script plus enforce the frozen-lockfile contract.
- The package/lockfile regression was detected from CI and corrected by restoring `@nestjs/platform-express` to the backend manifest; the subsequent frozen-lockfile installation passed.

## Actual connected-content evidence

The connected content Supabase project was inspected directly on 2026-09-07:

```text
recipes:                    13,029
recipes with hero rows:     11,643
recipes without hero:        1,386
hero storage objects:       11,645
```

A direct relational check also confirmed every existing hero row has a matching `recipe-images` Storage object:

```text
hero rows:                         11,643
heroes with Storage object:        11,643
heroes missing Storage object:          0
```

The unresolved 1,386 recipes are currently in two classes: most have a usable source mapping but the image was not found in the first local dataset transport, while a smaller malformed-mapping class needs repair/fallback. The importer pipeline now has both canonical mapping repair and a secondary public transport mirror before the audited Wikimedia fallback.

These numbers are evidence for the connected content project only. They are not a claim that the application's separate runtime Prisma database is already populated.

## Validation evidence

- `Recipe Media Real-Image Smoke` run `34098247424`: GREEN. Frozen-lockfile install, real-food fixture, final-media generator, and one-real-image contract all passed.
- `Content Mirror Validation` run `34102321829`: GREEN after the TypeScript-syntax issue in `recipe-content-audit.mjs` was fixed. JSON validation, all recipe/content script syntax checks, existing mirror script checks, `sharp` declaration, and frozen install all passed.
- Full Content Media Corpus run `34098695871`: frozen-lockfile installation passed and then exposed a dataset-importer syntax bug; that bug has since been fixed. A later local-full-corpus result is still required before declaring the full generated corpus GREEN.
- Content bootstrap run `34102027784`: corpus entry jobs reached their intended credential gates and stopped because runtime DB/Supabase secrets were unavailable to GitHub Actions. No corpus completion is inferred from that run.
- The active branch remains `agent/mypa-autonomous-control-plane`; no new content milestone was intentionally committed to `main`.

## Remaining blocker

Repository-side content/memory/API plumbing is now substantially hardened, but last-mile population still cannot be claimed GREEN while the automation environment lacks:

```text
MYPA_FITNESS_DATABASE_URL
MYPA_RECIPE_DATABASE_URL
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Once those are available, the intended release path is:

```text
Recipe source mapping repair
  → recipe content import / audit
  → exact real-image dataset mirror
  → public transport mirror retry where dataset archive transport misses
  → scored Wikimedia fallback for unresolved recipes
  → Supabase exact-one hero audit
  → transactional Prisma runtime media sync
  → runtime exact-one/WebP audit
  → recipe API exposes media/steps to the mobile app

Fitness DB import
  → level balance
  → content audit
  → 4-stage media mirror
  → media verification
```

No claim of 13,029 fully imaged runtime recipes or 1,500 fully mirrored exercise movements is made until the final target runtime database/storage audits actually pass.
