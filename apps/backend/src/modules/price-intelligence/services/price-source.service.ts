import { Injectable } from '@nestjs/common';
import { NormalizedPrice } from '../models/price-intelligence.model';

export type PriceSourceAdapter = {
  id: string;
  kind: NormalizedPrice['sourceKind'];
  fetchPrices(productKeys: string[]): Promise<NormalizedPrice[]>;
};

@Injectable()
export class PriceSourceService {
  private readonly adapters = new Map<string, PriceSourceAdapter>();

  register(adapter: PriceSourceAdapter) {
    this.adapters.set(adapter.id, adapter);
    return this;
  }

  async collect(productKeys: string[], sourceIds?: string[]): Promise<NormalizedPrice[]> {
    const ids = sourceIds?.length ? sourceIds : [...this.adapters.keys()];
    const results = await Promise.allSettled(ids.map((id) => this.adapters.get(id)?.fetchPrices(productKeys)));
    return results.flatMap((result) => result.status === 'fulfilled' && result.value ? result.value : []);
  }

  sources() {
    return [...this.adapters.values()].map(({ id, kind }) => ({ id, kind }));
  }
}
