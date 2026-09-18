import { Injectable } from '@nestjs/common';
import { NormalizedPrice } from '../models/price-intelligence.model';
import { FaoFpmaSourceAdapter } from './fao-fpma-source.adapter';
import { OpenPricesSourceAdapter } from './open-prices-source.adapter';
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

  constructor(private readonly registry?: PriceSourceRegistryService) {
    if (!registry) return;
    for (const source of registry.list(true)) {
      const adapter =
        source.adapterId === 'open-prices'
          ? new OpenPricesSourceAdapter()
          : source.adapterId === 'fao-fpma'
            ? new FaoFpmaSourceAdapter()
            : new HttpPriceSourceAdapter(source);
      this.register(adapter);
    }
  }

  register(adapter: PriceSourceAdapter) {
    this.adapters.set(adapter.id, adapter);
    return this;
  }

  async collect(keys: string[], ids?: string[], countryCode?: string) {
    return (await this.collectDetailed(keys, ids, countryCode)).prices;
  }

  async collectDetailed(
    keys: string[],
    sourceIds?: string[],
    countryCode?: string,
  ): Promise<PriceCollectionResult> {
    const ids = sourceIds?.length
      ? sourceIds
      : this.registry
        ? this.registry.listForCollection(countryCode).map((source) => source.id)
        : [...this.adapters.keys()];

    const results = await Promise.allSettled(
      ids.map(async (id) => {
        const adapter = this.adapters.get(id);
        if (!adapter)
          throw new Error(`price_source_adapter_not_registered:${id}`);
        return adapter.fetchPrices(keys);
      }),
    );

    const prices: NormalizedPrice[] = [];
    const failed: string[] = [];
    results.forEach((result, index) =>
      result.status === 'fulfilled'
        ? prices.push(...(result.value ?? []))
        : failed.push(ids[index]),
    );

    return {
      prices,
      failedSourceIds: failed,
      attemptedSourceIds: ids,
    };
  }

  sources() {
    return this.registry ? this.registry.list(true) : [];
  }
}
