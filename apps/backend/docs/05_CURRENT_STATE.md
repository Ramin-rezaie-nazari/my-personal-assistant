# Current State — My Personal Assistant

> Operational source of truth for progress, validated checkpoints, completed slices, unfinished work, and the test ledger.
>
> Latest fully validated locally: 2026-08-21. Food Decision Brain + Weekly Food Budget Optimizer + Ingredient Reuse hardening + Health Data Gateway backend slice are fully green on `work/canonical-ingredient-intelligence`.

## Executive status

**Overall project completion: ~69%**

This is a weighted engineering/product-completion index, not a claim that 69% of every file is written. Backend foundations are strong, the 195-country food/currency layer is real, and the connected food loop now spans canonical food intelligence, scaling, inventory, shopping handoff, recommendations, daily planning, weekly budget optimization, and normalized health data. Major unfinished product work remains in the verified global recipe corpus, full live market coverage, device-level health validation, mobile UX, production hardening, voice/local AI integration, and monetization.

## Latest workstream — Food Decision Brain + Weekly Budget Optimizer + Health Data Gateway + Native Health Providers

A deterministic **Food Decision Brain** is wired into recommendation-intelligence, a **Weekly Food Budget Optimizer** is layered on top of the existing recipe, inventory and price-intelligence systems, and the health stack now spans a provider-neutral backend gateway plus native mobile adapters for HealthKit and Health Connect.

### Food Decision pipeline

```text
Natural request context
  ↓
Food-theme / cuisine-intent inference
  ↓
Hard dietary + allergy filters
  ↓
Serving-aware recipe + inventory evaluation
  ↓
Nutrition fit
  ↓
Explicit ingredient/style preference
  ↓
Ingredient-aware cuisine/theme evidence
  ↓
Country/cuisine context
  ↓
Novelty / recent-meal rotation
  ↓
Verification + missing-ingredient quality
  ↓
Weighted decision score
  ↓
Diverse top-N ranking
  ↓
Reasons + score breakdown + rejected candidates
```

### Weekly budget decision pipeline

```text
Monthly / weekly food budget
  ↓
Household size + planning horizon
  ↓
Recipe serving scaling
  ↓
Current household inventory
  ↓
Verified latest unit-price observations
  ↓
Unit-aware ingredient → price conversion
  ↓
Recipe ingredient cost estimation (only where evidence exists)
  ↓
Nutrition / affordability / inventory / verification / simplicity scoring
  ↓
Ingredient reuse + family-repeat diversification
  ↓
7-day meal selection
  ↓
Budget envelope + confidence
  ↓
Aggregated shopping summary
```

### Health Data Gateway pipeline

```text
Apple HealthKit / Android Health Connect / other providers
  ↓
Vendor-neutral health-provider contract
  ↓
POST /device-intelligence/health-sync
  ↓
Idempotent normalized HealthDataPoint records
  ↓
Daily health/activity aggregation
  ↓
Personal Brain / Nutrition Brain / Workout Brain
```

### Native mobile health pipeline

```text
iPhone / Apple Watch                     Android phone / watch
        ↓                                         ↓
   HealthKit adapter                       Health Connect adapter
        └──────────────┬─────────────────────────┘
                       ↓
              Shared HealthProvider
                       ↓
             Incremental sync client
                       ↓
       /device-intelligence/health-sync
```

### Current decision signals

- target servings
- daily nutrition goals with deterministic per-serving targets
- current household inventory coverage
- missing ingredients
- dietary preferences
- allergy signals
- disliked ingredients
- explicit preferred ingredients
- food-theme intent inferred from category/goal/context
- ingredient-aware cuisine evidence
- country/cuisine context
- recent-meal novelty
- verified recipe state
- diversity/family de-duplication
- monthly or explicit weekly food budget
- planning horizon up to 7 days
- meals per day up to 3
- current price evidence where available
- price coverage and budget confidence
- ingredient reuse / shared-shopping value

### Health data currently normalized

- steps
- walking/running distance
- active calories
- total calories
- sleep duration
- workout duration
- workout calories
- heart rate
- resting heart rate
- weight

The gateway deliberately separates provider-specific records from the normalized contract so the backend is not coupled to Apple, Google, or a specific wearable vendor.

### Native provider implementation

Implemented in the mobile repo:

- iOS HealthKit provider behind the shared contract.
- Android Health Connect provider behind the same contract.
- Shared platform-provider factory.
- Authenticated health-sync client.
- Incremental sync orchestrator with last-success timestamp.
- Expo native config for HealthKit + Health Connect.
- EAS development profile with installable Android APK.

### Important design boundaries

- Canonical ingredient identity remains upstream. The decision engine consumes stable food entities rather than creating a second synonym/taxonomy layer.
- The budget optimizer never fabricates a price. A recipe can remain selectable when price coverage is incomplete, but budget confidence exposes the missing evidence.
- Inventory reduces estimated purchase cost only for quantities already present in the user's household inventory.
- Ingredient quantities and price units must belong to compatible unit families before cost is calculated; mass/volume/count are never silently mixed.
- An explicitly requested currency filters price evidence to that currency; no hidden FX conversion is performed in the optimizer.
- Country context is a relevance signal, not a cuisine restriction. A user in Iran can ask for Indian food; a user in Spain can ask for seafood.
- Allergy/diet checks are candidate safety signals, not medical clearance.
- Budget selection is deterministic and explainable rather than an opaque optimization black box.
- Real leftovers/batch-cooking reuse is not fabricated without yield/batch/storage metadata; current reuse optimization is ingredient/shopping reuse.
- Health data is treated as source data, not medical diagnosis. The gateway normalizes measurements but does not invent clinical conclusions.
- Native provider access remains mobile-side; backend stays provider-neutral.
- HealthKit is pinned to a known-good v13.4.0 line rather than v14 until its reported cold-start permission-sheet regression is resolved.
- Android Health Connect uses the current v4 integration and does not use the deprecated standalone `expo-health-connect` package.

