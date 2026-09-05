# Current State — My Personal Assistant

> Operational source of truth for progress, validated checkpoints, completed slices, unfinished work, and the test ledger.
>
> Latest fully validated locally: 2026-08-18 11:26+03:30. The Food Operating Loop, Meal Planner and Recipe Scaling Metadata slice is fully green on the user's local runtime.

## Executive status

**Overall project completion: ~65%**

This is a weighted engineering/product-completion index, not a claim that 65% of every file is written. Backend foundations are strong, the 195-country food/currency layer is real, and the connected food loop now spans scaling, inventory, shopping handoff, recommendations and daily meal planning. Major unfinished product work remains in the verified global recipe corpus, live market pricing, mobile UX, production hardening, and monetization.

## Latest fully green local checkpoint — 2026-08-18

```text
Focused Food Operating Loop slice:  5/5 suites, 14/14 tests — PASS
Full backend Jest:                  152/152 suites, 408/408 tests — PASS
Backend E2E:                         4/4 suites, 24/24 tests — PASS
Typecheck:                            PASS
Build:                                PASS
Prisma migrate deploy:               PASS
Prisma migrate status:               Database schema is up to date
```

The non-fatal E2E worker teardown warning remains, but all E2E suites/tests pass.

## Current work — Food Decision Brain vertical slice

A deterministic Recommendation Intelligence vertical slice is now implemented on top of the canonical Food Operating Loop. The goal is orchestration, personalization and explainability without creating a second recipe-calculation engine.

### Implemented in the current branch

- `RecommendationEngineService` now obtains a compact user food context and delegates recipe/serving/inventory/nutrition calculations to `FoodOperatingLoopService`.
- `PersonalizationService` reads primary goal, nutrition targets, diet type and recent nutrition-log titles into a compact deterministic context.
- `RecommendationRankingService` applies stable score ordering with top-three recipe-family diversification.
- Authenticated `POST /recommendation-intelligence/food` is exposed through `RecommendationIntelligenceController`.
- `RecommendationIntelligenceModule` is wired into `AppModule` and imports the canonical `RecipesModule` plus `PrismaModule`.
- `FoodOperatingLoopService.recommend(...)` now supports an explicit `maxMissingIngredients` threshold before final ranking.
- Recommendation output contains deterministic reasons, base score, personalization adjustment, recent-meal flag and final rank.
- No database migration was introduced because the current `Recipe` model does not provide structured cuisine, allergen or dietary-tag fields required for safe hard filtering.

### Focused tests added

- `recommendation-engine.service.spec.ts`
- `recommendation-ranking.service.spec.ts`
- `personalization.service.spec.ts`
- `recommendation-intelligence.controller.spec.ts`
- `recommendation-intelligence.e2e-spec.ts`
- `food-operating-loop.service.spec.ts` extended for strict missing-ingredient thresholds.

### Design boundaries intentionally preserved

- Country remains a relevance/context signal, not a hard cuisine restriction.
- Existing Food Operating Loop remains the canonical serving, inventory and nutrition execution path.
- Live prices are not fabricated.
- Explanations are derived from actual deterministic scoring/context evidence.
- Structured allergy/dietary hard filters and true structured cuisine matching remain **not implemented** until recipe metadata supports them safely. They must not be simulated from recipe names or other weak heuristics.

### Current validation state

**NOT YET VALIDATED GREEN.** Code and focused tests have been committed to the autonomous branch, but this environment cannot execute the repository's local `pnpm` toolchain against the user's database/runtime. CI status for the latest branch commit is not yet surfaced by the available GitHub status endpoint.

The first user-runtime attempt exposed two integration/setup issues that have now been addressed in the branch:

- The backend manifest had accidentally dropped the existing `sharp` dependency and loosened the Prisma package pins while leaving the lockfile unchanged. The manifest has been restored to the lock-compatible dependency intent, including `sharp` and exact Prisma 7.9.1 client/adapter versions.
- The Recommendation Intelligence request DTO had no `class-validator` metadata. Because the test app uses a global whitelist/forbid-non-whitelisted validation pipe, this could reject valid request payloads. The DTO now has explicit validation/transformation decorators and bounds.

