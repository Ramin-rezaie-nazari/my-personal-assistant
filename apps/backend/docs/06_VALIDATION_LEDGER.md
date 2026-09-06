# Validation Ledger — My Personal Assistant

> Append-only engineering checkpoint record for validated repository/runtime gates. This file complements `05_CURRENT_STATE.md` and must never be used to overstate CI or device validation.

## 2026-09-06 — Corpus pipeline hardening (not yet runtime-green)

### Scope

Restored the real recipe-content importer, added a recipe corpus audit, hardened fitness media verification, split GitHub Actions corpus gates, and recorded the execution blocker found in the first corpus run.

### Changes

- Restored `apps/backend/scripts/recipe-content-import.mjs` using the Wikibooks Cookbook dataset source and explicit CC BY-SA provenance.
- Recipe import requires non-empty title, ingredients and procedural steps before a recipe can be imported; malformed rows are skipped and failed rows make the job fail.
- Recipe writes for each recipe are transactional so ingredients and steps cannot partially persist.
- Added `apps/backend/scripts/recipe-content-audit.mjs` and exposed it through `recipe:content:audit`.
- Recipe audit rejects empty corpora and checks required fields, ingredient quantity/unit integrity, contiguous step numbering, verification state, media/provenance coverage, and duplicate normalized names.
- Split `.github/workflows/content-corpus-bootstrap.yml` into independent Fitness, Recipe, and Recipe-image jobs so unrelated infrastructure blockers do not mask other pipeline health.
- Fitness push runs remain strict by default; manual dispatch can explicitly relax the movement media gate for exploratory runs.
- Fitness media verification now checks actual HTTP/content-type behavior and rejects an empty approved-media set.
- Added progress-log entries documenting all of the above to prevent duplicate future work.

### Actual validation

GitHub Actions run `34034400326` / job `101489715731` failed at the runtime-secret check because `MYPA_FITNESS_DATABASE_URL`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` were not available to the runner. The job therefore did **not** perform import, audit, or media download. This is a real environment blocker, not an application test failure.

A new run (`34035170619`) was triggered by the split workflow changes and was observed in progress; it is not claimed green from the in-progress state.

### Required next validation

Once the correct runtime database/storage secrets are supplied:

```text
pnpm install --frozen-lockfile       REQUIRED
pnpm prisma generate                 REQUIRED
fitness import                       REQUIRED
fitness balance                      REQUIRED
fitness audit                        REQUIRED
fitness media verify                 REQUIRED
recipe import                        REQUIRED
recipe content audit                 REQUIRED
recipe image corpus import           REQUIRED
```

The release corpus target remains 500 published movements per discipline, ten levels, >=50 movements per level and >=4 approved WebP assets per movement, plus a non-empty validated recipe corpus and complete image/provenance coverage.

No 100% corpus claim is allowed until these commands/jobs actually pass.

## 2026-09-05 — Recommendation Intelligence vertical slice

### Scope

Deterministic Recommendation Intelligence built on top of the canonical Food Operating Loop, including personalization, stable ranking/diversification, explainability, authenticated API exposure, and strict request validation.

### User-runtime validation

All required backend gates completed successfully on the user's local macOS runtime:

```text
pnpm install --frozen-lockfile    PASS
pnpm run typecheck                PASS
pnpm run build                    PASS
focused Recommendation tests     PASS (2 suites, 5 tests)
full backend Jest                 PASS (160 suites, 429 tests)
Recommendation Intelligence E2E   PASS
```

### Result

**Recommendation Intelligence backend vertical slice: VALIDATED GREEN locally.**

No database migration was required for this slice. Existing Food Operating Loop logic remains the canonical recipe/serving/inventory/nutrition execution path.

### Known non-blocking issue

The E2E run has historically emitted a Jest open-handle / worker-teardown warning after tests complete. The warning does not change the observed E2E result, but it remains a production-hardening item and must not be silently forgotten.

## 2026-09-05 — Canonical ingredient taxonomy foundation

### Scope

Added a conservative, provider-independent `IngredientTaxonomyService` with explicit trusted aliases for a small starter registry. The service normalizes Persian/Arabic orthography, preserves unknown ingredients without guessing, exposes food-group classification, confidence and provenance, and is registered by `RecipesModule`.

### Tests

`ingredient-taxonomy.service.spec.ts` covers Persian normalization, trusted aliases, unknown-input behavior, empty input, provenance/confidence and batch canonicalization.

### Safety boundary

This remains a **foundation**, not a claim that the full global ingredient corpus is normalized. No hard allergy/dietary filtering is derived from fuzzy name matching.

## 2026-09-05 — Food context normalization foundation

### Scope

Added `FoodContextNormalizationService` for conservative cuisine-family and country-code normalization. It accepts known aliases, converts valid two-letter country codes to uppercase, and returns `other`/`null` instead of inventing unsupported semantic matches.

### Tests

`food-context-normalization.service.spec.ts` covers cuisine aliases, unknown cuisine safety, country-code normalization and Persian orthography handling.

### Safety boundary

This layer is normalization infrastructure only. It does not replace missing durable recipe metadata and does not enable hard dietary/allergy filtering.

## 2026-09-05 — Voice P0 lifecycle checkpoint

### Static finding

The tracked Persian local TTS provider caches a shared native `TtsEngine`. Playback cancellation used a token, but in-flight `generateSpeech()` work was not explicitly serialized against subsequent generation or engine destruction. This is a credible native-lifecycle hypothesis for the reported Android mutex crash, but it is **not** proof of the root cause.

### Hardening implemented

`apps/mobile/lib/local-persian-tts.ts` now serializes native TTS operations through a single promise queue. Release marks the provider as releasing before entering that queue, so new generations are blocked while an already-running native generation is allowed to finish. Engine destruction is then queued after the active native operation.

Generated audio cleanup and stale playback-token protection remain in place.

### Required device validation

The local Android candidate WIP must still be inspected and tested for shared-engine vs fresh-engine behavior, repeated generation, stop/interruption, voice switching, background/foreground and release. Known-good Venus/Ganji/Khadijah paths remain protected from speculative changes.

## 2026-09-05 — Shopping authorization hardening

### Finding

`ShoppingService` previously loaded `foodItem` and `recipe` by ID alone. That allowed a caller with another user's identifier to reference a private food item or recipe while creating shopping data under the caller's own account.

### Fix

- Food lookup is now constrained to global food (`userId: null`) or the authenticated caller.
- Recipe lookup is now constrained to global recipe (`userId: null`) or the authenticated caller.
- Invalid shopping quantities are now rejected with `BadRequestException` and require a finite positive number.
- Added regression tests covering cross-user food and recipe access boundaries.

### Validation

**User-runtime regression validated: PASS (1 suite / 2 tests).**

The existing Inventory and Recipes services already apply equivalent ownership boundaries.

## 2026-09-05 — Mobile visual theme foundation

### Scope

Added a provider-independent visual theme contract with `default` and `feminine` themes, plus persisted onboarding theme state derived from the selected gender. The design keeps the theme as a presentation concern rather than branching business logic.

### Status

**Foundation implemented; full UI rollout and physical-device validation remain pending.**

## 2026-09-05 — Mobile localization hardening

### Scope

Introduced a single reactive locale store for the mobile application with persistence in AsyncStorage. Locale changes now notify mounted screens rather than requiring each route to re-read the stored locale once during mount.
