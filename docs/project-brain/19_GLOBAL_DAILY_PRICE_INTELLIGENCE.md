# Global Daily Price Intelligence

Last updated: 2026-09-18
Status: IMPLEMENTED / LOCAL RUNTIME VERIFICATION PENDING

## Goal

Provide the strongest truthful free global food-price layer available to MYPA without inventing missing observations.

The canonical market universe remains the repository's 195-country registry. Actual provider coverage is measured separately.

## Providers

### Open Prices
- global public food-price observation source;
- source-native country and currency are preserved;
- default ingestion window is two days for the daily collection path;
- bounded pagination prevents an unbounded daily job;
- missing countries are not fabricated.

### FAO FPMA
- global public domestic food-price source;
- used as a slower benchmark/reference feed;
- refresh cadence is monthly and it is intentionally excluded from the default daily collection set.

## Daily pipeline

```text
local-price-scheduler.ts (laptop)
      ↓
global-price-daily.ts
      ↓
NightlyMarketIntelligenceService
      ↓
PriceSourceService
      ↓
Open Prices only
      ↓
PricePersistenceService
      ↓
PriceSnapshot(country/currency/source/date)
      ↓
GET /price-intelligence/coverage
```

Daily collection is intentionally separate from the in-process application scheduler. This prevents the app server lifecycle from being the only mechanism responsible for daily global refresh.

FAO FPMA has its own monthly one-shot collector (`apps/backend/src/scripts/fao-fpma-monthly.ts`) because its provider cadence is slower than Open Prices. No cloud scheduler is required.

## Coverage semantics

`GET /price-intelligence/coverage` now defaults to:
- source = `open-prices`;
- freshness window = 1 day.

The response is based on the complete 195-country registry and reports `fresh`, `stale`, or `no_data` per country.

This does not claim 195 fresh countries every day. Open Prices is crowdsourced and coverage varies by country, so the observed daily coverage is an evidence metric rather than an assumption.

## Idempotency

Price snapshots with a provider record id use `sourceId:sourceRecordId` as identity. Records without provider ids include country, product, source, city, observation time, amount, currency and unit to avoid cross-market collisions.

Persistence now increments its `written` count only when an INSERT actually creates a row.

## Local scheduling

The development scheduler runs on the user's laptop. It uses standard Node.js timers and the laptop's local timezone, so no external scheduler or paid service is required. The catch-up policy also detects a missed scheduled window when the process restarts later the same day, avoiding a full-day gap caused by restart/sleep.

The local PostgreSQL database is provided by `docker-compose.local.yml`. VPS deployment is intentionally deferred until the release phase.

The one-shot command and daemon are exposed from `apps/backend/package.json`:
- `pnpm price-intelligence:global-daily`
- `pnpm price-intelligence:daily-daemon`

## Evidence boundary

Automated tests cover source normalization, daily source routing, scheduler timing and 195-country coverage enumeration.

Backend CI passed for the local-first infrastructure branch, including backend API E2E. Real local daily operation remains unverified until it is run on the user's laptop and actual country coverage is measured.

## Infrastructure policy

Supabase is not a required dependency of the current MYPA application architecture. The canonical development data plane is PostgreSQL via `docker-compose.local.yml`. VPS hosting is a future release concern only.
