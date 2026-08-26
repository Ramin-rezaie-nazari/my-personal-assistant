import { Injectable } from '@nestjs/common';

export type BudgetCandidate = {
  productKey: string;
  quantity: number;
  unitPrice: number | null;
  urgency: 'critical' | 'soon' | 'normal' | 'none';
  essential: boolean;
};

export type BudgetDecision = BudgetCandidate & {
  affordableQuantity: number;
  estimatedCost: number | null;
  action: 'buy' | 'partial' | 'watch' | 'skip';
  reason: string;
};

@Injectable()
export class ShoppingBudgetPolicyService {
  plan(candidates: BudgetCandidate[], budget: number): { decisions: BudgetDecision[]; spent: number; remaining: number } {
    let remaining = Math.max(0, budget);
    const decisions = [...candidates]
      .sort(
        (a, b) =>
          Number(b.essential) - Number(a.essential) ||
          urgencyRank(a.urgency) - urgencyRank(b.urgency) ||
          (a.unitPrice ?? Number.POSITIVE_INFINITY) - (b.unitPrice ?? Number.POSITIVE_INFINITY),
      )
      .map((candidate) => {
        if (candidate.quantity <= 0) {
          return { ...candidate, affordableQuantity: 0, estimatedCost: 0, action: 'skip' as const, reason: 'no_quantity_needed' };
        }
        if (candidate.unitPrice === null || candidate.unitPrice <= 0) {
          return { ...candidate, affordableQuantity: 0, estimatedCost: null, action: 'watch' as const, reason: 'price_unavailable' };
        }
        const affordableQuantity = Math.min(candidate.quantity, Math.floor(remaining / candidate.unitPrice));
        if (affordableQuantity <= 0) {
          return {
            ...candidate,
            affordableQuantity: 0,
            estimatedCost: null,
            action: candidate.urgency === 'critical' && candidate.essential ? 'partial' as const : 'skip' as const,
            reason: 'budget_exhausted',
          };
        }
        const estimatedCost = affordableQuantity * candidate.unitPrice;
        remaining -= estimatedCost;
        const complete = affordableQuantity >= candidate.quantity;
        return {
          ...candidate,
          affordableQuantity,
          estimatedCost,
          action: complete ? 'buy' as const : 'partial' as const,
          reason: complete ? 'within_budget' : 'budget_limited_quantity',
        };
      });
    return { decisions, spent: budget - remaining, remaining };
  }
}

function urgencyRank(urgency: BudgetCandidate['urgency']) {
  return urgency === 'critical' ? 0 : urgency === 'soon' ? 1 : urgency === 'normal' ? 2 : 3;
}
