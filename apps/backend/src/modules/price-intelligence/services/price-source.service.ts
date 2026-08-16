import { Injectable } from '@nestjs/common';
import { NormalizedPrice } from '../models/price-intelligence.model';
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

  constructor(private readonly registry: PriceSourceRegistryService = new PriceSourceRegistryService()) {
    for (const source of registry.list(true)) {
      this.register(new HttpPriceSourceAdapter(source));
    }
  }

  register(adapter: PriceSourceAdapter) {
    this.adapters.set(adapter.id, adapter);
    return this;
  }

  async collect(productKeys: string[], sourceIds?: string[]): Promise<NormalizedPrice[]> {
    const result = await this.collectDetailed(productKeys, sourceIds);
    return result.prices;
  }

  async collectDetailed(productKeys: string[], sourceIds?: string[]): Promise<PriceCollectionResult> {
    const ids = sourceIds?.length ? sourceIds : [...this.adapters.keys()];
    const results = await Promise.allSettled(ids.map(async (id) => {
      const adapter = this.adapters.get(id);
      if (!adapter) throw new Error(`price_source_adapter_not_registered:${id}`);
      return adapter.fetchPrices(productKeys);
    }));
    const prices: NormalizedPrice[] = [];
    const failedSourceIds: string[] = [];
    results.forEach((result, index) => {
      const sourceId = ids[index];
      if (result.status === 'fulfilled') prices.push(...(result.value ?? []));
      else failedSourceIds.push(sourceId);
    });
    return { prices, failedSourceIds, attemptedSourceIds: ids };
  }

  sources() {
    return this.registry.list(true).map(({ id, name, kind, baseUrl }) => ({ id, name, kind, baseUrl }));
  }
}
