# Project Brain Changelog

Last updated: 2026-09-12
Review status: SOURCE-LEVEL AUDIT RECONCILED; MASTER PROMPT HARDENING THROUGH PB-286; RUNTIME CI VERIFIED; ENVIRONMENT GATES EXPLICIT
Scope actually read: baseline + Core + Prisma schema/migrations + recorded Assistant/Brain/Food/Shopping/Life/Health/Fitness/Platform/Test/CI/Mobile scopes + route/consumer/DTO/guard/database reconciliation + operational scripts + historical findings reconciliation + Shopping/Inventory/Price/Budget remediation through PB-286.
Scope not yet directly verifiable: deployed runtime/device/external-provider behavior and exact historical PB-001..PB-155 prose.
Evidence roots: `docs/project-brain/`; `apps/backend/`; `apps/mobile/`; `.github/workflows/`; `apps/backend/prisma/`.
Confidence level: HIGH for source/CI evidence; MEDIUM for deployed/runtime conclusions.
Open questions: deployed acceptance and product-level scope choice for durable household consumption learning.

## 2026-09-12 continuation

- PB-270: unit-safe ShoppingItem merge.
- PB-271: transactional purchase→Inventory synchronization.
- PB-061/PB-064/PB-065/PB-059: durable Price history, source capability/health, package matching and currency integrity.
- PB-272/PB-273: Price placeholder retirement and canonical analysis delegation.
- PB-274: Shopping Intelligence placeholder facade retirement.
- PB-275/PB-276: PurchasePlan currency integrity and Shopping invalid-quantity HTTP semantics.
- PB-277/PB-278: runtime-validated Shopping DTOs and strict Recipe→Shopping request membership.
- PB-279: DTO Jest decorator metadata bootstrap fix.
- PB-280/PB-281: Budget meal-plan validation and placeholder method retirement.
- PB-282/PB-283: Food loop serving validation and unbounded quote total correctness.
- PB-284: API Catalog route/guard reconciliation.
- PB-285: centralized quantity conversion; Budget now consumes compatible price evidence across mass/volume/count units while preserving source price semantics.
- PB-286: Household Purchase Planner no longer conflates safety stock with purchase quantity; budget remains the explicit purchase limiter.

## Verification

Runtime implementation head `c1af40ddd8b7d6af03308b4fb78301d6fc11ad1d` passed Backend CI `34704215875` and Mobile CI `34704215862`. Later commits are Project Brain/documentation synchronization only and do not alter runtime implementation behavior.

## Environment boundary

The available environment cannot directly validate deployed PostgreSQL/RLS/Storage/Auth state, real Android/iOS behavior, external provider quotas/health, production scheduler/push delivery or store release acceptance. These remain explicitly unverified.
