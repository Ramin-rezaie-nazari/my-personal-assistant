# Current State — My Personal Assistant

> Operational source of truth for progress, validated checkpoints, completed slices, unfinished work, and the test ledger.
>
> Last fully validated locally: 2026-08-18 before the new Food Operating Loop slice. The latest Food Operating Loop implementation now exists on `main`; its focused/full validation is the next user-environment checkpoint.

## Executive status

**Overall project completion: ~61%**

This is a weighted engineering/product-completion index, not a claim that 61% of every file is written. Backend foundations are strong, the global country-food layer is real, and the connected food loop has now moved substantially forward. Major unfinished product work remains in the verified global recipe corpus, live market pricing, mobile UX, production hardening, and monetization.

## Latest fully green local checkpoint

The last local checkpoint before the new Food Operating Loop implementation was fully green:

```text
Focused global/recipe tests:  4/4 suites, 14/14 tests — PASS
Full backend Jest:           149/149 suites, 398/398 tests — PASS
Backend E2E:                   4/4 suites, 24/24 tests — PASS
Typecheck:                     PASS
Build:                         PASS
```

The new Food Operating Loop changes below have not yet been executed in the user's local runtime, so they are intentionally **not** marked green until that validation happens.

## New Slice — Food Operating Loop

### Implemented on `main`

```text
Recipe
  ↓
Target servings
  ↓
Deterministic scaling
  ↓
Scaled ingredient quantities
  ↓
Inventory comparison using scaled quantities
  ↓
Unit normalization
  ↓
Missing ingredient calculation
  ↓
Shopping-ready handoff
  ↓
Country food context
  ↓
Local currency/finance context
```

A deterministic recommendation path is also implemented:

```text
Recipes + Inventory + Nutrition Profile + Country
  ↓
Inventory coverage + nutrition fit + local relevance
  ↓
Top 10 meal recommendations
```

### New API surface

```text
GET  /recipes/recommendations?servings=2&countryCode=JP
GET  /recipes/:id/food-plan?servings=50&countryCode=JP
POST /recipes/:id/food-plan/shopping?servings=50
```

### Important behavior now implemented

- The requested serving count is mandatory and bounded to `1..10000`.
- Inventory is compared against the **target-serving quantities**, not the recipe base quantity.
- Compatible mass units normalize across g/kg/mg/oz/lb.
- Compatible volume units normalize across ml/l.
- Count units normalize across piece/pcs/count.
- Unknown or incompatible units fail conservatively instead of pretending inventory is sufficient.
- Missing quantities are returned in the recipe unit.
- Missing ingredients can be handed directly to the existing ShoppingService with source=`recipe`.
- Recommendations use inventory coverage, nutrition targets and country relevance deterministically.
- No external Recipe API is needed for this loop.
- Live price estimation is intentionally not fabricated; the price/food-cost trust boundary is not yet global-complete.

### Current Food Operating Loop validation state

**Implementation: complete for this slice.**

**Validation: pending user-environment run.**

Focused tests added:

- `food-operating-loop.service.spec.ts`
- `recipes.controller.spec.ts` updated for the new loop contract

## Recipe Serving Scaling — 100% for current mature slice

Implemented:

- Recipe `servings` persistence.
- DTO validation.
- Deterministic scaling engine.
- `linear`, `sublinear`, `fixed`, `per_batch`, `manual_review` policies.
- Kitchen-friendly quantity rounding.
- Full-batch nutrition.
- Per-serving nutrition.
- Scaled recipe API.
- Unit/service/controller coverage.
- Edge-case coverage.
- Target-serving validation.

Last locally validated:

```text
Focused Recipe Scaling: 2/2 suites, 6/6 tests — PASS
```

## Global Food Intelligence — major slice on main

### Completed in main

- 195-country country-code coverage for the food routing layer.
- Country food profile for each market.
- Cuisine-family context.
- Staple-ingredient context.
- Signature/local recipe discovery anchors.
- Common cooking units.
- Hard-to-source ingredient metadata.
- Deterministic local recipe ranking.
- Explicit global-recipe behavior is preserved; country does not silently replace explicit intent.
- Substitution-policy contract: preserve cuisine identity, prefer local staples, never silently replace culturally important ingredients.
- Country-aware recipe API endpoints.
- Focused tests for exact 195-country coverage, Japan/Iran behavior, ranking, and unknown-country handling.

