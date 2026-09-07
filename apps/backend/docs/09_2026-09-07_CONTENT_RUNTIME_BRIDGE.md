# 2026-09-07 — Content runtime bridge milestone

This appendix records the concrete work added during the autonomous continuation of the recipe/fitness corpus effort.

## What was implemented

- Recipe release media remains exactly one finished-dish hero per recipe; preparation/process galleries are not release media.
- The real licensed recipe-image dataset remains the primary source. Unresolved images may use the audited licensed Wikimedia Commons fallback. Generated recipe illustrations are not accepted as release heroes.
- `apps/backend/scripts/recipe-image-import-all-safe.mjs` was hardened to search compound recipe names more effectively while retaining license and relevance checks.
- `apps/backend/scripts/recipe-media-runtime-sync.mjs` was added as the explicit bridge between the content Supabase `recipe_images`/Storage plane and the application Prisma `Recipe`/`RecipeMedia` plane. For every matching runtime recipe it writes the canonical hero URL to `Recipe.imageUrl` and creates exactly one approved position-1 `RecipeMedia` row.
- `apps/backend/scripts/recipe-media-runtime-audit.mjs` was added to validate the runtime plane itself: recipe count, approved WebP position-1 media coverage, duplicate-media absence, missing hero URLs, and `Recipe.imageUrl` ↔ `RecipeMedia.url` consistency.
- The content bootstrap workflow now runs recipe runtime sync followed by the runtime media audit after the recipe corpus and canonical image mirror are available.
- The full local media-corpus workflow now validates actual WebP decodability with `sharp`, exact 500 movements per discipline, and >=50 movements at each difficulty level 1–10.
- A package/lockfile regression was detected from CI and corrected by restoring the expected dev dependency manifest; the real-image smoke subsequently passed frozen-lockfile install and the one-real-image contract.

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
- `Content Mirror Validation` run `34098247318`: GREEN.
- Content bootstrap run `34098407633`: the jobs reached the credential gates and correctly stopped because the required runtime database/Supabase secrets were unavailable to GitHub Actions. No corpus completion is inferred from that run.
- The latest branch is `agent/mypa-autonomous-control-plane`; no work from this milestone was intentionally committed to `main`.

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
  → recipe content audit
  → real-image dataset mirror
  → Wikimedia fallback for unresolved recipes
  → Supabase exact-one hero audit
  → Prisma runtime media sync
  → Prisma runtime media audit
```

No claim of 13,029 fully imaged runtime recipes or 1,500 fully mirrored exercise movements is made until those final jobs actually pass.
