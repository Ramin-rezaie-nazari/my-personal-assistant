# Shopping / Inventory / Price Intelligence Deep Read

Last updated: 2026-09-12
Review status: RECONCILED FOR RECORDED SOURCE SCOPE; LATEST REMEDIATION THROUGH PB-286; RUNTIME CI VERIFIED
Scope actually read: complete recorded source-level scope for `shopping`, `inventory`, `shopping-intelligence`, and `price-intelligence`, including controllers, DTO/model contracts, persistence, analysis, scheduling, operational paths and direct specs/rechecks; focused Inventory → Shopping lifecycle/unit reconciliation; focused Shopping Intelligence placeholder/consumer reconciliation; focused PurchasePlan currency contract; Budget ↔ Price unit compatibility; household purchase/reorder semantics.
Scope not yet read: production price-source health/quotas, deployed runtime behavior and physical mobile execution.
Evidence roots: `apps/backend/src/modules/shopping/`; `apps/backend/src/modules/inventory/`; `apps/backend/src/modules/shopping-intelligence/`; `apps/backend/src/modules/price-intelligence/`; `apps/backend/src/modules/budget-intelligence/`; `apps/backend/src/common/units/quantity-conversion.ts`; `apps/backend/src/modules/recipes/services/food-operating-loop.service.ts`; `apps/backend/prisma/`; canonical Appendix.
Confidence level: HIGH for recorded source-level audit and implemented remediations; MEDIUM for behavior requiring deployment/external sources.
Open questions: live price-source health, provider availability, deployed data state and real-device shopping UX.

## Shopping base

Shopping access is user-scoped in the remediation baseline. FoodItem and Recipe lookups used by basket operations enforce intended global-or-current-user visibility. Basket listing/completion is user-scoped and purchase completion synchronizes inventory transactionally.

`addToBasket()` validates quantity semantics as a bad request before resource lookup. Existing basket quantities are merged only after compatible unit conversion; incompatible unit kinds fail closed.

## Inventory

Inventory is JWT/user-scoped. `InventoryService.list()` feeds deterministic inventory intelligence into Shopping and preserves quantity/unit values for the smart-list consumer. Purchased basket completion increments an existing inventory row in its established unit or creates a new row when absent.

`HouseholdInventoryIntelligenceService` computes `reorderPoint` from consumption and safety stock, then derives `recommendedQuantity` as the quantity required to reach that threshold. Safety stock is therefore a threshold component, not itself a purchase cap.

## Inventory ↔ Shopping lifecycle and unit reconciliation

A cross-domain integrity defect was found when an active ShoppingItem was merged by `foodId` without unit compatibility checks. That is fixed: compatible mass/volume/count units are converted into the existing row's unit, and incompatible unit kinds are rejected before persistence.

A second lifecycle defect was found in purchase completion: the mobile `Mark as bought` operation previously completed only the basket record. It now completes the basket and synchronizes Inventory atomically, with idempotent completion guards and rollback on incompatible inventory units.

Quantity conversion is now centralized in `apps/backend/src/common/units/quantity-conversion.ts` and consumed by both Shopping and Budget to reduce divergent unit semantics.

## Shopping Intelligence

The module retains active deterministic/provider services in its runtime graph. Placeholder-only `ShoppingListService` and `PurchaseAnalysisService` facades were confirmed to have no active consumers and were retired. The authenticated controller delegates to `ShoppingIntelligenceService`, which combines the canonical Shopping smart-list and open basket.

`PurchasePlanService` enforces plan-currency/item-currency compatibility and skips mismatched monetary units with explicit `currency_mismatch` reasoning. `SmartPurchaseBasketService` independently filters candidate currencies when a budget currency is supplied and commits cost only for `buy_now` decisions.

`HouseholdPurchasePlannerService` now preserves the forecasted `recommendedQuantity` rather than capping it by `safetyStock`; the remaining budget constraint is the explicit purchase limiter. This closes the current revalidation finding PB-286.

The household consumption/reorder planning stack is source-present but not directly consumed by the HTTP Shopping Intelligence controller. Its current consumption-learning implementation remains process-local and unitless; this is treated as an architectural/product boundary rather than claimed as a completed durable household-learning capability. A durable, user-scoped consumption event model remains future work before that subsystem can be presented as persistent multi-user learning.

## Price Intelligence and Budget bridge

Price routes have an authenticated controller boundary. Durable snapshots are the canonical price-history source for market analysis. Source definitions expose capability/trust metadata and runtime in-process health telemetry. Product matching accounts for compatible package quantities and incompatible unit kinds. Price analysis filters incompatible currencies and uses unit price when available.

Budget quote now accepts price evidence expressed in a compatible unit family, e.g. `L` evidence for an `ml` requirement, converts the source unit price into the requested quantity for `estimatedCost`, and preserves the source `price` field semantics. Freshness is still enforced before costing. This closes PB-285.

Placeholder Price History/Analysis providers were retired after consumer search, and the public PriceIntelligenceService analysis entrypoint delegates to canonical MarketAnalysisService.

## Cross-domain contract risks

Quantity/unit/currency remain strategic architecture concerns across Recipe, Food, Inventory, Shopping, Budget and Price systems. Concrete source defects found in the remediation stream are registered in the canonical Appendix and covered by direct regression tests/CI. Long-term Vision still benefits from a stronger canonical currency abstraction and durable consumption-learning model.

## Verification

Latest verified runtime implementation head: `c1af40ddd8b7d6af03308b4fb78301d6fc11ad1d`.
- Backend CI `34704215875`: SUCCESS — Prisma validation/generation, migrations/idempotence, food self-test, build, backend unit tests, API E2E and diagnostics.
- Mobile CI `34704215862`: SUCCESS — dependency install, TypeScript, source tests, committed Jest specs, Expo validation and Android JavaScript bundle.
- Documentation synchronization commits after the runtime head do not alter implementation behavior.

## Boundary

Source-level closure is not the same as live market-data correctness, deployed scheduled-job reliability, physical-device behavior or external provider availability. Those remain explicit environment validation gates.
