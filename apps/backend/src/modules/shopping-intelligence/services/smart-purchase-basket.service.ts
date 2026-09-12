import { Injectable } from '@nestjs/common';
import {
  PurchaseCandidate,
  PurchaseDecision,
  SmartPurchaseDecisionService,
} from './smart-purchase-decision.service';

export type BasketItem = {
  productKey: string;
  candidates: PurchaseCandidate[];
  quantity: number;
};
export type BasketDecision = {
  total: number;
  currency: string;
  items: Array<{
    productKey: string;
    quantity: number;
    decision: PurchaseDecision;
    selectedPrice: number | null;
  }>;
  feasible: boolean;
  reasons: string[];
};

@Injectable()
export class SmartPurchaseBasketService {
  constructor(private readonly decision: SmartPurchaseDecisionService) {}

  optimize(
    items: BasketItem[],
    budgetRemaining: number,
    budgetCurrency?: string,
  ): BasketDecision {
    const currency =
      budgetCurrency ??
      items.flatMap((item) => item.candidates).find(Boolean)?.currency ??
      'USD';
    let remaining = Math.max(0, budgetRemaining);

    const results = items.map((item) => {
      const compatibleCandidates = budgetCurrency
        ? item.candidates.filter((candidate) => candidate.currency === budgetCurrency)
        : item.candidates;
      const affordableCandidates = compatibleCandidates.filter(
        (candidate) =>
          Number.isFinite(candidate.price) &&
          candidate.price >= 0 &&
          candidate.price * Math.max(0, item.quantity) <= remaining,
      );

      const decision = affordableCandidates.length
        ? this.decision.decide(affordableCandidates, remaining)
        : {
            action: 'avoid' as const,
            score: 0,
            reasons: compatibleCandidates.length
              ? ['over_budget']
              : ['currency_mismatch'],
            candidate: null,
          };
      const price = decision.candidate?.price ?? null;
      const estimatedCost = price !== null ? price * Math.max(0, item.quantity) : 0;
      remaining = Math.max(0, remaining - estimatedCost);

      return {
        productKey: item.productKey,
        quantity: item.quantity,
        decision,
        selectedPrice: price,
      };
    });
    const total = results.reduce(
      (sum, item) => sum + (item.selectedPrice ?? 0) * Math.max(0, item.quantity),
      0,
    );
    const feasible =
      total <= budgetRemaining &&
      results.every((item) => item.decision.action !== 'avoid');
    const reasons = feasible
      ? []
      : [
          ...new Set(
            results.flatMap((item) =>
              item.decision.reasons.length
                ? item.decision.reasons
                : ['basket_exceeds_budget_or_contains_avoid_items'],
            ),
          ),
        ];
    return { total, currency, items: results, feasible, reasons };
  }
}
