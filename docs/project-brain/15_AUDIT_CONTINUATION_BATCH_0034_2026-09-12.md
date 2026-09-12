# Audit Continuation Batch 0034 — Shopping purchase → Inventory lifecycle

Last updated: 2026-09-12
Review status: COMPLETE — IMPLEMENTED + CI VERIFIED
Scope actually read: `apps/backend/src/modules/shopping/shopping.service.ts`, `apps/backend/src/modules/shopping/shopping.service.spec.ts`, `apps/backend/src/modules/inventory/inventory.service.ts`, `apps/backend/prisma/schema.prisma` InventoryItem/ShoppingItem models, `apps/mobile/app/shopping.tsx`, `docs/project-brain/deep-read/04-shopping.md`.
Scope not yet read: no new broad source-sweep beyond the listed lifecycle surface in this batch.
Evidence roots: commit `a4f6e6be713351b0b9fe5761af507c0a77b717c7`; Backend CI `34691734372`; Mobile CI `34691734350`.
Confidence level: HIGH for the inspected source/CI contract; production/device behavior remains environment-limited.
Open questions: whether future UX should support partial purchase quantities remains a product decision; current contract treats a checked-off basket quantity as purchased quantity.

## Finding PB-271

Status: CLOSED — REMEDIATED; CI VERIFIED
Severity: HIGH
Priority: HIGH
Location: `apps/backend/src/modules/shopping/shopping.service.ts::complete`

### Evidence

The Shopping mobile screen labels completion as “Mark as bought” and removes the item from the active basket after `completeBasketItem()`. The previous backend implementation only set `ShoppingItem.completed = true`; it did not create or increment the corresponding `InventoryItem`. `InventoryService` separately owns inventory creation/adjustment, while `ShoppingItem` and `InventoryItem` are unique per `(userId, foodId)`.

### Root cause

The purchase completion transition ended the Shopping lifecycle without synchronizing the newly purchased quantity into household inventory.

### Impact

A user could mark an item as bought, see it disappear from the active basket, and still have the inventory intelligence operate on the old stock level. That could cause immediately stale low-stock/smart-shopping recommendations and break the intended Inventory → Shopping → Purchase → Inventory loop.

### Remediation

`ShoppingService.complete()` now executes the purchase completion and inventory synchronization in one Prisma transaction. It:

1. loads the still-active user-owned basket item;
2. marks it completed atomically;
3. finds the user's existing inventory row for the same food;
4. converts compatible mass/volume/count units into the existing inventory unit before incrementing;
5. creates a new inventory row when none exists;
6. rejects incompatible units with `BadRequestException`, causing the transaction to roll back so the basket item remains uncompleted.

The method also guards the completion transition with `completed: false` so repeated/concurrent completion cannot increment inventory twice after the row has already been consumed.

### Verification

Regression coverage was added for:
- compatible `g → kg` purchase-to-inventory conversion;
- incompatible `piece → kg` fail-closed behavior;
- creating inventory for a newly tracked food.

Backend CI `34691734372` passed schema validation, Prisma generation/migrations/idempotence, build, backend unit tests and API E2E. Mobile CI `34691734350` passed typecheck, source tests, committed Jest specs, Expo validation and Android JS bundling.

### Product contract note

The current UI exposes a binary “Mark as bought” action and shows the basket quantity as the quantity to buy. Therefore the remediation intentionally treats that quantity as the purchased quantity. Partial-purchase UX is not inferred or invented in this batch and remains an explicit future product decision.

## Next checkpoint

Continue with the remaining MASTER-0004 work in this order:
1. reconcile price-source breadth/health/failure semantics, including open historical PB-064;
2. audit stale Budget/Shopping artifacts and user-visible edit paths;
3. harden actionable explanations and cross-vertical contracts;
4. reconcile canonical Appendix/Project Brain status for this batch before final consistency pass.
