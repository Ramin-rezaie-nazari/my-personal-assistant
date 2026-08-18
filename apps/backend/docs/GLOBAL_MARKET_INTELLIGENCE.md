# Global Market Intelligence

## Purpose

This workstream makes the price-intelligence layer global-first. The app recognizes the 195-country sovereign market set, routes price collection by country, keeps discovery fallbacks explicit, preserves source-native currencies, stores country-aware snapshots/runs, evaluates the 03:30 schedule in each market's local timezone, and supports free cached FX conversion.

## Architecture

`GlobalMarketSourceRegistryService` resolves a country into operational retailers/aggregators plus discovery fallbacks.

`PriceSourceService.collectForCountryDetailed()` limits a collection run to the country's operational sources and stamps each normalized price with its country code. Discovery sources are never crawled as if they were price sources.

`HttpPriceSourceAdapter` remains the generic HTTP/HTML/JSON-LD parser. Its international contract now preserves source-native currencies such as `USD`, `EUR`, `GBP`, and `MXN`; only Iranian Rial is normalized to the app's Toman representation.

`PricePersistenceService` stores the country code on `PriceSnapshot` and `PriceCollectionRun`, keeping price history and execution locks separable across markets.

`GlobalMarketScheduleService` treats 03:30 as a local market time, not a single UTC time. The primary timezone table is explicit so the scheduler can decide which country markets are due at any moment.

`GlobalMarketAutomaticSchedulerService` finds the next global market occurrence, batches countries that share the same 03:30 instant, and performs startup catch-up when a market has missed more than one day.

`FxRateService` uses the free public Frankfurter API as the primary FX source, caches successful rates for 12 hours, and has an ECB-backed fallback path through the same public API. The public Frankfurter API currently documents no API key, no monthly/daily quota, and access to 201 currencies; its ECB provider exposes official reference rates for supported currencies. citeturn303427search0turn303427search3

`PriceConfidenceService` provides deterministic confidence levels based on number of successful sources, source coverage ratio, and observation freshness.

## Source strategy

The catalog contains direct retailer/aggregator sources for a curated set of major markets, plus the ShopByCountries and FreshPlaza retailer directories as discovery-only fallbacks. The discovery links are deliberately disabled as direct price sources until a country-specific retailer is verified and promoted into the operational catalog.

Regional corrections are applied separately from the base catalog so a country cannot accidentally inherit a retailer from another country. Current corrections include Mexico using Rappi and excluding Mercadona, and New Zealand using Woolworths New Zealand and excluding Woolworths Australia. Rappi documents active operation across Latin American markets including Mexico, and Woolworths New Zealand currently supports online orders. citeturn858756search7turn858756search25

Useful current sources include Wolt, Glovo, foodpanda, talabat, HungerStation, PedidosYa, Carrefour, Tesco, Mercadona, Conad, Walmart, Instacart, Woolworths, Coles, FairPrice, AEON, BigBasket, JioMart, Chaldal, Shoprite, Checkers Sixty60, Pick n Pay, and Naivas. Current market footprints change over time; Wolt, Delivery Hero brands and local retailers all have country-specific coverage that should be verified before enabling or adding a source adapter. citeturn872889search0turn872889search12

ShopByCountries is used only as a discovery layer because it lists shopping platforms for 180+ countries/territories but does not host live retailer prices. citeturn355737search1

## 03:30 policy

The default market schedule is:

- hour: `3`
- minute: `30`
- timezone: the market's configured primary IANA timezone

DST and timezone conversion are handled through `Intl.DateTimeFormat` rather than fixed UTC offsets.

The automatic scheduler processes markets one at a time when their local 03:30 arrives, batches multiple markets that share the same instant, and performs startup catch-up when a market has missed a run beyond the configured window.

## FX policy

- Preserve source-native grocery price currencies in snapshots.
- Use FX only when a user budget or comparison requires cross-currency normalization.
- Cache successful rates to avoid needless public API traffic.
- Keep the source and observation date with the rate.
- Never treat an unavailable FX quote as zero or silently guess a conversion.

Frankfurter currently documents a free public API with no API key and no daily/monthly quota, with optional provider-specific reference-rate selection. citeturn303427search0turn303427search3

## Persistence policy

Price snapshots and collection runs carry the market country code. The migration `20260818080000_add_global_market_country_context` adds the fields and the supporting indexes/unique key. A price observation therefore cannot be accidentally mixed between markets solely because the same product name and source are used in different countries.

## Validation contract

Focused tests cover:

- all 195 ISO sovereign-market codes are present and unique;
- every country is resolvable;
- every country receives discovery fallbacks;
- operational sources are separated from discovery-only sources;
- region-specific source corrections are applied;
- country-aware source routing never needs a global all-source crawl;
- non-IRR currencies are preserved;
- Rial is converted to Toman only for Iranian price text;
- 03:30 is resolved in local market time;
- simultaneous markets are batched;
- missed markets can catch up after restart;
- country context is carried into nightly collection and persistence;
- FX identity/failure behavior is deterministic without network dependence in tests;
- price confidence never claims high confidence without multiple fresh successful sources.

## Current completion state

### Code foundation

**Implemented.**

The core machinery is now present from country selection through source routing, price parsing, native currency preservation, country-aware persistence, local-time scheduling, FX and confidence.

### Production market coverage

**Not yet fully verified.**

The architecture supports all 195 sovereign market codes, and many high-value markets already have direct retailer/aggregator source entries. However, not every market has yet been independently verified with multiple direct price-capable sources and source-specific extraction behavior. Markets without verified direct sources remain `discovery_only` by design.

This is a deliberate trust boundary, not a missing fallback: the assistant must never claim a live local price when it cannot prove the source.

### Green checkpoint requirements

This workstream can be marked green only when:

1. Dedicated CI passes Prisma migration, typecheck, build and all focused market tests.
2. Existing full backend validation remains green after the shared price-intelligence changes.
3. The direct source catalog has been reviewed and verified for every production market we claim to support.
4. Documentation and `05_CURRENT_STATE.md` are updated with the final verification date and checkpoint commit.

Until those four conditions are met, the workstream remains **implemented foundation / validation pending**, not complete.
