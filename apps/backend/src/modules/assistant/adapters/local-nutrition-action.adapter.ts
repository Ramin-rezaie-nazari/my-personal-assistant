import { Injectable, OnModuleInit } from '@nestjs/common';

import { NutritionService } from '../../nutrition/services/nutrition.service';
import { DecisionActionAdapterService } from '../../personal-brain/services/decision-action-adapter.service';
import { DecisionCandidate } from '../../personal-brain/services/unified-decision-engine.service';

@Injectable()
export class LocalNutritionActionAdapter implements OnModuleInit {
  readonly actions = ['get_nutrition_summary'];

  constructor(
    private readonly nutritionService: NutritionService,
    private readonly adapters: DecisionActionAdapterService,
  ) {}

  onModuleInit() {
    this.adapters.register(this);
  }

  supports(candidate: DecisionCandidate): boolean {
    return candidate.action === 'get_nutrition_summary';
  }

  execute(
    candidate: DecisionCandidate,
    context: Record<string, unknown>,
  ) {
    return this.executeNutritionSummary(candidate, context);
  }

  private async executeNutritionSummary(
    _candidate: DecisionCandidate,
    context: Record<string, unknown>,
  ) {
    const userId = context.userId;
    if (typeof userId !== 'string' || !userId) {
      throw new Error('user_id_missing');
    }

    const dateKey =
      typeof context.dateKey === 'string' ? context.dateKey : undefined;
    const summary = await this.nutritionService.getDailySummary(userId, dateKey);

    return {
      message: 'خلاصه تغذیه امروزت آماده‌ست.',
      summary,
    };
  }
}
