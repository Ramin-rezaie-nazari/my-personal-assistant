import { Injectable } from '@nestjs/common';
import { NormalizedPrice } from '../models/price-intelligence.model';

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
    const results = await Promise.allSettled(
      ids.map(async (id) => {
        const adapter = this.adapters.get(id);
        if (!adapter) throw new Error(`price_source_adapter_not_registered:${id}`);
        return adapter.fetchPrices(productKeys);
      }),
    );

    const prices: NormalizedPrice[] = [];
    const failedSourceIds: string[] = [];
    results.forEach((result, index) => {
      const sourceId = ids[index];
      if (result.status === 'fulfilled') {
        prices.push(...(result.value ?? []));
      } else {
        failedSourceIds.push(sourceId);
      }
    });

    return { prices, failedSourceIds, attemptedSourceIds: ids };
  }

  sources() {
    return [...this.adapters.values()].map(({ id, kind }) => ({ id, kind }));
  }
}
