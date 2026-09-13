# Shopping / Inventory / Price Intelligence Deep Read

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: complete current-main file-level scope for `shopping`, `inventory`, `shopping-intelligence`, and the enumerated `price-intelligence` module files including controllers, DTO/model, core source/adapters/persistence/analysis/scheduling files and available direct specs.
Scope not yet read: remaining repository-wide consumers, mobile consumers, some legacy support/test files not present in module trees, full DB reader/writer/transaction matrix and runtime execution.
Evidence roots: `apps/backend/src/modules/shopping/`, `inventory/`, `shopping-intelligence/`, `price-intelligence/`, `apps/backend/prisma/`, `docs/project-brain/12_OPEN_WORK.md`.
Confidence level: HIGH for file-level source behavior listed here; MEDIUM for end-to-end behavior until route/mobile/database/runtime validation is completed.
Open questions: deployed price tables, exact unit semantics across all shopping paths, durable consumption-learning persistence, external source health, mobile usage.

## Shopping base

`ShoppingController` is JWT guarded and exposes smart list, basket list/add, recipe-missing add and basket completion. `ShoppingService.smartList()` delegates inventory forecasting and maps low-stock/essential items into purchase-ready rows. Basket listing/completion are user-scoped.

A data-isolation defect exists in `addToBasket()`: it loads `FoodItem` by ID only rather than enforcing the global-or-current-user visibility rule used by Inventory/Foods. `addRecipeMissing()` also loads `Recipe` by ID only before accepting recipe ingredient IDs, without checking recipe ownership/global visibility. These are documented as PB-049 and PB-066.

The shopping write DTO layer is absent: controller bodies are inline objects. The `shopping` module directory contains no direct service/controller specs, creating PB-054 and PB-070 test/contract gaps.

## Inventory

`InventoryService` is JWT/user-scoped, validates non-negative quantity, enforces food visibility on create, upserts by `(userId, foodId)`, and delegates list prioritization to `HouseholdInventoryIntelligenceService`. Adjustment/removal are user-scoped. `PATCH /inventory/:id` takes a bare numeric body parameter and lacks finite-number DTO validation (PB-055).

## Shopping Intelligence

The module exports a mixture of placeholder facades and deterministic household intelligence. `ShoppingIntelligenceService`, `ShoppingListService` and `PurchaseAnalysisService` remain placeholder-level. `ShoppingIntelligenceController` is public and only calls the placeholder service, yielding no user-specific plan (PB-050/PB-056).

`SmartPurchaseDecisionService` scores purchase candidates from price discount/trend, seller score, user preference, urgency, affordability and availability. `SmartPurchaseBasketService` sums candidate price×quantity and takes currency from the first candidate without verifying all items share the same currency. `PurchasePlanService` ranks urgency/score and respects a numeric budget but does not enforce `item.currency === input.currency`. These are PB-068/PB-069.

`HouseholdInventoryIntelligenceService` computes daysRemaining/reorderPoint/recommendedQuantity by direct numeric arithmetic with `unit` treated as metadata. There is no canonical unit conversion, producing PB-052.

`HouseholdConsumptionLearningService` maintains up to 500 events per product in a process-local Map keyed only by productKey. Events have quantity but no unit and no user/household identity. This creates both state-isolation and dimensional-semantic problems (PB-051/PB-067).

`HouseholdPurchasePlannerService` combines forecast and prices under a budget, but for critical items it caps purchaseQuantity by safetyStock itself rather than clearly modeling safety stock as a target threshold, creating PB-053. Its tests currently codify this behavior.

`HouseholdReorderForecastService` uses the learned dailyRate and next30DayNeed to derive reorder points/quantities but inherits the process-local, unitless consumption contract.

## Price Intelligence

`PriceIntelligenceController` has no JWT guard. Public routes include price reads, source registry, schedule, matching, history/analysis, and `POST /price-intelligence/nightly/run`, which invokes external price collection and raw DB writes. This is PB-057 security critical. The controller uses inline bodies for `match`, `nightly/run` and `nightly/preview`; the provided `CreatePriceRecordDto` is unused and unvalidated.

