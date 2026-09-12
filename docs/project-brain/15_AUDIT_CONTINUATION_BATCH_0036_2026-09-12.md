# Audit Continuation Batch 0036 — 2026-09-12

Last updated: 2026-09-12
Review status: COMPLETE FOR SOURCE/IMPLEMENTATION; LATEST-HEAD CI PENDING
Scope actually read:
- `apps/backend/src/modules/price-intelligence/services/price-intelligence.service.ts`
- `apps/backend/src/modules/price-intelligence/services/price-intelligence.service.spec.ts`
- `apps/backend/src/modules/price-intelligence/services/market-analysis.service.ts`
- `apps/backend/src/modules/price-intelligence/services/price-persistence.service.ts`
- `apps/backend/src/modules/price-intelligence/services/price-history.service.ts`
- `apps/backend/src/modules/price-intelligence/services/price-analysis.service.ts`
- `apps/backend/src/modules/price-intelligence/price-intelligence.module.ts`
- repository consumer search for `PriceHistoryService` / `PriceAnalysisService` / analysis entrypoints
- canonical findings appendix and Project Brain review gaps/checkpoints/feature matrix

Findings/remediation:
- PB-061: durable price history is canonical; `MarketAnalysisService` reads `PricePersistenceService.history()` and the process-local history store was previously retired.
- PB-064: source capability/trust metadata and runtime health telemetry are explicit; external-provider health/quota monitoring remains environment-bound.
- PB-065: product matching accounts for compatible and incompatible quantity units and materially different package sizes.
- PB-059: price analysis now rejects incompatible currency evidence and prefers `unitPrice` when available.
- PB-271: shopping completion synchronizes purchased quantities into user inventory transactionally, with compatible conversion and fail-closed incompatibility.
- PB-272: unused placeholder `PriceHistoryService` and `PriceAnalysisService` implementations were verified to have no active consumers and were deleted; module registrations/exports were removed.
- PB-273: `PriceIntelligenceService.analyze()` duplicated `MarketAnalysisService`. The public analysis entrypoint now delegates to the canonical market-analysis service and has direct delegation coverage.

Verification:
- Immediately preceding head `f52ac24c5ef394aa84ead938ae036f52d51e596c` had Backend CI `34692215406` SUCCESS and Mobile CI `34692215496` SUCCESS.
- Subsequent commits advanced the branch to the latest implementation/doc head. Latest-head CI must be checked against the new head before marking the batch CI-verified.

Open boundary:
- Production DB/RLS/storage/auth configuration, physical-device behavior, external source availability/quotas and real deployment runtime remain outside this environment.

Next batch:
- Re-check latest-head CI.
- Reconcile stale completeness/project-brain status documents.
- Continue semantic audit of remaining Budget/Shopping/Price consumer contracts and then run a final consistency pass.