### Still required for 100%

- Canonical ingredient taxonomy.
- Region/cuisine normalization beyond the routing layer.
- Large verified recipe corpus with full instructions and quantities.
- Nutrition provenance and quality controls.
- Allergens and dietary constraints coverage.
- Ingredient substitutions at production scale.
- Serving-scaling metadata for the full recipe catalog.
- Inventory matching across the full catalog.
- Shopping-list conversion across the full catalog.
- Provenance/versioning for food knowledge.
- Duplicate/alias/cultural-metadata QA.

## Global Currency / Finance Intelligence — major slice on main

### Completed in main

- 195-country local currency registry.
- Fraction-digit metadata.
- Country finance context service.
- Source-native currency preservation policy.
- Currency conversion reserved for comparison/normalization.
- Unknown-country rejection instead of guessing.
- Focused tests for 195-country coverage, Japan, Iran, and unknown-country handling.

### Still required

- Full live-price coverage by country.
- Price-source verification for each market.
- Full country-aware budget planning.
- Recipe → price → budget integration.

## Global Market / Price Intelligence — still separate

A larger stacked workstream exists in PR #48/#49 with a 195-country market/source registry, source routing, discovery-only fallbacks, cached FX, local-time collection scheduling, confidence scoring, and price-source infrastructure.

It is **not yet on `main`** because the workstream is stacked and PR #48 currently reports a non-mergeable state against `main`. It must be integrated deliberately after conflict/dependency review rather than force-merged.

## Mobile product — major work remains

Current main contains an Expo/mobile shell, local language state, and assistant entry behavior.

Remaining:

- Complete auth UX.
- Onboarding UX.
- Home/dashboard.
- Nutrition logging UX.
- Recipe discovery/cooking UX.
- Serving selector and scaled ingredient UI.
- Pantry/inventory UI.
- Shopping UI.
- Fitness/Yoga/Calisthenics/Gym UI.
- Habits/reminders/calendar/supplements UI.
- Brain chat/coach UX.
- Global settings UX.
- Offline/local-first behavior where appropriate.
- Accessibility/responsive behavior.
- Real-device iOS/Android validation.
- Store-release hardening.

## Production hardening — incomplete

Remaining:

- Full security audit.
- Authorization review across domains.
- Rate limiting/abuse controls.
- Production observability.
- Database performance/index review under realistic load.
- Background-job reliability.
- Notification delivery reliability.
- Backup/restore verification.
- Disaster recovery.
- Secret management review.
- Privacy/data-retention review.
- Migration-history review.
- Production deployment runbook.
- Cost controls and external-API fallback policy.
- Clean up the non-fatal E2E worker teardown warning.

## Business / Monetization — not implemented

- Packaging.
- Free/paid boundaries.
- Billing/subscription.
- Pricing experiments.
- Store monetization.
- Growth/retention analytics.
- Referral/viral loops.
- Revenue dashboards.
- Legal/compliance/product policies.

## Progress index

| Workstream | Approx. completion |
|---|---:|
| Backend platform + architecture | 90% |
| Personal Brain / deterministic intelligence | 65% |
| Nutrition foundations | 70% |
| Fitness / Yoga / Calisthenics / Gym | 75% |
| Recipe & Food Intelligence | 55% |
| Inventory / Shopping / Price Intelligence | 62% |
| Mobile product / UX | 20% |
| AI orchestration / voice / globalization | 40% |
| QA / Security / Production hardening | 50% |
| Business / Monetization | 0% |

**Weighted overall index: ~61%.**

## Immediate next priorities

1. Run local validation for the new Food Operating Loop slice.
2. Add verified canonical ingredient/region/cuisine data model.
3. Expand the verified recipe corpus with provenance, allergens and dietary constraints.
4. Integrate the stacked Global Market workstream after dependency/conflict review.
5. Connect verified live price data into Food Operating Loop and budget recommendations.
6. Build the real mobile food journey around these APIs.
7. Add production hardening and observability.
8. Add monetization after the core user journey is genuinely strong.

## Working rule

A slice is 100% only when architecture, implementation, database changes, focused tests, integration/E2E tests, documentation, and required environment validation are all green. Do not weaken assertions to obtain green tests.
