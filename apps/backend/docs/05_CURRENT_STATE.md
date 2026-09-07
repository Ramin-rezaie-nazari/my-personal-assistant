# Current State — My Personal Assistant

> Operational source of truth for progress, validated checkpoints, completed slices, unfinished work, and the test ledger.
>
> Latest fully validated local backend checkpoint remains 2026-09-05. New corpus/media pipeline changes are implemented and are not claimed runtime-green until the actual production database/storage population and audits complete.

## Executive status

**Overall project completion: ~66%**

This weighted index is intentionally conservative. The project has substantial backend/product foundations, but 100% requires real corpus population, media mirroring, native integrations, device validation, production hardening, and store-release evidence.

## Latest corpus/media truth — 2026-09-07

### Implemented on the autonomous branch

- Recipe media policy is **exactly one image per recipe**, and the image is the canonical **finished-dish hero** rather than a preparation/process gallery.
- Canonical recipe source priority is the real licensed recipe-image dataset using exact `recipe_source_raw.image_name` mapping. Unresolved records have a separately audited Wikimedia Commons fallback. Generated recipe illustrations are not accepted as release media.
- `recipe-image-dataset-import-v2.mjs` supports force-dataset mode, rewrites canonical heroes to `recipes/<recipeId>/hero.webp`, records CC BY-SA 3.0 provenance, and enforces a <=60KB WebP budget.
- `recipe-image-import-all-safe.mjs` performs conservative licensed Wikimedia fallback searches and prevents repeated attempts for the same recipe inside one run.
- A partial unique index is applied in the connected Supabase content DB to enforce **at most one hero row per recipe** for `image_type='hero'`.
- Fitness media policy is **exactly four distinct images per movement**, ordered `Start`, `Setup`, `Movement`, `Finish`. The current generated stage renderer produces four distinct stage-specific illustrations from exercise instructions.
- Reusable `recipe-media-release-audit.mjs` was added and exposed as `pnpm recipe:media:audit`.
- Content bootstrap workflow separates fitness corpus, fitness media, recipe corpus, recipe real-image mirror, Wikimedia fallback, and final exact-one hero audit.
- Device-health unavailable-state tests were added to lock the native-provider boundary and forbid synthetic health values before real native bridges exist.

### Runtime validation and hard blockers

- Live Supabase inspection showed 13,029 recipes and, after duplicate cleanup, 11,643 recipes with exactly one hero; 1,386 recipes still lacked a hero.
- Source mapping contains 12,983 recipe IDs with usable `image_name` values; 30 source rows contain `#NAME?`, and 16 recipes have no source row.
- GitHub Actions currently lacks the runtime credentials required to perform actual Storage population (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) and the separate database secrets used by the full recipe/fitness content jobs (`MYPA_RECIPE_DATABASE_URL`, `MYPA_FITNESS_DATABASE_URL`). Live population is therefore **PENDING**.
- Recipe real-image smoke workflow `34094916385` passed and proves the one-real-finished-dish-WebP contract on a controlled fixture.
- Full corpus is not marked green until runtime Storage population and the exact-one audit pass against all release recipes.

### Completion evidence required

Fitness:
- 500 published movements per discipline (Gym, Calisthenics, Yoga)
- all 10 difficulty levels represented with >=50 publishable movements per level
- exactly 4 deliverable images per movement in Start/Setup/Movement/Finish order
- source downloads complete and final media URLs point to mirrored application assets
- final WebP verification passes

Recipes:
- large non-empty runtime corpus
- each release recipe has >=3 ingredients and >=2 contiguous procedural steps
- exactly 1 finished-dish hero per release recipe
- approved hero assets are downloaded/converted to WebP, mirrored to application Storage, and connected to the runtime recipe media layer
- exact-one audit passes with zero missing, duplicate, generated, or non-WebP heroes

## Latest validated local checkpoint — 2026-09-05

```text
Frozen-lockfile backend install:       PASS
Backend typecheck:                     PASS
Backend build:                         PASS
Recommendation focused tests:          PASS (2 suites / 5 tests)
Full backend Jest:                     PASS (160 suites / 429 tests)
Recommendation Intelligence E2E:       PASS
Shopping ownership regression tests:   PASS (1 suite / 2 tests)
Food taxonomy Prisma design review:    PASS (two-pass review completed)
Food taxonomy migration runtime/CI:    PENDING
Mobile typecheck/export/device:        PENDING
```

## Remaining P0/P1/P2 gates

### P0 — Native voice

- JS lifecycle hardening is implemented.
- Real Android device validation remains required for Persian local TTS, including interruption, repeated generation, voice switching, and release lifecycle.

### P1 — Native health integrations

- Architecture boundary exists and explicit unavailable behavior is tested.
- Real Apple HealthKit integration on iOS and Android Health Connect integration on Android are not yet installed/configured on the current branch.
- Physical-device permission and data read/write validation remains required.

### P1 — Yoga live camera analysis

- Session UI and safety contract exist.
- `UnconfiguredYogaCameraBridge` remains the explicit safe default.
- A real compatible native frame/pose provider and device validation are required before this is complete.

### P2 — Play Store readiness

- Debug APK build is not store readiness.
- Remaining gates include signed release build, install/upgrade testing, privacy/data declarations, notification behavior, crash reporting, production backend configuration, and store metadata.

## Progress index

| Workstream | Approx. completion |
|---|---:|
| Backend platform + architecture | 91% |
| Personal Brain / deterministic intelligence | 66% |
| Nutrition foundations | 74% |
| Fitness / Yoga / Calisthenics / Gym | 75% |
| Recipe & Food Intelligence | 68% |
| Inventory / Shopping / Price Intelligence | 72% |
| Mobile product / UX | 25% |
| AI orchestration / voice / globalization | 43% |
| QA / Security / Production hardening | 54% |
| Business / Monetization | 0% |

**Weighted overall index: ~66%.**

## Repetition-prevention rule

Before every autonomous batch, read `08_AUTONOMOUS_PROGRESS_LOG.md`, this file, `03_PROJECT_BRAIN_BOOK.md`, and `04_ARCHITECTURE_ATLAS.md`. A previously implemented slice is not rebuilt merely because its validation was pending. The next action must be the missing validation or a root-cause fix discovered by that validation.
