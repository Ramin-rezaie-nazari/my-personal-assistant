# Global Market Intelligence — Checkpoint 2026-08-18

## Status

**Implementation foundation:** ✅ built

**Final green checkpoint:** ⏳ not yet valid

The system now contains the core machinery for global grocery-price intelligence, but this checkpoint is intentionally not marked green because direct retailer/aggregator verification is not complete for every market and the dedicated CI run has not yet produced a verified passing result.

## Implemented in this slice

- 195 sovereign ISO country market codes.
- Country → source registry with operational and discovery-only separation.
- Direct/aggregator source catalog for many major markets.
- Regional source correction layer to prevent cross-country source mistakes.
- Generic HTTP/HTML/JSON-LD price extraction.
- Native currency preservation for international prices.
- Iranian Rial → Toman normalization only when the source explicitly identifies Rial.
- Country-aware price collection.
- Country code persistence on price snapshots and collection runs.
- Country-specific run ids and scheduling locks.
- Primary IANA timezone per country.
- Local 03:30 schedule policy.
- Automatic global scheduler.
- Same-instant market batching.
- Startup catch-up for missed markets.
- Free cached FX service using Frankfurter with ECB provider fallback.
- Deterministic price-confidence scoring.
- Dedicated focused tests.
- Dedicated GitHub Actions workflow that validates Prisma migration, typecheck, build, and focused market tests.

## Trust rules

A discovery directory is never treated as a live price source.

A market is only considered direct-price-covered after its source URLs, local availability, extraction behavior, and currency/unit semantics have been verified.

No price can be persisted without its source-native currency and market country identity.

03:30 is always interpreted in the market's local timezone; one UTC-fixed 03:30 job is forbidden.

## Known production gap

The catalog is intentionally conservative. Some markets currently resolve only to discovery sources because a verified local live-price retailer/aggregator has not yet been promoted. This is safer than claiming false coverage.

## Validation ledger

Focused suites added:

- `global-market-source-registry.service.spec.ts`
- `price-source.service.global-market.spec.ts`
- `global-market-schedule.service.spec.ts`
- `global-market-automatic-scheduler.service.spec.ts`
- `http-price-source.adapter.spec.ts`
- `fx-rate.service.spec.ts`
- `price-confidence.service.spec.ts`
- updated `nightly-market-intelligence.service.spec.ts`

The dedicated CI workflow exists and includes `prisma migrate deploy`, typecheck, build, and the focused suites. A verified passing run still needs to be obtained before marking this checkpoint green.

## Next exact actions

1. Fix any CI failures from the dedicated market workflow.
2. Verify direct sources country-by-country for the remaining discovery-only markets.
3. Add source-specific adapters where generic extraction is insufficient.
4. Add region/city/postal-code routing and product/unit matching.
5. Once CI and source verification are green, update `05_CURRENT_STATE.md` and mark this workstream `[x]`.
