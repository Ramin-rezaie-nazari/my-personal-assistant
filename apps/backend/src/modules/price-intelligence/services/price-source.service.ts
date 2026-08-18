import { Injectable } from '@nestjs/common';
import { NormalizedPrice } from '../models/price-intelligence.model';
import { GLOBAL_MARKET_SOURCES } from '../data/global-market-source.catalog';
import { GLOBAL_MARKET_SOURCE_CORRECTIONS } from '../data/global-market-source.corrections';
import { GlobalMarketSourceRegistryService } from './global-market-source-registry.service';
import { HttpPriceSourceAdapter } from './http-price-source.adapter';
import { PriceSourceRegistryService } from './price-source-registry.service';

export type PriceSourceAdapter = {
  id: string;
  kind: NormalizedPrice['sourceKind'];
  fetchPrices(productKeys: string[]): Promise<NormalizedPrice[]>;
};

export type PriceCollectionResult = {
  prices: NormalizedPrice[];
  failedSourceIds: string[];
  attemptedSourceIds: string[];
};

@Injectable()
export class PriceSourceService {
  private readonly adapters = new Map<string, PriceSourceAdapter>();

  constructor(
    private readonly registry?: PriceSourceRegistryService,
    private readonly globalRegistry?: GlobalMarketSourceRegistryService,
  ) {
    for (const source of registry?.list(true) ?? [])
      this.register(new HttpPriceSourceAdapter(source));

    const sources = [
      ...Object.values(GLOBAL_MARKET_SOURCES),
      ...Object.values(GLOBAL_MARKET_SOURCE_CORRECTIONS).flat(),
    ];
    for (const source of sources) {
      if (!source.enabled) continue;
      this.register(
        new HttpPriceSourceAdapter({
          id: source.id,
          kind: this.kindForGlobalSource(source.role),
          baseUrl: source.baseUrl,
          searchUrlTemplate: source.searchUrlTemplate,
        }),
      );
    }
  }

  register(a: PriceSourceAdapter) {
    this.adapters.set(a.id, a);
    return this;
  }

  async collect(keys: string[], ids?: string[]) {
    return (await this.collectDetailed(keys, ids)).prices;
  }

  async collectDetailed(
    keys: string[],
    sourceIds?: string[],
  ): Promise<PriceCollectionResult> {
    const ids = sourceIds?.length ? sourceIds : [...this.adapters.keys()],
      results = await Promise.allSettled(
        ids.map(async (id) => {
          const a = this.adapters.get(id);
          if (!a) throw new Error(`price_source_adapter_not_registered:${id}`);
          return a.fetchPrices(keys);
        }),
      ),
      prices: NormalizedPrice[] = [],
      failed: string[] = [];
    results.forEach((r, i) =>
      r.status === 'fulfilled'
        ? prices.push(...(r.value ?? []))
        : failed.push(ids[i]),
    );
    return { prices, failedSourceIds: failed, attemptedSourceIds: ids };
  }

  async collectForCountryDetailed(
    countryCode: string,
    keys: string[],
  ): Promise<PriceCollectionResult> {
    const normalizedCountry = countryCode.trim().toUpperCase();
    const ids = this.globalRegistry?.getOperationalSourceIds(normalizedCountry) ?? [];
    const result = await this.collectDetailed(keys, ids);
    return {
      ...result,
      prices: result.prices.map((price) => ({
        ...price,
        countryCode: normalizedCountry,
      })),
    };
  }

  sources() {
    const global = [
      ...Object.values(GLOBAL_MARKET_SOURCES),
      ...Object.values(GLOBAL_MARKET_SOURCE_CORRECTIONS).flat(),
    ]
      .filter(
        (source, index, all) =>
          source.enabled &&
          all.findIndex((candidate) => candidate.id === source.id) === index,
      )
      .map(({ id, name, kind, baseUrl }) => ({ id, name, kind, baseUrl }));
    const local = this.registry
      ? this.registry
          .list(true)
          .map(({ id, name, kind, baseUrl }) => ({ id, name, kind, baseUrl }))
      : [];
    return [...local, ...global];
  }

  private kindForGlobalSource(role: 'retailer' | 'aggregator' | 'discovery'):
    NormalizedPrice['sourceKind'] {
    if (role === 'aggregator') return 'web_store';
    return 'retailer';
  }
}
