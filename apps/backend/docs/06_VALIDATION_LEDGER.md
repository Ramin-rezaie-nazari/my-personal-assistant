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

### Safety boundary

This is intentionally a **foundation**, not a claim that the full global ingredient corpus is normalized. Unknown inputs remain `matchedBy: 'unknown'`; no hard allergy/dietary filtering is derived from fuzzy name matching.

### Tests added

`ingredient-taxonomy.service.spec.ts` covers Persian normalization, trusted alias matching, unknown-input behavior, empty input, and deterministic output.

## 2026-09-05 — Food context normalization foundation

### Scope

Added `FoodContextNormalizationService` for conservative cuisine-family and country-code normalization. It accepts known aliases, converts valid two-letter country codes to uppercase, and returns `other`/`null` instead of inventing unsupported semantic matches.

### Tests added

`food-context-normalization.service.spec.ts` covers cuisine aliases, unknown cuisine safety, country-code normalization, and Persian orthography handling.

### Safety boundary

This layer is normalization infrastructure only. It does not replace missing durable recipe metadata and does not enable hard dietary/allergy filtering.

## Next engineering priorities

1. Two-pass review of the validated slice and PR #66 without changing green behavior unnecessarily.
2. Address the P0 Android native voice crash reported for specific Persian TTS voices before expanding voice coverage.
3. Preserve the working Venus/Ganji/Khadijah voice paths while isolating the failing native model/resource lifecycle.
4. Expand canonical ingredient/region/cuisine normalization from verified data and then design durable recipe metadata.
5. Build the mobile food journey against the validated Recommendation Intelligence API.
6. Implement and validate the gender-aware onboarding visual system.
7. Continue production hardening, observability and E2E teardown cleanup.
8. Keep the current validation rule: success output should remain quiet; only failures/errors need to be surfaced during user-runtime test commands.