The user-runtime output also showed that passing `--runInBand` as `pnpm test -- --runInBand` results in Jest receiving a literal `--` argument. The correct invocation is `pnpm test --runInBand`; the existing `test:e2e` script already includes `--runInBand`, so it should be invoked as `pnpm test:e2e` without another separator/flag.

Required next validation checkpoint:

1. `pnpm install --frozen-lockfile` from the repository root;
2. backend typecheck;
3. backend build;
4. focused Recommendation Intelligence tests;
5. full backend Jest;
6. Recommendation Intelligence E2E;
7. review test output and fix any compile/runtime issues;
8. only then mark this slice green and update the progress index.

## New Slice — Food Operating Loop + Meal Planning + Recipe Scaling Metadata

### Implemented on `main`

```text
Recipe + persisted ingredient scaling metadata
  ↓
Target servings
  ↓
Deterministic scaling engine
  ↓
Scaled ingredient quantities
  ↓
Inventory comparison using target quantities
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
  ↓
Deterministic meal recommendation
  ↓
Deterministic daily meal plan
```

### Persisted RecipeIngredient scaling metadata

Each recipe ingredient now has:

- `measurementKind`
- `scalingPolicy`
- `scalingExponent`
- `batchSize`
- `maxLinearMultiplier`

The values can be supplied explicitly through the Recipe DTO. When omitted, the backend applies conservative deterministic inference rather than silently changing the user's recipe intent.

### New Food APIs

```text
GET  /recipes/recommendations?servings=2&countryCode=JP
GET  /recipes/meal-plan?servings=2&countryCode=JP
GET  /recipes/:id/food-plan?servings=50&countryCode=JP
POST /recipes/:id/food-plan/shopping?servings=50
```

### New Meal Plan API

```text
GET /budget-intelligence/meal-plan?servings=2&countryCode=JP
```

### Current guarantees

- Requested serving count is explicit and bounded to `1..10000`.
- Inventory is compared against **target-serving quantities**.
- Compatible mass units normalize across g/kg/mg/oz/lb.
- Compatible volume units normalize across ml/l.
- Count units normalize across piece/pcs/count.
- Unknown/incompatible units fail conservatively.
- Missing quantities are returned in the recipe's requested unit.
- Missing items can be handed directly to ShoppingService.
- Recommendations use inventory coverage, nutrition targets and country relevance deterministically.
- Daily meal planning uses nutrition targets and distinct recommendations where possible.
- Recipe scaling consumes persisted per-ingredient scaling policies instead of forcing every ingredient into linear scaling.
- No external Recipe API is required for these flows.
- Live price values are deliberately not fabricated because global verified price coverage is not complete.

### Validation state

**Implementation: complete for this current slice.**

**Local validation: 100% green.**

Focused tests:

- `food-operating-loop.service.spec.ts`
- `recipes.controller.spec.ts`
- `meal-planning.service.spec.ts`
- `budget-intelligence.controller.spec.ts`
- `recipes.service.scaling.spec.ts`

Focused result: **5/5 suites, 14/14 tests — PASS**.

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
- Explicit global-recipe behavior preserved.
- Cuisine-preserving substitution policy.
- Country-aware recipe API endpoints.
- Focused tests for exact 195-country coverage, Japan/Iran behavior, ranking and unknown-country handling.

### Still required for 100%

- Canonical ingredient taxonomy.
- Region/cuisine normalization beyond routing.
- Large verified recipe corpus with complete instructions and quantities.
- Nutrition provenance and quality controls.
- Allergens and dietary constraints coverage.
- Production-scale ingredient substitutions.
- Serving-scaling metadata for the entire catalog (architecture now ready; corpus population remains).
- Inventory matching across the full catalog.
- Shopping conversion across the full catalog.
- Provenance/versioning.
- Duplicate/alias/cultural-metadata QA.

