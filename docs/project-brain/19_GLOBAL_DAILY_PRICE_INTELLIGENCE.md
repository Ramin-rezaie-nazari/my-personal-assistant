# Global Daily Price Intelligence

Last updated: 2026-09-18
Status: IMPLEMENTED / FRESH CI + PRODUCTION DB ACTIVATION PENDING

## Goal

Provide a truthful global price layer across the canonical 195-country market set without inventing prices and without requiring a paid price API.

The system separates:
- country support (195 canonical markets);
- source coverage (which markets have observations);
- freshness (whether the latest observed price is from the current UTC day);
- source currency (never silently converted);
- product identity (Open Prices barcode when available, otherwise a normalized source product name).

## Provider

Open Prices, an Open Food Facts project, is used as the first global open-data provider. Its public REST API exposes dated food-price observations with currency and location metadata. The dataset is public and reusable under the ODbL subject to attribution and the provider's reuse conditions.

The provider is explicitly treated as an open dataset, not as a guarantee that every country has a fresh observation every day.

## Collection

`OpenPricesSourceAdapter` requests recent `PRODUCT` observations from the Open Prices API.

The collector is bounded by `PRICE_OPEN_PRICES_MAX_PAGES`, `PRICE_OPEN_PRICES_PAGE_SIZE`, and `PRICE_OPEN_PRICES_SINCE_DAYS`.

The default two-day window gives late-arriving observations a tolerance while keeping daily ingestion bounded.

## Country coverage

`GlobalCountryFinanceService` remains the canonical 195-country registry.

`PriceCoverageSnapshot` stores one row per provider/country and tracks last observed time, last collection time, observation count and `fresh` / `stale` / `missing` status.

A country is never marked fresh merely because it exists in the 195-country registry.

## Currency safety

Snapshots retain the provider currency. No FX conversion occurs during ingestion.

Global price analysis now requires a `countryCode` scope whenever observations span multiple countries or currencies. This prevents meaningless cross-market averages, trends and buy scores.

## Idempotency

Snapshot identities are deterministic SHA-256 hashes of product, source, country, city, URL, observation timestamp, amount, currency and title. This allows retries without duplicate rows while allowing the same product/source/day in different countries or cities.

`PriceCollectionRun` persists global execution state using `scope='global'` and `sourceId='open-prices'`.

## Scheduling

The canonical scheduler is `.github/workflows/global-daily-price-intelligence.yml` at 02:17 UTC.

GitHub documents standard GitHub-hosted runners for public repositories as free and unlimited. The workflow still requires a production `DATABASE_URL` secret and an already-hosted database; those infrastructure costs are external to the workflow runner.

## Evidence boundary

Repository-side tests can prove the parser, persistence contracts and 195-country enumeration.

Source code cannot honestly prove that Open Prices has a fresh observation for every one of the 195 countries every day. The application therefore exposes actual coverage and staleness instead of fabricating completeness.

## Legal / attribution

Any user-facing Open Prices data must retain required ODbL attribution and comply with the provider's current reuse terms. The source is recorded as `open-prices` with `ODbL-1.0`.