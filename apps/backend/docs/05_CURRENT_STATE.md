# Current State — My Personal Assistant

> Operational source of truth for progress, validated checkpoints, completed slices, unfinished work, and the test ledger.
>
> Latest fully validated local backend checkpoint remains 2026-09-05. New corpus/media pipeline changes are implemented and are not claimed runtime-green until the actual production database/storage population and audits complete.

## Executive status

**Overall project completion: ~66%**

This weighted index is intentionally conservative. The project has substantial backend/product foundations, but 100% requires real corpus population, media mirroring, native integrations, device validation, production hardening, and store-release evidence.

## Latest corpus/media truth — 2026-09-07

### Implemented

- Recipe media policy is now **exactly one image per recipe**, and that image is the canonical **finished-dish hero** rather than a preparation/process gallery.
- Canonical recipe source priority is the real licensed recipe-image dataset using the exact `recipe_source_raw.image_name` mapping; unresolved records use a separately audited Wikimedia Commons fallback. Generated recipe illustrations are not accepted as release media.
- `apps/backend/scripts/recipe-image-dataset-import-v2.mjs` now supports a force-dataset mode that rewrites canonical recipe heroes to `recipes/<recipeId>/hero.webp`, records CC BY-SA 3.0 provenance and enforces a <=60KB WebP budget.
- `apps/backend/scripts/recipe-image-import-all-safe.mjs` retries unresolved dataset rows through a licensed Wikimedia Commons search and keeps the same single-hero storage contract.
- A partial unique index was applied in the connected Supabase content DB to enforce **at most one hero row per recipe** for `image_type='hero'`.
- Fitness media policy remains **exactly four distinct images per movement**, ordered as `Start`, `Setup`, `Movement`, `Finish`. The generated stage renderer now produces distinct stage poses rather than four identical assets.
- `.github/workflows/content-corpus-bootstrap.yml` contains separate corpus/image/fallback gates plus an exact-one recipe hero audit and four-stage fitness audit.

### Runtime validation

- Live Supabase inspection showed 13,029 recipes and, before the canonical remirror run, 11,643 recipes with one hero after duplicate cleanup; 1,386 recipes still lacked a hero.
- Source mapping contains 12,983 recipe IDs with usable `image_name` values; 30 source rows contain `#NAME?`, and 16 recipes have no source row. These are the known coverage edges that must be handled by fallback/source repair.
- GitHub Actions currently lacks the runtime credentials required to perform the actual Storage mirror (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) and also lacks the separate corpus database secrets used by the full recipe/fitness import jobs. Therefore the production population is **PENDING**, not green.
- Recipe real-image smoke validation is green on GitHub (`34094916385`) and proves one real finished-dish WebP asset without generated fallback.
- The full/live corpus has not been marked complete because credential-gated runs stop before population.

### Required completion evidence

Fitness must prove:
- 500 published movements per discipline (Gym, Calisthenics, Yoga);
- all 10 difficulty levels represented with >=50 publishable movements each;
- exactly 4 approved/deliverable images per movement in Start/Setup/Movement/Finish order;
- source downloads completed and final `webpUrl` values point to mirrored application assets;
- final WebP verification passes.

Recipes must prove:
- non-empty large runtime corpus from the source dataset;
- every release recipe verified with >=3 ingredients and >=2 contiguous procedural steps;
- exactly 1 finished-dish hero per release recipe;
- every approved hero asset downloaded/converted to WebP, mirrored to application Storage and linked through the runtime recipe media layer;
- exact-one audit passes with zero missing, duplicate, generated or non-WebP heroes.

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
- Real Android device validation remains required for Persian local TTS, including interruption, repeated generation, voice switching and release lifecycle.

### P1 — Native health integrations

- Architecture boundary exists.
- Real Apple HealthKit integration on iOS and Android Health Connect integration on Android are not yet installed/configured on the current branch.
- Physical-device permission and data-read/write validation remains required.
- The product cannot honestly promise direct support for every watch brand; platform hubs are the scalable integration boundary.

### P1 — Yoga live camera analysis

- Session UI and safety contract exist.
- `UnconfiguredYogaCameraBridge` is still the explicit safe default.
- A real compatible native frame/pose provider and device validation are required before this is complete.

### P2 — Play Store readiness

- Debug APK build is not store readiness.
- Remaining gates include signed release build, install/upgrade testing, privacy/data declarations, notification behavior, crash reporting, production backend configuration and store metadata.

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

Before every autonomous batch, read `08_AUTONOMOUS_PROGRESS_LOG.md`, this file, `03_PROJECT_BRAIN_BOOK.md` and `04_ARCHITECTURE_ATLAS.md`. A previously implemented slice is not rebuilt merely because its validation was pending. The next action must be the missing validation or a root-cause fix discovered by that validation.
