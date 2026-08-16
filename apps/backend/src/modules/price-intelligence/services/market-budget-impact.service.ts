import { Injectable } from '@nestjs/common';

export type PlannedPurchase = {
  productKey: string;
  quantity: number;
  unitPrice: number;
  priority?: number;
};

@Injectable()
export class MarketBudgetImpactService {
  project(purchases: PlannedPurchase[], monthlyBudget: number, spent = 0) {
    const planned = purchases.reduce(
      (sum, item) =>
        sum + Math.max(0, item.quantity) * Math.max(0, item.unitPrice),
      0,
    );
    const remainingBefore = monthlyBudget - spent;
    const remainingAfter = remainingBefore - planned;
    const pressure =
      monthlyBudget > 0
        ? Math.max(0, Math.min(1, (spent + planned) / monthlyBudget))
        : 1;
    const prioritized = [...purchases].sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
    );
    return {
      monthlyBudget,
      spent,
      planned,
      remainingBefore,
      remainingAfter,
      pressure,
      overBudget: remainingAfter < 0,
      prioritized,
    };
  }

  opportunity(amount: number, currentBudgetRemaining: number) {
    return {
      affordable: amount <= currentBudgetRemaining,
      remainingAfter: currentBudgetRemaining - amount,
      pressure:
        currentBudgetRemaining <= 0
          ? 1
          : Math.max(0, Math.min(1, amount / currentBudgetRemaining)),
    };
  }
}
