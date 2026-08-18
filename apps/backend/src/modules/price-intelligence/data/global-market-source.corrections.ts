import { GlobalMarketSource } from './global-market-source.catalog';

export const GLOBAL_MARKET_SOURCE_CORRECTIONS: Readonly<Record<string, GlobalMarketSource[]>> = {
  MX: [
    {
      id: 'rappi',
      name: 'Rappi',
      kind: 'grocery_aggregator',
      role: 'aggregator',
      baseUrl: 'https://www.rappi.com/',
      searchUrlTemplate: 'https://www.rappi.com.mx/search?q={query}',
      enabled: true,
    },
  ],
  NZ: [
    {
      id: 'woolworths_nz',
      name: 'Woolworths New Zealand',
      kind: 'retailer',
      role: 'retailer',
      baseUrl: 'https://www.woolworths.co.nz/',
      searchUrlTemplate: 'https://www.woolworths.co.nz/shop/searchproducts?search={query}',
      enabled: true,
    },
  ],
};

export const GLOBAL_MARKET_SOURCE_EXCLUSIONS: Readonly<Record<string, string[]>> = {
  MX: ['mercadona'],
  NZ: ['woolworths_au'],
};