`PriceSourceRegistryService` contains nine enabled Iranian retailer/marketplace sources with environment-configurable search URL templates. There is no source health/quality/currency/unit capability or trust-score contract (PB-064).

`HttpPriceSourceAdapter` fetches configured search URLs with a 12-second timeout and parses JSON-LD, generic script/meta and Persian price text. It converts IRR to IRT, but its normalization unconditionally labels output `currency: 'IRT'` for every other currency too, without FX conversion; this is PB-058 critical.

`PricePersistenceService` stores tracking/snapshots/runs using raw SQL against migration-created tables (`PriceTrackedProduct`, `PriceSnapshot`, `PriceCollectionRun`) absent from final Prisma models, contributing to PB-007 and a price-specific hidden schema contract. `latest()` and `history()` return rows from durable snapshots.

`PriceIntelligenceService.analyze()` aggregates prices by productKey without compatibility filtering for currency, unit, package size or source normalization. This can create false averages/trends across incompatible observations (PB-059).

`PriceHistoryStoreService` is process-local, while `PriceHistoryService` and `PriceAnalysisService` are placeholders. `MarketAnalysisService` uses the in-memory store. This creates duplicate ownership and divergent history paths (PB-060/PB-061).

`PriceSourceService` creates one HTTP adapter per enabled registry source and collects through `Promise.allSettled`, retaining successes while listing failed sources. `NightlyMarketIntelligenceService` performs scheduled collection with retry/catch-up and persists run metadata. Its retry loop has a validation risk in the reported `attempts` count after natural loop termination (PB-063). `PriceCollectionSchedulerService` and `AutomaticPriceSchedulerService` independently implement 03:30 `Asia/Tehran` defaults, creating duplicated timezone policy (PB-062). The automatic scheduler is process-local and has no direct service spec (PB-072).

`ProductMatchingService` uses identifiers/title/brand/quantity. Quantity only adds positive score on exact unit + within 1% value, while strong title/brand overlap can still produce high similarity without explicit incompatible package-size penalties (PB-065).

`MarketBudgetImpactService` projects planned spending against a numeric monthly budget. `MarketIntelligenceOrchestratorService` connects nightly collection, market analysis, source discovery and budget impact. These are useful deterministic primitives but are not sufficient by themselves to guarantee normalized cross-source monetary semantics.

## Cross-domain contract risks

Shopping, Inventory, Food/Recipe, Budget, and Price paths all currently carry quantity/unit/currency concepts with different contracts. The largest shared risks are:

1. no single canonical quantity/unit conversion contract across RecipeInventoryMatcher, FoodOperatingLoop, Inventory Forecast, Consumption Learning, Product Matching and Purchase Planning;
2. no single canonical currency/FX contract across Price Intelligence, Shopping Intelligence, Budget and purchase planning;
3. multiple placeholder facades alongside more functional specialized implementations;
4. raw SQL migration-only price tables outside Prisma's model graph;
5. public/internal boundary confusion around price collection and shopping-intelligence endpoints.

## File-level batch status

### BATCH-0005 — Shopping
Status: COMPLETE for the enumerated file-level scope read in this batch.
Important: `COMPLETE` means source inventory explicitly inspected and corresponding deep-read written; it does not mean runtime verified or repository-wide consumer mapping complete.

## Issue references

Shopping/Price-specific issues are PB-049 through PB-072 in `docs/project-brain/12_OPEN_WORK.md`.

## Next
Proceed to Life/Health/Calendar/Daily/Habits/Life-Execution/Life-Tasks/Reminders/Notifications/Supplements/Health. Then Fitness, Platform/Tests/Scripts/CI and Mobile. Final stages remain route/mobile/database/security/runtime/historical reconciliation followed by the separate correction phase.
