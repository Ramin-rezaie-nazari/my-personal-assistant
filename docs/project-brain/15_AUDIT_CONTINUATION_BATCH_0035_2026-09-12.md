# Audit Continuation Batch 0035 — Price Intelligence hardening

Last updated: 2026-09-12
Review status: IMPLEMENTATION COMPLETE; CI VERIFICATION IN PROGRESS
Scope actually read: `price-source-registry.service.ts`, `price-source.service.ts`, `http-price-source.adapter.ts`, `price-persistence.service.ts`, `nightly-market-intelligence.service.ts`, `price-history-store.service.ts`, `market-analysis.service.ts`, `price-intelligence.service.ts`, `market-intelligence-orchestrator.service.ts`, `product-matching.service.ts`, relevant specs and `deep-read/04-shopping.md` / historical issue catalog.
Scope not yet read: no broad price-provider production integration sweep; external provider behavior remains environment-limited.
Evidence roots: branch `audit/project-brain-2026-09-11`, latest implementation head `d0e537b25e19a90f631a500e29762827d8d131dc`.
Confidence level: HIGH for source-level remediation; CI must complete before closure is recorded.
Open questions: provider-specific adapter accuracy and live external quotas still require environmental validation.

## PB-061 — durable price history
Status: REMEDIATED — awaiting CI confirmation.

The active market analysis path was reading from a process-local `PriceHistoryStoreService` while durable `PriceSnapshot` records were already persisted separately. This created divergent history semantics and meant a fresh process could lose the analysis dataset. `MarketAnalysisService` now reads the durable `PricePersistenceService.history()` path, the orchestrator awaits the async analysis contract, and the obsolete in-memory history provider/file were retired. Regression tests now exercise durable history and currency filtering.

## PB-064 — source capability / trust / health metadata
Status: REMEDIATED — awaiting CI confirmation.

The registry previously exposed only identity/configuration. It now declares bounded `trustScore`, supported currencies, whether the source is unit-aware, and a freshness window. `PriceSourceService` additionally records runtime attempt/success/failure timestamps and counters and exposes that health telemetry alongside registry metadata. This makes source quality/capability explicit rather than implicit in the adapter implementation.

## PB-065 — product package-size mismatch
Status: REMEDIATED — awaiting CI confirmation.

Product matching previously awarded title/brand similarity without penalizing incompatible package sizes. Quantity comparison now normalizes common mass/volume/count units, rewards equivalent quantities across units, penalizes materially different quantities, and applies a stronger penalty for incompatible unit kinds. Regression tests cover mismatched size, incompatible units, and equivalent kg/g matching.

## Verification

Mobile CI `34692137967` completed successfully for the preceding branch head. Backend CI `34692137957` is still running its backend unit-test phase at the time this batch was recorded. Final closure of PB-061/PB-064/PB-065 must wait for the latest branch HEAD CI result; no green status is inferred early.

## Next checkpoint

After CI:
1. reconcile PB-061/PB-064/PB-065 in the canonical Appendix;
2. inspect remaining historical Price Intelligence findings (especially source normalization/security boundaries) for current-source relevance;
3. audit stale Budget/Shopping artifacts and user-visible edit paths;
4. run the final cross-vertical consistency pass and update Project Brain checkpoints.
