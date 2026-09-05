# Validation Ledger — My Personal Assistant

> Append-only engineering checkpoint record for validated repository/runtime gates. This file complements `05_CURRENT_STATE.md` and must never be used to overstate CI or device validation.

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

### Repository state note

The user's local workspace contains unrelated voice/native experimentation and runner WIP. Those files are intentionally not included in the Recommendation Intelligence change set.

## 2026-09-05 — Canonical ingredient taxonomy foundation

### Scope

Added a conservative, provider-independent `IngredientTaxonomyService` with explicit trusted aliases for a small starter registry. The service normalizes Persian/Arabic orthography, preserves unknown ingredients without guessing, exposes food-group classification, and is registered by `RecipesModule`.

### Hardening completed

- Canonical results now expose `confidence` and `provenance`.
- Unknown/empty inputs resolve explicitly as `unresolved-input` with zero confidence.
- A precomputed lookup map avoids repeated registry scans.
- `canonicalizeMany(...)` provides deterministic batch normalization.
- Result objects expose only the public contract; registry alias internals are not leaked.

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

### Runtime dependency correction

The mobile manifest now explicitly declares the packages used by the tracked local voice path: `expo-av`, `expo-file-system`, and `react-native-sherpa-onnx`.

The manifest currently targets Expo SDK 53 / React Native 0.79, with `expo-av ~15.1.7` and `react-native-sherpa-onnx ^0.4.3`.

This change still requires a fresh lockfile update plus mobile typecheck/Expo export validation on the user's runtime before it can be marked green.

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

### Implemented

- Root layout initializes the locale once at app startup and synchronizes RTL configuration.
- Language selection persists and immediately publishes the selected locale.
- Auth, Assistant, Command Center, Daily, Calendar, Notifications, Habits, Inventory, Shopping, Meals, Smart Meals, Reminders, Recipe Match, Insights, Brain Overview, Supplements and Yoga now consume the global locale on this branch.
- Common Farsi/English navigation labels, loading states, errors, empty states and action labels were localized across the migrated routes.
- Calendar, notification, meal and reminder date/time formatting now follow the selected locale where displayed by the UI.
- Reminders was replaced with a locale-aware implementation behind the same route so its original route contract remains stable.
- Quick Command result messages and the generated assistant reminder title now use the shared locale contract rather than hardcoded English strings.

### Design boundary

This is a localization architecture hardening pass across the current top-level mobile route set, not a claim that every future nested screen/component or server-provided free-form content is linguistically translated. Dynamic domain content may still originate from backend data and must not be silently mistranslated.

### Runtime status

Mobile typecheck and Expo export/device validation are still required on the user's runtime after this batch because the GitHub connector cannot execute the local Expo toolchain. CI status for the latest branch head is running and must be rechecked before claiming green.

## 2026-09-05 — Durable food taxonomy persistence design + migration

### Scope

Completed two explicit reviews of the canonical food metadata persistence boundary and added an additive Prisma schema/migration for durable ingredient, cuisine, region and safety metadata.

### Pass 1 — architecture boundaries

- Existing free-text fields remain authoritative for display/history.
- Canonical IDs are separate from display names.
- Country, region and cuisine remain separate concepts.
- Safety data is explicit and provenance-backed.
- Hard allergy/dietary filtering remains disabled until verified metadata exists.
- No fuzzy or learned matching is introduced into the safety boundary.

### Pass 2 — persistence/compatibility

- `IngredientCanonical` and `IngredientCanonicalAlias` provide canonical identity plus alias provenance/versioning.
- `FoodItem.canonicalIngredientId` and `RecipeIngredient.canonicalIngredientId` are nullable and indexed.
- `CuisineCanonical` supports parent/child hierarchy.
- `RegionCanonical` preserves country/region separation.
- `RecipeCuisine` and `RecipeRegion` are many-to-many joins.
- `RecipeSafetyAssertion` is explicit, deduplicated, provenance-backed and verification-aware.
- Deleting canonical entities does not delete food/recipe rows; nullable links use `SET NULL`.
- The migration contains no backfill or destructive rewrite.

### Migration

`20260905160000_add_food_taxonomy_relations/migration.sql` was added to the branch.

### Runtime status

Schema/migration generation, deploy, idempotence and full backend gates still require runtime/CI validation. Until those pass, this workstream remains implemented but not fully green.

## 2026-09-05 — CI correction + new validation run

The backend CI unit-test invocation was corrected from an invalid Jest argument pattern to an explicit Jest command. Mobile RefreshControl syntax regressions were patched in the affected localized routes. New GitHub Actions runs are currently executing against the updated branch.

## Checkpoint status

**Backend Recommendation Intelligence: validated green locally.**

**Food taxonomy/context normalization: foundation implemented and tested.**

**Food taxonomy durable schema: implemented after two-pass review; runtime/CI migration validation pending.**

**Shopping authorization: ownership boundary hardened; focused regression validated on user runtime (1 suite / 2 tests).**

**Mobile visual theme: foundation implemented; full UI wiring/device validation pending.**

**Mobile localization: global reactive locale architecture plus current top-level route rollout implemented; runtime validation pending.**

**Voice P0: lifecycle race narrowed in tracked JS/native boundary; unresolved pending lockfile validation and direct Android WIP/device evidence.**

## Next engineering priorities

1. Validate the new Prisma migration with schema generation, deploy/status/idempotence and the existing backend gates.
2. Add a small verified ingredient/cuisine seed set with explicit provenance and no unsafe backfill.
3. Finish the nested mobile localization audit and Recommendation API → mobile food journey integration.
4. Complete the feminine/default theme rollout and focused mobile validation.
5. Resolve the P0 Android voice lifecycle issue using the user's local candidate WIP and real-device evidence.
6. Continue authorization, rate-limit, observability and E2E teardown cleanup.
7. Review and integrate Global Market / Price Intelligence only after dependency/conflict/regression checks.
8. Keep successful test output quiet; surface only final results and failures.
