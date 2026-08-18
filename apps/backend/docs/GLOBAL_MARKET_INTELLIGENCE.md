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

## Source strategy

The catalog contains direct retailer/aggregator sources for a curated set of major markets, plus `ShopByCountries` and the FreshPlaza retailer directory as discovery-only fallbacks. The discovery links are deliberately disabled as direct price sources until a country-specific retailer is verified and promoted into the operational catalog.

Useful current sources include Wolt, Glovo, foodpanda, talabat, HungerStation, PedidosYa, Carrefour, Tesco, Mercadona, Conad, Walmart, Instacart, Woolworths, Coles, FairPrice, AEON, BigBasket, JioMart, Chaldal, Shoprite, Checkers Sixty60, Pick n Pay, and Naivas. Current market footprints change over time; Wolt, Delivery Hero brands and local retailers all have country-specific coverage that should be verified before enabling or adding a source adapter. citeturn872889search0turn872889search12

ShopByCountries is used only as a discovery layer because it lists shopping platforms for 180+ countries/territories but does not host live retailer prices. citeturn355737search1

## 03:30 policy

The default market schedule is:

- hour: `3`
- minute: `30`
- timezone: the market's configured primary IANA timezone

DST and timezone conversion are handled through `Intl.DateTimeFormat` rather than fixed UTC offsets.

## FX policy

- Preserve source-native grocery price currencies in snapshots.
- Use FX only when a user budget or comparison requires cross-currency normalization.
- Cache successful rates to avoid needless public API traffic.
- Keep the source and observation date with the rate.
- Never treat an unavailable FX quote as zero or silently guess a conversion.

Frankfurter currently documents a free public API with no API key and no daily/monthly quota, with optional provider-specific reference-rate selection. citeturn303427search0turn303427search3

## Validation contract

Focused tests cover:

- all 195 ISO sovereign-market codes are present and unique;
- every country is resolvable;
- every country receives discovery fallbacks;
- operational sources are separated from discovery-only sources;
- country-aware source routing never needs a global all-source crawl;
- non-IRR currencies are preserved;
- Rial is converted to Toman only for Iranian price text;
- 03:30 is resolved in local market time;
- simultaneous markets are batched;
- missed markets can catch up after restart;
- country context is carried into nightly collection;
- FX identity/failure behavior is deterministic without network dependence in tests.

## Current completion state

**Architecture / code foundation: implemented.**

**Production market coverage: not yet fully verified.**

The project now has the machinery required for global market collection, but not every one of the 195 markets has yet been verified with multiple direct price-capable retailer/aggregator sources. Countries without verified direct sources remain explicitly `discovery_only`. This is intentional and prevents the product from claiming live price coverage where it cannot prove it.

A market can be promoted from `discovery_only` to `direct_and_aggregator` only after its sources, URLs, regional behavior and extraction strategy have been verified.

## Next hardening stage

1. Verify/promote direct sources country by country using official retailer pages and current market availability.
2. Add source-specific adapters where generic HTTP/JSON-LD parsing is not sufficient.
3. Add source reliability/confidence scoring and freshness thresholds.
4. Add region/city/postal-code routing where retailer prices vary by location.
5. Add cross-source product matching and unit normalization.
6. Add user-facing price confidence and freshness explanations.
