# Audit Continuation Batch 0039 — 2026-09-12

Last updated: 2026-09-12
Review status: COMPLETE FOR SOURCE/IMPLEMENTATION; LATEST-HEAD CI PENDING
Scope actually read:
- `apps/backend/src/modules/shopping/shopping.controller.ts`
- `apps/backend/src/modules/shopping/shopping.service.ts`
- `apps/backend/src/modules/shopping/shopping.service.spec.ts`
- `apps/backend/src/modules/shopping/dto/add-shopping-item.dto.ts`
- `apps/backend/src/modules/shopping/dto/add-shopping-from-recipe.dto.ts`
- `apps/backend/src/modules/shopping/dto/shopping.dto.spec.ts`

Findings/remediation:
- PB-277: active Shopping basket/from-recipe endpoints previously used inline body object types, bypassing runtime class-validator DTO metadata. Added concrete validated DTOs, nested recipe-item validation and direct DTO regression tests.
- PB-278: `ShoppingService.addRecipeMissing()` silently discarded request items not belonging to the selected recipe or with invalid quantity/unit values. It now rejects the request with `BadRequestException` before the transaction, preventing partially interpreted success; direct regression coverage was added.

Verification:
- The prior PB-275/PB-276 code head triggered Backend/Mobile CI; new PB-277/PB-278 commits advanced the branch again and require a fresh latest-head CI result.

Current boundaries:
- Shopping routes remain JWT/user-scoped.
- Food/Recipe visibility is global-or-current-user before basket persistence.
- Runtime/device/deployed environment remains outside connector validation.

Next:
- Confirm latest CI.
- Perform final Shopping/Inventory/Price cross-file consistency pass and reconcile all Project Brain status documents to the actual verified head.
