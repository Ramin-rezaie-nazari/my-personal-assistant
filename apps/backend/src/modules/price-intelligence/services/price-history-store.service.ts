import { Injectable } from '@nestjs/common';
import {
  NormalizedPrice,
  PriceSnapshot,
} from '../models/price-intelligence.model';

@Injectable()
export class PriceHistoryStoreService {
  private readonly snapshots: PriceSnapshot[] = [];

  record(prices: NormalizedPrice[]) {
    const created = prices.map((price) => ({
      ...price,
      snapshotId: `${price.countryCode ?? 'global'}:${price.currency}:${price.productKey}:${price.sourceId}:${price.observedAt.getTime()}`,
    }));
    this.snapshots.push(...created);
    return created;
  }

  forProduct(
    productKey: string,
    sourceId?: string,
    countryCode?: string,
    currency?: string,
  ) {
    const normalizedCountry = countryCode?.trim().toUpperCase();
    const normalizedCurrency = currency?.trim().toUpperCase();
    return this.snapshots
      .filter(
        (snapshot) =>
          snapshot.productKey === productKey &&
          (!sourceId || snapshot.sourceId === sourceId) &&
          (!normalizedCountry || snapshot.countryCode === normalizedCountry) &&
          (!normalizedCurrency || snapshot.currency.toUpperCase() === normalizedCurrency),
      )
      .sort((a, b) => a.observedAt.getTime() - b.observedAt.getTime());
  }

  since(productKey: string, since: Date, countryCode?: string, currency?: string) {
    const normalizedCountry = countryCode?.trim().toUpperCase();
    const normalizedCurrency = currency?.trim().toUpperCase();
    return this.snapshots.filter(
      (snapshot) =>
        snapshot.productKey === productKey &&
        snapshot.observedAt >= since &&
        (!normalizedCountry || snapshot.countryCode === normalizedCountry) &&
        (!normalizedCurrency || snapshot.currency.toUpperCase() === normalizedCurrency),
    );
  }

  purgeBefore(cutoff: Date) {
    const before = this.snapshots.length;
    for (let index = this.snapshots.length - 1; index >= 0; index -= 1) {
      if (this.snapshots[index].observedAt < cutoff)
        this.snapshots.splice(index, 1);
    }
    return before - this.snapshots.length;
  }
}
