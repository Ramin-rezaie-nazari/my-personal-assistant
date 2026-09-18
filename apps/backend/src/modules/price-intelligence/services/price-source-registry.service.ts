import { Injectable } from '@nestjs/common';
import { PriceSourceKind } from '../models/price-intelligence.model';

export type PriceSourceDefinition = {
  id: string;
  name: string;
  kind: PriceSourceKind;
  baseUrl: string;
  searchUrlTemplate: string;
  enabled: boolean;
  adapterId: string;
  scope: 'local' | 'global';
  collectionMode: 'tracked_products' | 'global_recent';
  license?: string;
  notes?: string;
};

@Injectable()
export class PriceSourceRegistryService {
  private readonly definitions: PriceSourceDefinition[] = [
    {
      id: 'okala',
      name: 'اُکالا',
      kind: 'retailer',
      baseUrl: 'https://okala.com',
      searchUrlTemplate:
        process.env.PRICE_OKALA_SEARCH_URL ??
        'https://okala.com/search?query={query}',
      enabled: true,
      adapterId: 'okala',
      scope: 'local',
      collectionMode: 'tracked_products',
    },
    {
      id: 'snapp-market',
      name: 'اسنپ‌مارکت',
      kind: 'retailer',
      baseUrl: 'https://snapp.market',
      searchUrlTemplate:
        process.env.PRICE_SNAPP_MARKET_SEARCH_URL ??
        'https://snapp.market/search?query={query}',
      enabled: true,
      adapterId: 'snapp-market',
      scope: 'local',
      collectionMode: 'tracked_products',
    },
    {
      id: 'digikala',
      name: 'دیجی‌کالا',
      kind: 'marketplace',
      baseUrl: 'https://www.digikala.com',
      searchUrlTemplate:
        process.env.PRICE_DIGIKALA_SEARCH_URL ??
        'https://www.digikala.com/search/?q={query}',
      enabled: true,
      adapterId: 'digikala',
      scope: 'local',
      collectionMode: 'tracked_products',
    },
    {
      id: 'digishahrvand',
      name: 'دیجی‌شهروند',
      kind: 'retailer',
      baseUrl: 'https://www.digishahrvand.com',
      searchUrlTemplate:
        process.env.PRICE_DIGISHAHRVAND_SEARCH_URL ??
        'https://www.digishahrvand.com/?s={query}',
      enabled: true,
      adapterId: 'digishahrvand',
      scope: 'local',
      collectionMode: 'tracked_products',
    },
    {
      id: 'digikala-jet',
      name: 'دیجی‌کالا جت',
      kind: 'retailer',
      baseUrl: 'https://digikalajet.com',
      searchUrlTemplate:
        process.env.PRICE_DIGIKALA_JET_SEARCH_URL ??
        'https://digikalajet.com/search?q={query}',
      enabled: true,
      adapterId: 'digikala-jet',
      scope: 'local',
      collectionMode: 'tracked_products',
    },
    {
      id: 'pinaket',
      name: 'پینکت',
      kind: 'retailer',
      baseUrl: 'https://pinaket.com',
      searchUrlTemplate:
        process.env.PRICE_PINAKET_SEARCH_URL ??
        'https://pinaket.com/search?q={query}',
      enabled: true,
      adapterId: 'pinaket',
      scope: 'local',
      collectionMode: 'tracked_products',
    },
    {
      id: 'feenama',
      name: 'فی‌نما',
      kind: 'marketplace',
      baseUrl: 'https://feenama.com',
      searchUrlTemplate:
        process.env.PRICE_FEENAMA_SEARCH_URL ??
        'https://feenama.com/?s={query}',
      enabled: true,
      adapterId: 'feenama',
      scope: 'local',
      collectionMode: 'tracked_products',
    },
    {
      id: 'torob',
      name: 'ترب',
      kind: 'marketplace',
      baseUrl: 'https://torob.com',
      searchUrlTemplate:
        process.env.PRICE_TOROB_SEARCH_URL ??
        'https://torob.com/search/?query={query}',
      enabled: true,
      adapterId: 'torob',
      scope: 'local',
      collectionMode: 'tracked_products',
    },
    {
      id: 'emalls',
      name: 'ایمالز',
      kind: 'marketplace',
      baseUrl: 'https://emalls.ir',
      searchUrlTemplate:
        process.env.PRICE_EMALLS_SEARCH_URL ??
        'https://emalls.ir/Search.aspx?Search={query}',
      enabled: true,
      adapterId: 'emalls',
      scope: 'local',
      collectionMode: 'tracked_products',
    },
    {
      id: 'open-prices',
      name: 'Open Prices (Open Food Facts)',
      kind: 'open_dataset',
      baseUrl: 'https://prices.openfoodfacts.org',
      searchUrlTemplate: 'https://prices.openfoodfacts.org/api/v1/prices',
      enabled: true,
      adapterId: 'open-prices',
      scope: 'global',
      collectionMode: 'global_recent',
      license: 'ODbL-1.0',
      notes: 'Read-only global food-price observations with country/location metadata.',
    },
  ];

  list(enabledOnly = false): PriceSourceDefinition[] {
    return enabledOnly
      ? this.definitions.filter((source) => source.enabled)
      : [...this.definitions];
  }

  get(id: string): PriceSourceDefinition | null {
    return this.definitions.find((source) => source.id === id) ?? null;
  }
}
