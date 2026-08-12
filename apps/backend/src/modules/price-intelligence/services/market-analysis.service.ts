import { Injectable } from '@nestjs/common';
import { PriceHistoryStoreService } from './price-history-store.service';
import { PriceInsight } from '../models/price-intelligence.model';

@Injectable()
export class MarketAnalysisService {
  constructor(private readonly history: PriceHistoryStoreService) {}

  analyze(productKey: string, now = new Date()): PriceInsight {
    const snapshots = this.history.forProduct(productKey);
    if (!snapshots.length) return { productKey, current: null, average7d: null, average30d: null, min30d: null, max30d: null, changeVs7d: null, changeVs30d: null, trend: 'insufficient_data', buyScore: 0, recommendation: 'unavailable' };
    const latest = snapshots[snapshots.length - 1].amount;
    const seven = snapshots.filter((item) => now.getTime() - item.observedAt.getTime() <= 7 * 86400000).map((item) => item.amount);
    const thirty = snapshots.filter((item) => now.getTime() - item.observedAt.getTime() <= 30 * 86400000).map((item) => item.amount);
    const average = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
    const avg7 = average(seven), avg30 = average(thirty);
    const min30 = thirty.length ? Math.min(...thirty) : null;
    const max30 = thirty.length ? Math.max(...thirty) : null;
    const change = (avg: number | null) => avg === null || avg === 0 ? null : (latest - avg) / avg;
    const change7 = change(avg7), change30 = change(avg30);
    const trend = change30 === null ? 'insufficient_data' : change30 < -0.05 ? 'falling' : change30 > 0.05 ? 'rising' : 'stable';
    const lowVs30 = min30 && min30 > 0 ? Math.max(0, Math.min(1, (avg30! - latest) / min30 + 0.5)) : 0.5;
    const buyScore = Math.max(0, Math.min(1, (change30 !== null && change30 < 0 ? 0.5 + Math.min(0.5, Math.abs(change30) * 3) : 0.35) + (lowVs30 - 0.5) * 0.35));
    const recommendation = buyScore >= 0.7 ? 'buy_now' : trend === 'rising' ? 'watch' : 'wait';
    return { productKey, current: latest, average7d: avg7, average30d: avg30, min30d: min30, max30d: max30, changeVs7d: change7, changeVs30d: change30, trend, buyScore, recommendation };
  }
}
