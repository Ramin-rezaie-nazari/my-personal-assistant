import type { PriceSourceKind } from '../models/price-intelligence.model';

export type GlobalMarketSourceRole = 'retailer' | 'aggregator' | 'discovery';

export type GlobalMarketSource = {
  id: string;
  name: string;
  kind: PriceSourceKind | 'retailer_network' | 'grocery_aggregator' | 'marketplace' | 'discovery';
  role: GlobalMarketSourceRole;
  baseUrl: string;
  searchUrlTemplate: string;
  enabled: boolean;
  countries: string[];
};

export type GlobalMarketProfile = {
  countryCode: string;
  countryName: string;
  currencyCode: string | null;
  timezones: string[];
  sourceIds: string[];
  coverage: 'direct_and_aggregator' | 'discovery_only';
};

export const GLOBAL_MARKET_SOURCES: readonly GlobalMarketSource[] = [
__SOURCES__
];

export const GLOBAL_MARKET_PROFILES: readonly GlobalMarketProfile[] = [
__PROFILES__
];
