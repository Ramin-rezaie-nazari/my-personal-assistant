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
export type PriceSourceHealth = {
  attempts: number;
  successes: number;
  failures: number;
  lastAttemptAt?: Date;
  lastSuccessAt?: Date;
  lastFailureAt?: Date;
};
@Injectable()
export class PriceSourceService {
  private readonly adapters = new Map<string, PriceSourceAdapter>();
  private readonly health = new Map<string, PriceSourceHealth>();
  constructor(private readonly registry?: PriceSourceRegistryService) {
    if (registry)
      for (const s of registry.list(true))
        this.register(new HttpPriceSourceAdapter(s));
  }
  register(a: PriceSourceAdapter) {
    this.adapters.set(a.id, a);
    if (!this.health.has(a.id)) this.health.set(a.id, { attempts: 0, successes: 0, failures: 0 });
    return this;
  }
  async collect(keys: string[], ids?: string[]) {
    return (await this.collectDetailed(keys, ids)).prices;
  }
  async collectDetailed(keys: string[], sourceIds?: string[]): Promise<PriceCollectionResult> {
    const ids = sourceIds?.length ? sourceIds : [...this.adapters.keys()];
    const results = await Promise.allSettled(ids.map(async (id) => {
      const a = this.adapters.get(id);
      if (!a) throw new Error(`price_source_adapter_not_registered:${id}`);
      return a.fetchPrices(keys);
    }));
    const prices: NormalizedPrice[] = [], failed: string[] = [];
    results.forEach((r, i) => {
      const id = ids[i];
      const now = new Date();
      const current = this.health.get(id) ?? { attempts: 0, successes: 0, failures: 0 };
      current.attempts += 1;
      current.lastAttemptAt = now;
      if (r.status === 'fulfilled') {
        current.successes += 1;
        current.lastSuccessAt = now;
        prices.push(...(r.value ?? []));
      } else {
        current.failures += 1;
        current.lastFailureAt = now;
        failed.push(id);
      }
      this.health.set(id, current);
    });
    return { prices, failedSourceIds: failed, attemptedSourceIds: ids };
  }
  sources() {
    return this.registry
      ? this.registry.list(true).map(({ id, name, kind, baseUrl, trustScore, supportedCurrencies, unitAware, freshnessWindowHours }) => ({
          id, name, kind, baseUrl, trustScore, supportedCurrencies, unitAware, freshnessWindowHours,
          health: this.health.get(id) ?? { attempts: 0, successes: 0, failures: 0 },
        }))
      : [];
  }
}
