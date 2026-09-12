# Shopping / Inventory / Price Intelligence Deep Read

Last updated: 2026-09-12
Review status: RECONCILED FOR RECORDED SCOPE; APPENDIX REMEDIATION VERIFIED; UNIT-MERGE FIX CI VERIFIED
Scope actually read: complete recorded source-level scope for `shopping`, `inventory`, `shopping-intelligence`, and `price-intelligence`, including controllers, DTO/model contracts, persistence, analysis, scheduling, operational paths and direct specs/rechecks; additional focused reconciliation of Inventory → Shopping quantity/unit semantics.
Scope not yet read: production price-source health/quotas, deployed runtime behavior and physical mobile execution.
Evidence roots: `apps/backend/src/modules/shopping/`; `apps/backend/src/modules/inventory/`; `apps/backend/src/modules/shopping-intelligence/`; `apps/backend/src/modules/price-intelligence/`; `apps/backend/src/modules/recipes/services/food-operating-loop.service.ts`; `apps/backend/src/modules/shopping/shopping.service.ts`; `apps/backend/src/modules/shopping/shopping.service.spec.ts`; `apps/backend/prisma/`; canonical Appendix.
Confidence level: HIGH for recorded source-level audit and current unit-merge remediation; MEDIUM for end-to-end behavior requiring deployment/external sources.
Open questions: live price-source health, provider availability, deployed data state and real-device shopping UX.

## Shopping base

Shopping access is user-scoped in the remediation baseline. FoodItem and Recipe lookups used by basket operations enforce the intended visibility/ownership rules, and recipe-missing writes are grouped transactionally. DTO ownership and contract boundaries were reconciled as part of PB-241 and related shopping findings.

## Inventory

Inventory is JWT/user-scoped and its DTOs use the local Inventory domain rather than importing request contracts from another module. Quantity validation and ownership boundaries are part of the reconciled source baseline. `InventoryService.list()` feeds the deterministic household forecast into Shopping, preserving the inventory item's quantity and unit for the smart-list consumer.

## Inventory ↔ Shopping unit reconciliation

A new cross-domain integrity defect was found during focused reconciliation: `ShoppingService` previously merged an active basket row by `foodId` alone and incremented its numeric quantity without checking units. Because `ShoppingItem` has a single active-row uniqueness contract per user/food/completion state, a recipe or inventory path could otherwise combine values such as grams and pieces into one numeric total while retaining the first row's unit. This is data corruption, not merely presentation drift.

The fix is fail-closed and deterministic. When an active row already exists, Shopping now converts compatible mass/volume/count units into the existing row's unit before incrementing; incompatible unit kinds are rejected with a `BadRequestException` and the transaction does not merge the values. The behavior is covered by direct ShoppingService tests for compatible conversion and incompatible rejection, including the recipe-missing transaction path.

Evidence: `apps/backend/src/modules/shopping/shopping.service.ts`; `apps/backend/src/modules/shopping/shopping.service.spec.ts`; `apps/backend/src/modules/recipes/services/food-operating-loop.service.ts`; `apps/backend/prisma/schema.prisma`.

## Shopping Intelligence

The source audit distinguished canonical deterministic household intelligence from stale placeholder/orphan artifacts. Active consumers and user-scoped planning paths are retained; legacy placeholder facades were retired or reclassified rather than presented as completed capabilities.

## Price Intelligence

Price routes have an authenticated controller boundary. Price history preserves the observation's actual source currency and chart bounds are derived from observed data rather than fabricated zero values. Currency is therefore not silently forced to a single locale at presentation time.

Price collection remains an external-integration surface. Source registry, HTTP adapters, scheduled collection and persistence exist in the repository, but real provider availability, quotas, remote response quality and production scheduling require deployed/runtime verification.

## Cross-domain contract risks

Quantity/unit/currency remain strategic architecture concerns across Recipe, Food, Inventory, Shopping, Budget and Price systems. The historical Appendix findings in this area were remediated where they represented concrete source defects. The new basket-unit integrity defect is now fixed and CI-verified, while the long-term Vision still calls for a stronger canonical unit/currency abstraction and multi-provider resilience before these systems can be considered globally complete.

## Verification

For the unit-merge remediation, Backend CI `34691080753` and Mobile CI `34691080764` both completed successfully on commit `1f3f73601183779fbef865a82ce2ea3dee3f8c33`. Backend validation included Prisma schema/generation, migrations/idempotence, build, unit tests and API E2E; Mobile validation included typecheck, source tests, committed Jest specs, Expo validation and Android JavaScript bundling.

## Boundary

Source-level closure is not the same as live market-data correctness, deployed scheduled-job reliability or final shopping UX. Those remain explicit product/operational validation work.