## Global Currency / Finance Intelligence — major slice on main

### Completed in main

- 195-country local currency registry.
- Fraction-digit metadata.
- Country finance context.
- Source-native currency preservation policy.
- Comparison/normalization-only FX contract.
- Unknown-country rejection.
- Focused 195-country tests.

### Still required

- Full live-price coverage by country.
- Source verification per market.
- Full country-aware budget planning.
- Recipe → price → budget integration.

## Global Market / Price Intelligence — still separate

A larger stacked workstream exists in PR #48/#49 with 195-country market/source registry, routing, discovery-only fallbacks, cached FX, local-time scheduling, confidence scoring and price-source infrastructure.

It is **not on `main`** because the workstream is stacked and PR #48 currently has merge conflicts. It must be integrated deliberately after dependency review rather than force-merged.

## Mobile product — major work remains

Current main contains the Expo/mobile shell, local language state and assistant entry behavior.

Remaining:

- Complete auth UX.
- Onboarding.
- Home/dashboard.
- Nutrition logging UX.
- Recipe discovery/cooking UX.
- Serving selector and scaled ingredient UI.
- Food-plan/recommendation UI.
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

### New UX requirement — gender-aware visual theme from onboarding

The onboarding experience must establish a persistent visual direction immediately after the user chooses language and then selects gender.

- [ ] If the user selects **female**, switch the visual system immediately to a distinctly feminine, premium and friendly theme and keep that direction through the remaining onboarding questions and the main app experience.
- [ ] The female visual direction should feel elegant, warm, playful and highly polished, using a coordinated feminine palette (for example soft pink/rose/red-accent families where appropriate), refined surfaces, illustrations/icons and micro-animations without becoming childish, cluttered or stereotypical.
- [ ] The female theme should be attractive enough that female users can genuinely love the environment and feel that the product was thoughtfully designed for them.
- [ ] Preserve the same product architecture, functionality and information hierarchy across genders; the theme change must be a visual/experiential layer, not a forked application.
- [ ] If the user selects **male**, keep the existing visual environment as the default unless a later personalization system explicitly changes it.
- [ ] Apply the selected gender theme immediately after the gender step and persist it so it remains consistent through onboarding and later app sessions.
- [ ] Ensure the theme system remains extensible so future personalization can support more nuanced visual preferences without coupling UI components to gender-specific business logic.
- [ ] Add focused mobile tests for theme selection, persistence, onboarding transitions and regression coverage for the existing male/default theme.
- [ ] Validate the final female and male experiences on real iOS/Android devices for layout, typography, animations, contrast and performance before declaring the UX slice complete.

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
| Nutrition foundations | 74% |
| Fitness / Yoga / Calisthenics / Gym | 75% |
| Recipe & Food Intelligence | 64% |
| Inventory / Shopping / Price Intelligence | 68% |
| Mobile product / UX | 20% |
| AI orchestration / voice / globalization | 40% |
| QA / Security / Production hardening | 50% |
| Business / Monetization | 0% |

**Weighted overall index: ~65%.**

## Immediate next priorities

1. Complete local/CI validation of the Food Decision Brain vertical slice.
2. Add canonical ingredient/region/cuisine normalization needed for true hard dietary/allergy and structured cuisine decisions.
3. Expand verified recipe corpus with provenance, allergens and dietary constraints.
4. Integrate the stacked Global Market workstream after conflict/dependency review.
5. Connect verified live price data into Food Operating Loop and budget recommendations.
6. Build the real mobile food journey around these APIs.
7. Implement and validate the gender-aware onboarding theme requirement.
8. Add production hardening and observability.
9. Add monetization after the core user journey is genuinely strong.

## Working rule

A slice is 100% only when architecture, implementation, database changes, focused tests, integration/E2E tests, documentation, and required environment validation are all green. Do not weaken assertions to obtain green tests.
