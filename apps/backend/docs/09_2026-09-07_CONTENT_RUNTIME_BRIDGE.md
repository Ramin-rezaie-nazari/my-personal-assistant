# 2026-09-07 — Content runtime bridge milestone

This appendix records the concrete work added during the autonomous continuation of the recipe/fitness corpus effort.

## What was implemented

- Recipe release media remains exactly one finished-dish hero per recipe; preparation/process galleries are not release media.
- The real licensed recipe-image dataset remains the primary source. Unresolved images may use the audited licensed Wikimedia Commons fallback. Generated recipe illustrations are not accepted as release heroes.
- `apps/backend/scripts/recipe-image-import-all-safe.mjs` was hardened to search compound recipe names more effectively while retaining license and relevance checks.
- `apps/backend/scripts/recipe-image-dataset-import-v2.mjs` was fixed after CI exposed a syntax error in its reset path; the reset implementation is now explicit and parse-safe.
- `apps/backend/scripts/recipe-content-import.mjs` was separated from release media. It now imports recipe names, ingredients, servings, and contiguous procedural steps without inserting a temporary non-WebP/gallery image. Release media is owned by the canonical image mirror/fallback pipeline.
- The content bootstrap recipe audit now runs with `RECIPE_REQUIRE_IMAGE=0` during the data-only stage and defers the exact-one media gate until after the dedicated real-image mirror/fallback jobs.
- `apps/backend/scripts/recipe-media-runtime-sync.mjs` was added as the explicit bridge between the content Supabase `recipe_images`/Storage plane and the application Prisma `Recipe`/`RecipeMedia` plane. For every matching runtime recipe it writes the canonical hero URL to `Recipe.imageUrl` and creates exactly one approved position-1 `RecipeMedia` row.
- `apps/backend/scripts/recipe-media-runtime-audit.mjs` was added to validate the runtime plane itself: recipe count, approved WebP position-1 media coverage, duplicate-media absence, missing hero URLs, and `Recipe.imageUrl` ↔ `RecipeMedia.url` consistency.
- The content bootstrap workflow now runs recipe runtime sync followed by the runtime media audit after the recipe corpus and canonical image mirror are available.
- The full local media-corpus workflow now validates actual WebP decodability with `sharp`, exact 500 movements per discipline, and >=50 movements at each difficulty level 1–10.
- The Full Content Media Corpus workflow was corrected to invoke the local recipe final-media manifest generator (`recipe-media-final-generated-v1.mjs`) rather than a Supabase-only importer, so its audit now matches the artifact it actually creates.
- `workflow_dispatch` was added to the Full Content Media Corpus workflow so the complete corpus gate can be rerun deliberately after credentials/data prerequisites are fixed.
- A package/lockfile regression was detected from CI and corrected by restoring `@nestjs/platform-express` to the backend manifest; the next CI run passed `pnpm install --frozen-lockfile`.

## Actual runtime evidence

The connected content Supabase project was inspected directly:

```text
recipes:                    13,029
recipes with hero rows:     11,643
recipes without hero:        1,386
recipe-images Storage objs: 11,645
```

These numbers are evidence for the connected content project only. They are not a claim that the application's separate runtime database is already populated.

## Validation evidence

- `Recipe Media Real-Image Smoke` run `34098247424`: GREEN. Frozen-lockfile install, real-food fixture, final-media generator, and one-real-image contract all passed.
- `Content Mirror Validation` run `34098387241`: GREEN.
- Full Content Media Corpus run `34098695871`: frozen-lockfile install GREEN; it then exposed a syntax bug in `recipe-image-dataset-import-v2.mjs`, which has since been fixed.
- Content bootstrap run `34098920045`: the workflow reached the credential gate and correctly stopped because `MYPA_RECIPE_DATABASE_URL`, `MYPA_FITNESS_DATABASE_URL`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` are not available to the GitHub Actions runtime. No corpus completion is inferred from that run.
- Latest completed branch commits remain on `agent/mypa-autonomous-control-plane`; no new content milestone was intentionally committed to `main`.

## Remaining blocker

The last-mile population cannot be honestly completed from repository code alone while the target runtime credentials are absent from the automation environment:

```text
MYPA_FITNESS_DATABASE_URL
MYPA_RECIPE_DATABASE_URL
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Once those are available to the workflow, the path is now explicit:

```text
Fitness DB import
  → level balance
  → content audit
  → 4-stage media mirror
  → media verification

Recipe DB import
  → recipe content audit (data-only)
  → real-image dataset mirror
  → Wikimedia fallback for unresolved recipes
  → Supabase exact-one hero audit
  → Prisma runtime media sync
  → Prisma runtime media audit
```

No claim of 13,029 fully imaged runtime recipes or 1,500 fully mirrored exercise movements is made until those final jobs actually pass.
