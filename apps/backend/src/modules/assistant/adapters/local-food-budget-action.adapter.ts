import { Injectable, OnModuleInit } from '@nestjs/common';
import { BudgetIntelligenceService } from '../../budget-intelligence/services/budget-intelligence.service';
import { DecisionActionAdapterService } from '../../personal-brain/services/decision-action-adapter.service';
import { DecisionCandidate } from '../../personal-brain/services/unified-decision-engine.service';

@Injectable()
export class LocalFoodBudgetActionAdapter implements OnModuleInit {
  constructor(
    private readonly adapters: DecisionActionAdapterService,
    private readonly budget: BudgetIntelligenceService,
  ) {}

  onModuleInit() {
    this.adapters.register({
      actions: ['plan_food_budget'],
      supports: (candidate) => candidate.action === 'plan_food_budget',
      execute: (candidate, context) => this.execute(candidate, context),
    });
  }

  private async execute(
    _candidate: DecisionCandidate,
    context: Record<string, unknown>,
  ) {
    const local = context.localUnderstanding as
      | { entities?: Record<string, unknown> }
      | undefined;
    const entities = local?.entities ?? {};
    const budget = this.readPositiveNumber(entities.budgetAmount);
    const currency = this.readString(entities.budgetCurrency);

    if (budget === undefined || !currency) {
      return {
        status: 'blocked_missing_budget_context',
        required: ['budgetAmount', 'budgetCurrency'],
      };
    }

    return this.budget.createPlan(context.userId as string, budget, currency);
  }

  private readString(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private readPositiveNumber(value: unknown) {
    return typeof value === 'number' && Number.isFinite(value) && value > 0
      ? value
      : undefined;
  }
}
