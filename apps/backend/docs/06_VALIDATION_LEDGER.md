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
full backend Jest                 PASS
Recommendation Intelligence E2E   PASS
```

The focused tests include the controller validation regressions and recipe image compression regression that were fixed immediately before this checkpoint.

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

## Checkpoint status

**Backend Recommendation Intelligence: validated green locally.**

**Food taxonomy/context: foundation implemented; durable schema work intentionally deferred pending two-pass Prisma review.**

**Voice P0: lifecycle race narrowed in tracked JS/native boundary; unresolved pending lockfile validation and direct Android WIP/device evidence.**

## Next engineering priorities

1. Validate the updated mobile dependency graph and type/bundle the app.
2. Resolve the P0 Android voice lifecycle issue using the local candidate WIP and real-device evidence.
3. Complete the two-pass Prisma review for durable canonical recipe metadata.
4. Build the mobile food journey against the validated Recommendation Intelligence API.
5. Implement and validate the gender-aware onboarding visual system.
6. Continue production hardening, observability and E2E teardown cleanup.
7. Keep the current validation rule: success output should remain quiet; only failures/errors need to be surfaced during user-runtime test commands.
