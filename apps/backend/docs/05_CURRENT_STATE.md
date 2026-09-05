# Current State — My Personal Assistant

> Operational source of truth for progress, validated checkpoints, completed slices, unfinished work, and the test ledger.
>
> Latest validated local backend checkpoint: 2026-09-05. Recommendation Intelligence is green locally; shopping ownership hardening is green under focused user-runtime regression; the food taxonomy persistence layer has passed two explicit design reviews and is awaiting runtime/CI migration validation. CI/mobile/device validation is not yet claimed green.

## Executive status

**Overall project completion: ~66%**

This is a weighted engineering/product-completion index, not a claim that 66% of every file is written. Backend foundations are strong, the global food/currency routing layer is real, and the connected food loop now spans scaling, inventory, shopping handoff, recommendations and daily meal planning. Major unfinished product work remains in the verified global recipe corpus, live market pricing, mobile UX, native voice/device validation, production hardening, and monetization.

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

The historical non-fatal Jest E2E worker teardown/open-handle warning remains a production-hardening item.

CI for the latest branch head is running after the current changes; this document does not claim CI-green until the runs finish successfully.

## Current work — Food Decision Brain / Recommendation Intelligence

A deterministic Recommendation Intelligence vertical slice is implemented on top of the canonical Food Operating Loop. It adds orchestration, personalization, ranking, diversification and explanations without creating a second recipe-calculation engine.

### Implemented in the current branch

- `RecommendationEngineService` obtains compact user food context and delegates recipe/serving/inventory/nutrition calculations to `FoodOperatingLoopService`.
- `PersonalizationService` reads primary goal, nutrition targets, diet type and recent nutrition-log titles into a deterministic compact context.
- `RecommendationRankingService` applies stable score ordering and top-three recipe-family diversification.
- Authenticated `POST /recommendation-intelligence/food` is exposed through `RecommendationIntelligenceController`.
- `RecommendationIntelligenceModule` is wired into `AppModule` with `RecipesModule` and `PrismaModule`.
- `FoodOperatingLoopService.recommend(...)` supports an explicit `maxMissingIngredients` threshold before ranking.
- Recommendation output contains deterministic reasons, base score, personalization adjustment, recent-meal flag and final rank.
- `pnpm-lock.yaml` is synchronized with the backend `sharp` dependency so frozen-lockfile installation has a consistent dependency graph.

### Validation

**Recommendation Intelligence: VALIDATED GREEN LOCALLY.**

Validated gates:

- frozen lockfile install
- backend typecheck
- backend build
- focused Recommendation tests
- full backend Jest
- Recommendation Intelligence E2E

Known non-blocking issue: the E2E run can emit a Jest worker-teardown/open-handle warning after successful completion.

### Design boundaries intentionally preserved

- Country remains a relevance/context signal, not a hard cuisine restriction.
- Existing Food Operating Loop remains the canonical serving, inventory and nutrition execution path.
- Live prices are not fabricated.
- Explanations are derived from deterministic scoring/context evidence.
- Structured allergy/dietary hard filters and true structured cuisine matching remain disabled until durable recipe metadata supports them safely.

## Current work — Food taxonomy and context

### Implemented foundation

- Deterministic `IngredientTaxonomyService` with trusted aliases, Persian/Arabic orthography normalization, food-group classification, confidence and provenance.
- Deterministic `FoodContextNormalizationService` for cuisine-family aliases and conservative two-letter country-code normalization.
- Explicit unresolved behavior for unknown values rather than guessed semantic matches.

### Durable persistence foundation

After two explicit reviews, the branch now contains an additive Prisma schema and migration for canonical metadata:

- `IngredientCanonical` + `IngredientCanonicalAlias` with provenance/version metadata.
- Nullable/indexed `FoodItem.canonicalIngredientId` and `RecipeIngredient.canonicalIngredientId`.
- `CuisineCanonical` with explicit hierarchy.
- `RegionCanonical` with country/region separation.
- `RecipeCuisine` and `RecipeRegion` many-to-many joins.
- `RecipeSafetyAssertion` for explicit provenance-backed dietary/allergen assertions with verification state.

The migration does not rewrite historical free-text, does not auto-backfill canonical IDs, and uses `SET NULL` when canonical references are removed.

### Still not complete

- Large verified ingredient corpus.
- Verified seed data with provenance.
- Runtime/CI migration deployment and idempotence validation.
- Region/cuisine structured joins populated across recipes.
- Provenance/versioning at catalog scale.
- Allergens/dietary assertions with trusted catalog coverage.
- Integration of canonical linkage into recipe/inventory/recommendation matching.

## Current work — Shopping / inventory security

### Hardening completed

`ShoppingService` was found to accept a `foodId` and `recipeId` by identifier alone. The write path now constrains both lookups to either global records (`userId: null`) or the authenticated caller.

Invalid shopping quantities are also rejected unless they are finite and strictly positive.

Regression coverage was added for:

- attempting to add another user's private food to the current user's basket;
- attempting to use another user's private recipe as a shopping source.

### Validation state

**Runtime regression validated: PASS (1 suite / 2 tests).**

The existing Inventory and Recipes services already apply equivalent ownership boundaries.

## Current work — Mobile visual theme

A provider-independent theme foundation now exists with `default` and `feminine` visual themes. Onboarding state persists the selected visual theme and derives it from the selected gender without branching business logic.

