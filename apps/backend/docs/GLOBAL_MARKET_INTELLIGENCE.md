# Global Market Intelligence

## Purpose

This workstream makes the price-intelligence layer global-first. The app recognizes the 195-country sovereign market set, routes price collection by country, keeps discovery fallbacks explicit, preserves source-native currencies, and evaluates the 03:30 schedule in the market's local timezone.

## Architecture

`GlobalMarketSourceRegistryService` resolves a country into operational retailers/aggregators plus two discovery fallbacks.

`PriceSourceService.collectForCountryDetailed()` limits a collection run to the country's operational sources. Discovery sources are never crawled as if they were price sources.

`HttpPriceSourceAdapter` remains the generic HTTP/HTML/JSON-LD parser. Its international contract now preserves source-native currencies such as `USD`, `EUR`, `GBP`, and `MXN`; only Iranian Rial is normalized to the app's Toman representation.

`GlobalMarketScheduleService` treats 03:30 as a local market time, not a single UTC time. The primary timezone table is explicit so the scheduler can decide which country markets are due at any moment.

## Source strategy

The catalog contains direct retailer/aggregator sources for a curated set of major markets, plus `ShopByCountries` and the FreshPlaza retailer directory as discovery-only fallbacks. The discovery links are deliberately disabled as direct price sources until a country-specific retailer is verified and promoted into the operational catalog.

This distinction is intentional: the app must never fabricate price coverage. A market with only discovery sources is represented as `discovery_only` and can be surfaced for source-verification work.

Useful current sources include Wolt, Glovo, foodpanda, talabat, HungerStation, PedidosYa, Carrefour, Tesco, Mercadona, Conad, Walmart, Instacart, Woolworths, Coles, FairPrice, AEON, BigBasket, JioMart, Chaldal, Shoprite, Checkers Sixty60, and Naivas. Availability changes over time and must always be verified before enabling a crawler adapter.

## 03:30 policy

The default market schedule is:

- hour: `3`
- minute: `30`
- timezone: each market's configured primary timezone

DST and timezone conversion are handled through `Intl.DateTimeFormat` rather than fixed UTC offsets.

## Validation contract

Focused tests cover:

- all 195 ISO sovereign-market codes are present and unique;
- every country is resolvable;
- every country receives discovery fallbacks;
- operational sources are separated from discovery-only sources;
- country-aware source routing never needs a global all-source crawl;
- non-IRR currencies are preserved;
- Rial is converted to Toman only for Iranian price text;
- 03:30 is resolved in local market time.

## Known limitation

The architecture is global-complete, but the operational source catalog is not yet direct-price-verified for every one of the 195 markets. `discovery_only` countries are intentionally not marked green as live price coverage. The next hardening stage is to verify and promote country-specific retailers/aggregators until every market has multiple operational price sources.
