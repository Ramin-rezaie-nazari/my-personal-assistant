import { Injectable } from '@nestjs/common';
import { ProductCandidate, ProductMatchingService } from './product-matching.service';
import { PricePersistenceService } from './price-persistence.service';

@Injectable()
export class PriceIntelligenceService {
  constructor(private readonly matching: ProductMatchingService, private readonly persistence: PricePersistenceService) {}

  async getLatestPrices(productKey?: string) {
    const items = await this.persistence.latest(productKey);
    return { items };
  }

  async getHistory(productKey: string, from?: Date, to?: Date, sourceId?: string) {
    const items = await this.persistence.history(productKey, from, to, sourceId);
    return { productKey, items };
  }

  async analyze(productKey: string) {
    const rows = await this.persistence.history(productKey, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const prices = (rows as Array<{ amount: number; observedAt: Date }>).map((row) => Number(row.amount)).filter((value) => Number.isFinite(value) && value > 0);
    if (!prices.length) return { productKey, current: null, average7d: null, average30d: null, min30d: null, max30d: null, changeVs7d: null, changeVs30d: null, trend: 'insufficient_data', buyScore: 0, recommendation: 'unavailable' };
    const current = prices[prices.length - 1];
    const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
    const avg30 = average(prices);
    const weekRows = rows.filter((row: any) => new Date(row.observedAt).getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000) as Array<{ amount: number }>;
    const avg7 = average(weekRows.map((row) => Number(row.amount)).filter(Number.isFinite));
    const previous7 = prices.length > 7 ? average(prices.slice(0, -Math.min(7, prices.length))) : null;
    const previous30 = prices.length > 30 ? average(prices.slice(0, -30)) : null;
    const changeVs7d = previous7 && previous7 > 0 ? ((current - previous7) / previous7) * 100 : null;
    const changeVs30d = previous30 && previous30 > 0 ? ((current - previous30) / previous30) * 100 : null;
    const min30 = Math.min(...prices); const max30 = Math.max(...prices);
    const trend = changeVs7d === null ? 'insufficient_data' : changeVs7d > 2 ? 'rising' : changeVs7d < -2 ? 'falling' : 'stable';
    const buyScore = Math.round(((max30 - current) / Math.max(1, max30 - min30)) * 100);
    const recommendation = buyScore >= 75 ? 'buy_now' : buyScore <= 25 ? 'wait' : 'watch';
    return { productKey, current, average7d: avg7, average30d: avg30, min30d: min30, max30d: max30, changeVs7d, changeVs30d, trend, buyScore, recommendation };
  }

  matchProduct(reference: ProductCandidate, candidates: ProductCandidate[]) {
    const matches = this.matching.match(reference, candidates);
    return { accepted: matches.filter((match) => match.confidence >= 0.78 && !match.ambiguous), review: matches.filter((match) => match.ambiguous), rejected: matches.filter((match) => match.confidence < 0.55) };
  }
}