### Current API surface

```text
POST /recommendation-intelligence/food
GET  /recipes/recommendations
GET  /recipes/meal-plan
GET  /recipes/:id/food-plan
POST /recipes/:id/food-plan/shopping
POST /budget-intelligence/weekly-plan
GET  /budget-intelligence/meal-plan
GET  /budget-intelligence/country
GET  /budget-intelligence/countries
GET  /device-intelligence
POST /device-intelligence/health-sync
```

### Health sync request contract

```text
provider
deviceId
points[]
  dataType
  value
  unit
  startAt
  endAt
  sourceRecordId?
  metadata?
```

The current contract supports idempotent replay using `sourceRecordId` when available and a deterministic fallback identity when it is not.

### Current limitations

- The price layer is only as complete as verified `PriceSnapshot.unitPrice` coverage. Missing prices are intentionally not synthesized.
- Ingredient quantity → price-unit semantics are now conservative and unit-aware, but complete global market unit normalization still needs broader verified source coverage.
- Cuisine intent is still deterministic/conservative; full multilingual intent/entity inference should eventually reuse the canonical food intelligence layer rather than relying on regex-only request parsing.
- Recommendation engine currently samples up to 500 latest recipes before ranking; production scale should move toward database-side candidate retrieval/filtering.
- Weekly optimizer currently uses deterministic scoring/greedy diversification plus ingredient reuse. A future phase can add constrained multi-day optimization with meal-pattern constraints, leftovers, batch cooking and explicit macro distribution once the necessary recipe metadata exists.
- Budget cost estimates remain confidence-scored rather than treated as exact financial truth.
- Native HealthKit and Android Health Connect adapters are implemented, but real-device permission/read/reconciliation validation is still pending.
- Historical reconciliation, background delivery, vendor-specific source prioritization and richer anchor/watermark semantics remain for the next health phase.
- Adaptive nutrition/workout decisions from health summaries are not yet fully wired into Personal Brain.

## Latest fully green local checkpoint — 2026-08-21

```text
Backend typecheck:                    PASS
Prisma generate:                      PASS
Backend build:                        PASS
Full backend Jest:                    158/158 suites — PASS
Tests:                                422/422 — PASS
Food Decision Brain focused tests:    PASS
Weekly Budget Optimizer tests:        PASS
Health Data Gateway focused tests:    PASS
```

The CPU-heavy recipe-image compression test previously required a higher Jest timeout; the assertion itself remains unchanged. The latest user-run validation completed fully green after the fix.

## New Slice — Native Health Providers

### Implementation status

**Implementation complete; real-device validation pending.**

Added:

- `@kingstinct/react-native-healthkit@13.4.0`
- `react-native-health-connect@4.1.3`
- `react-native-nitro-modules@0.35.6`
- Expo SDK 53-compatible `expo-build-properties@~0.14.8`
- `expo-dev-client@~5.2.0`
- iOS HealthKit adapter and permission flow
- Android Health Connect adapter and permission flow
- platform provider factory
- auth-aware health sync client
- incremental health sync orchestrator
- Expo native configuration
- EAS `development` profile with installable Android APK
- native-health progress documentation

### Validation state

**Backend is green; native validation is pending.**

The backend had a fully green checkpoint immediately before this native phase:

```text
Typecheck:                  PASS
Prisma generate:            PASS
Build:                      PASS
Full backend Jest:          158/158 suites — PASS
Tests:                      422/422 — PASS
```

The native provider code requires an iOS/Android development build and a real device because Expo Go cannot execute custom native health modules. Expo development builds are intended for custom native modules, while APK production/internal builds remain supported through EAS. citeturn508369search8turn508369search0

## Immediate next priorities

1. Validate the native health providers with iOS and Android development builds.
2. Add true background/incremental reconciliation and provider-source precedence.
3. Feed health summaries into Nutrition Brain, Workout Brain and Personal Brain so calories burned/activity can adapt plans.
4. Upgrade weekly optimization from greedy selection to constrained multi-day planning with leftovers/batch cooking once yield/storage metadata is available.
5. Expand verified recipe corpus with provenance, allergens and dietary constraints.
6. Improve canonical/global multilingual cuisine and ingredient inference.
7. Integrate verified live price coverage into Food Operating Loop and budget recommendations.
8. Build the real mobile food/health journey around these APIs.
9. Continue production hardening, observability and external-API cost controls.
10. Add voice/local AI orchestration and premium monetization after the core user journey is strong.

## Working rule

A slice is 100% only when architecture, implementation, database changes, focused tests, integration/E2E tests, documentation, and required environment validation are all green. Do not weaken assertions to obtain green tests.