### Status

**Foundation complete; full UI rollout is not complete.**

Remaining:

- apply the theme immediately throughout onboarding after gender selection;
- use the same theme consistently through the main app;
- add focused mobile theme/onboarding tests;
- validate default/feminine visual behavior on real iOS/Android devices.

## Current work — Mobile localization

A single reactive locale store now controls the current top-level mobile routes and persists the first-run language choice. Quick Command result messages were additionally moved onto the shared locale contract so user-facing confirmation text is not hardcoded in English.

### Status

**Architecture + top-level rollout implemented; nested UI audit and runtime validation remain.**

Known remaining risk: some future or nested components may still contain hardcoded user-facing English. Server-provided free-form content is not silently translated.

## Current work — Voice P0

Android can abort with:

```text
FORTIFY: pthread_mutex_lock called on a destroyed mutex
Fatal signal 6 (SIGABRT)
```

The issue is associated with some local Persian candidate voice/model paths in the user's Android WIP. The tracked JS provider now serializes native TTS work and makes release wait behind an active native operation.

### Status

**P0 contained but unresolved.**

A real Android device is still required for candidate mapping, repeated-generation, interruption, voice-switching, background/foreground and release validation. Known-good Venus/Ganji/Khadijah paths must remain protected until candidates are independently validated.

## Global Food Intelligence

### Completed

- 195-country country-code coverage for the food routing layer.
- Country food profiles.
- Cuisine-family context.
- Staple-ingredient context.
- Signature/local recipe discovery anchors.
- Common cooking units.
- Hard-to-source ingredient metadata.
- Deterministic local recipe ranking.
- Explicit global-recipe behavior.
- Cuisine-preserving substitution policy.
- Country-aware recipe API endpoints.

### Still required for 100%

- Canonical ingredient taxonomy at catalog scale.
- Region/cuisine normalization beyond routing.
- Large verified recipe corpus with complete instructions and quantities.
- Nutrition provenance and quality controls.
- Allergens and dietary constraints coverage.
- Production-scale ingredient substitutions.
- Full-catalog serving/scaling metadata population.
- Full-catalog inventory matching.
- Full-catalog shopping conversion.
- Provenance/versioning and duplicate/alias/cultural QA.

## Global Currency / Finance Intelligence

### Completed

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

## Global Market / Price Intelligence

A larger stacked workstream exists in PR #48/#49 with market/source registry, routing, discovery-only fallbacks, cached FX, local-time scheduling, confidence scoring and price-source infrastructure.

It is not on `main`; the stacked workstream must be integrated deliberately after conflict, dependency and regression review rather than force-merged.

## Mobile product — major work remains

Current mobile foundation includes the Expo shell, onboarding flow, local language state, assistant entry behavior, and voice/theme foundations.

Remaining:

- Complete production auth UX.
- Complete onboarding polish and persistence.
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
- Accessibility/responsive polish.
- Real-device iOS/Android validation.
- Store-release hardening.

## Production hardening — incomplete

Remaining:

- Full security audit across all domains.
- Authorization review across every user-scoped write path.
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

## Immediate next priorities

1. Validate the new Prisma migration with schema generation, migration deploy/status/idempotence and full backend gates on the user's runtime/CI.
2. Add a small verified ingredient/cuisine seed set with explicit provenance and keep unverified rows unresolved.
3. Finish the nested mobile localization audit and wire the validated Recommendation API into the mobile food journey.
4. Complete the feminine/default theme rollout and focused mobile validation.
5. Resolve Voice P0 with the user's local Android WIP and real-device evidence.
6. Continue authorization, rate-limit, observability and E2E teardown hardening.
7. Integrate Global Market / Price Intelligence only after conflict/dependency/regression review.
8. Expand the verified recipe corpus and provenance.
9. Add monetization only after the core user journey is genuinely release-ready.

## Working rule

A slice is 100% only when architecture, implementation, database changes, focused tests, integration/E2E tests, documentation, and required environment validation are all green. Do not weaken assertions to obtain green tests.

## 2026-09-05 — Autonomous completion ledger

### Completed in this batch

- Persistent fitness catalog schema/migration created.
- Fitness catalog API changed to persistent-first with a strict four-WebP media contract and ten levels.
- Per-user progression/session persistence added and wired to the mobile session flow.
- Gym, Calisthenics and Yoga mobile catalog flows expanded with levels, search, paging, progress and attribution.
- Fitness importer/audit/media-verification tooling and licensing policy added.
- Recipe/fitness unit-test regressions corrected without weakening assertions.
- Mobile Expo/TTS/location/camera/reminder compatibility fixes staged through an automated lockfile synchronization workflow.

### Validation truth

The branch has live CI runs after the latest mobile/TTS changes; green CI is only declared from completed GitHub Actions results. The currently connected Supabase project has not been accepted as the application's production database because its schema does not match the repository's `User`-based Prisma model. Therefore the required 1,500-movement / 6,000-WebP production corpus is **not** claimed populated yet.

### Remaining release blockers

- Resolve/verify the correct production PostgreSQL/Supabase target, then apply the fitness catalog migration.
- Execute the real fitness corpus import and pass `fitness:content:audit` and `fitness:content:verify-media`.
- Complete mobile CI/device validation, especially native voice/TTS behavior.
- Continue broader production hardening and real-device QA.
