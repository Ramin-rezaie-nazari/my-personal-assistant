import { Injectable } from '@nestjs/common';

export type PurchaseCandidate = {
  id: string;
  productKey: string;
  price: number;
  currency: string;
  availability: 'in_stock' | 'out_of_stock' | 'unknown';
  sellerScore?: number;
  priceTrend?: 'rising' | 'falling' | 'stable' | 'unknown';
  priceVs30dAverage?: number;
  stockUrgency?: number;
  userPreferenceScore?: number;
  budgetImpact?: number;
};

export type PurchaseDecision = {
  action: 'buy_now' | 'wait' | 'compare_more' | 'avoid';
  score: number;
  reasons: string[];
  candidate: PurchaseCandidate | null;
};

@Injectable()
export class SmartPurchaseDecisionService {
  decide(
    candidates: PurchaseCandidate[],
    budgetRemaining: number,
  ): PurchaseDecision {
    if (!candidates.length)
      return {
        action: 'compare_more',
        score: 0,
        reasons: ['no_candidates'],
        candidate: null,
      };
    const ranked = candidates
      .map((candidate) => ({
        candidate,
        score: this.score(candidate, budgetRemaining),
      }))
      .sort((a, b) => b.score - a.score);
    const top = ranked[0];
    const reasons: string[] = [];
    if (top.candidate.availability === 'out_of_stock')
      reasons.push('out_of_stock');
    if ((top.candidate.priceVs30dAverage ?? 0) < -0.1)
      reasons.push('below_30d_average');
    if (top.candidate.priceTrend === 'falling')
      reasons.push('falling_price_trend');
    if ((top.candidate.stockUrgency ?? 0) > 0.7)
      reasons.push('high_stock_urgency');
    if (top.candidate.price > budgetRemaining)
      return {
        action: 'avoid',
        score: top.score,
        reasons: [...reasons, 'over_budget'],
        candidate: top.candidate,
      };
    if (top.candidate.availability !== 'in_stock')
      return {
        action: 'compare_more',
        score: top.score,
        reasons,
        candidate: top.candidate,
      };
    if (
      (top.candidate.priceVs30dAverage ?? 0) <= -0.1 ||
      (top.candidate.stockUrgency ?? 0) >= 0.8
    )
      return {
        action: 'buy_now',
        score: top.score,
        reasons,
        candidate: top.candidate,
      };
    if (top.candidate.priceTrend === 'falling')
      return {
        action: 'wait',
        score: top.score,
        reasons: [...reasons, 'price_is_falling'],
        candidate: top.candidate,
      };
    return {
      action: 'compare_more',
      score: top.score,
      reasons: [...reasons, 'no_strong_buy_signal'],
      candidate: top.candidate,
    };
  }

  private score(candidate: PurchaseCandidate, budgetRemaining: number): number {
    const priceSignal = Math.max(
      0,
      Math.min(1, 0.5 - (candidate.priceVs30dAverage ?? 0)),
    );
    const seller = Math.max(0, Math.min(1, candidate.sellerScore ?? 0.5));
    const preference = Math.max(
      0,
      Math.min(1, candidate.userPreferenceScore ?? 0.5),
    );
    const urgency = Math.max(0, Math.min(1, candidate.stockUrgency ?? 0));
    const affordability =
      budgetRemaining <= 0
        ? 0
        : Math.max(0, Math.min(1, 1 - candidate.price / budgetRemaining));
    const availability = candidate.availability === 'in_stock' ? 1 : 0;
    return Math.max(
      0,
      Math.min(
        1,
        priceSignal * 0.3 +
          seller * 0.15 +
          preference * 0.2 +
          urgency * 0.1 +
          affordability * 0.15 +
          availability * 0.1,
      ),
    );
  }
}
