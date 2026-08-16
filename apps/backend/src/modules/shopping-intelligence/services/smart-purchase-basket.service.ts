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

  optimize(items: BasketItem[], budgetRemaining: number): BasketDecision {
    const currency =
      items.flatMap((item) => item.candidates).find(Boolean)?.currency ?? 'USD';
    const results = items.map((item) => {
      const decision = this.decision.decide(item.candidates, budgetRemaining);
      const price = decision.candidate?.price ?? null;
      return {
        productKey: item.productKey,
        quantity: item.quantity,
        decision,
        selectedPrice: price,
      };
    });
    const total = results.reduce(
      (sum, item) => sum + (item.selectedPrice ?? 0) * item.quantity,
      0,
    );
    const feasible =
      total <= budgetRemaining &&
      results.every((item) => item.decision.action !== 'avoid');
    const reasons = feasible
      ? []
      : ['basket_exceeds_budget_or_contains_avoid_items'];
    return { total, currency, items: results, feasible, reasons };
  }
}
