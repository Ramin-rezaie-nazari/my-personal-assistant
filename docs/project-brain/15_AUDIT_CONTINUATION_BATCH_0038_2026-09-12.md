# Audit Continuation Batch 0038 — 2026-09-12

Last updated: 2026-09-12
Review status: COMPLETE FOR SOURCE/IMPLEMENTATION; LATEST-HEAD CI PENDING
Scope actually read:
- `apps/backend/src/modules/shopping-intelligence/services/purchase-plan.service.ts`
- `apps/backend/src/modules/shopping-intelligence/services/purchase-plan.service.spec.ts`
- `apps/backend/src/modules/shopping/shopping.service.ts`
- `apps/backend/src/modules/shopping/shopping.service.spec.ts`
- `docs/project-brain/deep-read/04-shopping.md`
- consumer/search evidence for PurchasePlanService and Shopping addToBasket

Findings/remediation:
- PB-275: PurchasePlanService previously allowed item prices in a currency different from the plan currency to participate in ranking/selection. The planner now normalizes currency codes and skips mismatches with deterministic `currency_mismatch` reasoning.
- PB-276: ShoppingService.addToBasket previously raised `NotFoundException` for malformed/non-positive/non-finite quantities, misclassifying client input as a missing resource. It now raises `BadRequestException` and direct regression coverage was added.
- Current source review also revalidated PB-049's ownership concern: FoodItem lookup in addToBasket is scoped to global (`userId IS NULL`) or current-user rows, so no new ownership finding is opened.

Verification:
- Prior head through PB-274 passed Backend CI `34692506118` and Mobile CI `34692506067`.
- PB-275/PB-276 advanced the code tree; fresh CI `Backend/Mobile` was triggered and must complete before this batch becomes CI-verified.

Next:
- Confirm fresh CI.
- Continue only with concrete current-source findings.
- Reconcile Project Brain current-state/checkpoint/index/appendix after the code tree is green.
