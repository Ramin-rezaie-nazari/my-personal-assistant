import { Injectable } from '@nestjs/common';

export type PurchasePlanItem = {
  productKey: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  urgency: number;
  decision: 'buy_now' | 'wait' | 'avoid' | 'compare_more';
  score: number;
  reason: string;
};

export type PurchasePlanInput = {
  budgetRemaining: number;
  currency: string;
  items: PurchasePlanItem[];
};

export type PurchasePlan = {
  selected: PurchasePlanItem[];
  deferred: PurchasePlanItem[];
  skipped: PurchasePlanItem[];
  selectedTotal: number;
  deferredTotal: number;
  withinBudget: boolean;
};

@Injectable()
export class PurchasePlanService {
  build(input: PurchasePlanInput): PurchasePlan {
    const budget = Math.max(0, input.budgetRemaining);
    const ranked = input.items
      .map((item) => ({ ...item, quantity: Math.max(0, item.quantity), unitPrice: Math.max(0, item.unitPrice), urgency: Math.max(0, Math.min(1, item.urgency)), score: Math.max(0, Math.min(1, item.score)) }))
      .sort((a, b) => (b.urgency * 0.55 + b.score * 0.45) - (a.urgency * 0.55 + a.score * 0.45));

    const selected: PurchasePlanItem[] = [];
    const deferred: PurchasePlanItem[] = [];
    const skipped: PurchasePlanItem[] = [];
    let selectedTotal = 0;
    let deferredTotal = 0;

    for (const item of ranked) {
      const total = item.quantity * item.unitPrice;
      if (item.decision === 'avoid') {
        skipped.push({ ...item, reason: item.reason || 'avoid_recommendation' });
        continue;
      }
      if (item.decision === 'wait' || item.decision === 'compare_more') {
        deferred.push(item);
        deferredTotal += total;
        continue;
      }
      if (selectedTotal + total <= budget) {
        selected.push(item);
        selectedTotal += total;
      } else if (item.urgency >= 0.8) {
        deferred.push({ ...item, reason: 'high_priority_but_over_budget' });
        deferredTotal += total;
      } else {
        skipped.push({ ...item, reason: 'over_budget_low_urgency' });
      }
    }

    return { selected, deferred, skipped, selectedTotal, deferredTotal, withinBudget: selectedTotal <= budget };
  }
}
