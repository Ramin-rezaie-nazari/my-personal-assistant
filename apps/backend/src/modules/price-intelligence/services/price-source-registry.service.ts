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
  trustScore: number;
  supportedCurrencies: string[];
  unitAware: boolean;
  freshnessWindowHours: number;
  notes?: string;
};

@Injectable()
export class PriceSourceRegistryService {
  private readonly definitions: PriceSourceDefinition[] = [
    {
      id: 'okala', name: 'اُکالا', kind: 'retailer', baseUrl: 'https://okala.com',
      searchUrlTemplate: process.env.PRICE_OKALA_SEARCH_URL ?? 'https://okala.com/search?query={query}', enabled: true, adapterId: 'okala', trustScore: 0.9, supportedCurrencies: ['IRT', 'IRR'], unitAware: false, freshnessWindowHours: 168,
    },
    {
      id: 'snapp-market', name: 'اسنپ‌مارکت', kind: 'retailer', baseUrl: 'https://snapp.market',
      searchUrlTemplate: process.env.PRICE_SNAPP_MARKET_SEARCH_URL ?? 'https://snapp.market/search?query={query}', enabled: true, adapterId: 'snapp-market', trustScore: 0.9, supportedCurrencies: ['IRT', 'IRR'], unitAware: false, freshnessWindowHours: 168,
    },
    {
      id: 'digikala', name: 'دیجی‌کالا', kind: 'marketplace', baseUrl: 'https://www.digikala.com',
      searchUrlTemplate: process.env.PRICE_DIGIKALA_SEARCH_URL ?? 'https://www.digikala.com/search/?q={query}', enabled: true, adapterId: 'digikala', trustScore: 0.85, supportedCurrencies: ['IRT', 'IRR'], unitAware: false, freshnessWindowHours: 168,
    },
    {
      id: 'digishahrvand', name: 'دیجی‌شهروند', kind: 'retailer', baseUrl: 'https://www.digishahrvand.com',
      searchUrlTemplate: process.env.PRICE_DIGISHAHRVAND_SEARCH_URL ?? 'https://www.digishahrvand.com/?s={query}', enabled: true, adapterId: 'digishahrvand', trustScore: 0.85, supportedCurrencies: ['IRT', 'IRR'], unitAware: false, freshnessWindowHours: 168,
    },
    {
      id: 'digikala-jet', name: 'دیجی‌کالا جت', kind: 'retailer', baseUrl: 'https://digikalajet.com',
      searchUrlTemplate: process.env.PRICE_DIGIKALA_JET_SEARCH_URL ?? 'https://digikalajet.com/search?q={query}', enabled: true, adapterId: 'digikala-jet', trustScore: 0.85, supportedCurrencies: ['IRT', 'IRR'], unitAware: false, freshnessWindowHours: 168,
    },
    {
      id: 'pinaket', name: 'پینکت', kind: 'retailer', baseUrl: 'https://pinaket.com',
      searchUrlTemplate: process.env.PRICE_PINAKET_SEARCH_URL ?? 'https://pinaket.com/search?q={query}', enabled: true, adapterId: 'pinaket', trustScore: 0.8, supportedCurrencies: ['IRT', 'IRR'], unitAware: false, freshnessWindowHours: 168,
    },
    {
      id: 'feenama', name: 'فی‌نما', kind: 'marketplace', baseUrl: 'https://feenama.com',
      searchUrlTemplate: process.env.PRICE_FEENAMA_SEARCH_URL ?? 'https://feenama.com/?s={query}', enabled: true, adapterId: 'feenama', trustScore: 0.75, supportedCurrencies: ['IRT', 'IRR'], unitAware: false, freshnessWindowHours: 168,
    },
    {
      id: 'torob', name: 'ترب', kind: 'marketplace', baseUrl: 'https://torob.com',
      searchUrlTemplate: process.env.PRICE_TOROB_SEARCH_URL ?? 'https://torob.com/search/?query={query}', enabled: true, adapterId: 'torob', trustScore: 0.8, supportedCurrencies: ['IRT', 'IRR'], unitAware: false, freshnessWindowHours: 168,
    },
    {
      id: 'emalls', name: 'ایمالز', kind: 'marketplace', baseUrl: 'https://emalls.ir',
      searchUrlTemplate: process.env.PRICE_EMALLS_SEARCH_URL ?? 'https://emalls.ir/Search.aspx?Search={query}', enabled: true, adapterId: 'emalls', trustScore: 0.8, supportedCurrencies: ['IRT', 'IRR'], unitAware: false, freshnessWindowHours: 168,
    },
  ];

  list(enabledOnly = false): PriceSourceDefinition[] {
    return enabledOnly ? this.definitions.filter((source) => source.enabled) : [...this.definitions];
  }

  get(id: string): PriceSourceDefinition | null {
    return this.definitions.find((source) => source.id === id) ?? null;
  }
}
