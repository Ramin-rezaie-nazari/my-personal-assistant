import { Injectable, OnModuleInit } from '@nestjs/common';
import { DecisionActionAdapterService } from '../../personal-brain/services/decision-action-adapter.service';
import { DecisionCandidate } from '../../personal-brain/services/unified-decision-engine.service';
import { FoodOperatingLoopService } from '../../recipes/services/food-operating-loop.service';

@Injectable()
export class LocalMealRecommendationActionAdapter implements OnModuleInit {
  constructor(
    private readonly adapters: DecisionActionAdapterService,
    private readonly food: FoodOperatingLoopService,
  ) {}

  onModuleInit() {
    this.adapters.register({
      actions: ['recommend_meal'],
      supports: (candidate) => candidate.action === 'recommend_meal',
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
    const targetServings = this.readPositiveInteger(entities.householdSize) ?? 1;
    const maxCalories = this.readPositiveNumber(entities.calories);
    const minProteinGrams = this.readPositiveNumber(entities.proteinGrams);
    const countryCode = this.readString(entities.countryCode) ?? '';

    const recommendations = await this.food.recommend(
      context.userId as string,
      targetServings,
      countryCode,
      maxCalories,
      minProteinGrams,
    );

    return {
      targetServings,
      constraints: {
        maxCalories,
        minProteinGrams,
        countryCode: countryCode || undefined,
        unsupportedHardConstraints: this.readStringArray(
          entities.allergies,
        ).concat(this.readStringArray(entities.dietaryPreferences)),
      },
      recommendations,
    };
  }

  private readString(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private readPositiveNumber(value: unknown) {
    return typeof value === 'number' && Number.isFinite(value) && value > 0
      ? value
      : undefined;
  }

  private readPositiveInteger(value: unknown) {
    return typeof value === 'number' && Number.isInteger(value) && value > 0
      ? Math.min(value, 10000)
      : undefined;
  }

  private readStringArray(value: unknown): string[] {
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : [];
  }
}
