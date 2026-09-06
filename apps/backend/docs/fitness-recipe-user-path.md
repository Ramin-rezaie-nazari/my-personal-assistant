# Recipe + Fitness User Path

## User-facing path

The mobile app now exposes both domains from the existing Meals screen:

- Recipe Library: searchable, paginated cards -> recipe detail -> serving scaling -> add missing ingredients to shopping.
- Fitness: unified Gym / Calisthenics / Yoga hub -> ten-level selector -> exercise detail -> guided Gym/Calisthenics session or the existing Yoga coach.

## Recipe library contract

`GET /recipes/library` is JWT-protected and returns at most 50 lightweight recipe cards per request. It searches by name, supports verified filtering, includes global recipes (`userId = null`) and the current user's recipes, and reports pagination metadata. This prevents the mobile client from downloading the full recipe corpus for a screen.

Recipe detail continues to use the existing recipe domain and deterministic serving-scaling service. The mobile client does not implement its own scaling math.

## Fitness catalog contract

`GET /fitness/catalog` is JWT-protected and accepts `discipline`, `level` 1-10, `q`, pagination and equipment. The response always includes the ten-level scale and an explicit media policy of four WebP images per movement.

The current bridge uses the public-domain Free Exercise DB (Yuhonas) as an external catalog source for Gym and Calisthenics when available. Its source records expose two JPG images per exercise; MYPA exposes a WebP derivative URL and marks `mediaComplete=false` until four distinct images are present. No duplicate image is invented to satisfy the quota.

## Content coverage status

The ten-level UX is implemented, but the current repository does **not** yet contain a durable, audited 500-exercise corpus for each discipline. The existing curated Gym/Calisthenics/Yoga libraries are intentionally much smaller, and the external public-domain bridge does not guarantee 500 qualifying unique items for every discipline.

Yoga is especially constrained: the current repository library remains the source of truth until a commercially compatible, properly licensed yoga corpus is approved. A research-only dataset must not be silently copied into a production commercial app.

## Next durable ingestion step

For production-scale content, move from runtime fetch to an audited ingestion pipeline and storage model with:

1. stable exercise records and ten-level difficulty assignments;
2. four or more distinct media records per movement;
3. source URL, provider, license, attribution and audit status;
4. stored WebP derivatives in object storage/CDN;
5. deterministic deduplication and content QA before publishing.

That future database change should be reviewed separately before migration because it changes the content architecture and release workflow.
