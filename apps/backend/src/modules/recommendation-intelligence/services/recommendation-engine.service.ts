import { Injectable } from '@nestjs/common';
import { FoodOperatingLoopService } from '../../recipes/services/food-operating-loop.service';
import { PersonalizationService } from './personalization.service';
import { RecommendationRankingService } from './recommendation-ranking.service';
import { CreateRecommendationDto } from '../dto/create-recommendation.dto';

@Injectable()
export class RecommendationEngineService {
  constructor(
    private readonly foodOperatingLoop: FoodOperatingLoopService,
    private readonly personalization: PersonalizationService,
    private readonly ranking: RecommendationRankingService,
  ) {}

  async generateRecommendations(userId: string, dto: CreateRecommendationDto) {
    const context = await this.personalization.buildFoodContext(userId);
    const maxCalories = dto.maxCalories ?? context.calorieLimit;
    const minProteinGrams = dto.minProteinGrams ?? context.proteinFloor;

    const candidates = await this.foodOperatingLoop.recommend(
      userId,
      dto.targetServings,
      dto.countryCode ?? '',
      maxCalories,
      minProteinGrams,
      dto.maxMissingIngredients,
    );

    const recentMeals = new Set(context.recentMealTitles.map(normalizeTitle));
    const personalized = candidates.map((candidate) => {
      const recentlyEaten = recentMeals.has(normalizeTitle(candidate.name));
      const personalizationAdjustment = recentlyEaten ? -10 : 0;
      const score = clamp(candidate.score + personalizationAdjustment, 0, 100);
      const reasons: string[] = [];

      if (candidate.coveragePercent >= 90) {
        reasons.push('Strong pantry coverage');
      } else if (candidate.missingCount > 0) {
        reasons.push(`${candidate.missingCount} ingredient${candidate.missingCount === 1 ? '' : 's'} missing`);
      }
      if (maxCalories !== undefined && candidate.caloriesPerServing <= maxCalories) {
        reasons.push('Fits the calorie target');
      }
      if (minProteinGrams !== undefined && candidate.proteinPerServing >= minProteinGrams) {
        reasons.push('Meets the protein target');
      }
      if (recentlyEaten) {
        reasons.push('Reduced because it was recently logged');
      }
      if (reasons.length === 0) {
        reasons.push('Ranked from the deterministic food operating loop');
      }

      return {
        ...candidate,
        baseScore: candidate.score,
        score,
        personalizationAdjustment,
        recentlyEaten,
        reasons,
      };
    });

    return {
      targetServings: dto.targetServings,
      countryCode: normalizeCountryCode(dto.countryCode),
      generatedDeterministically: true,
      personalization: {
        primaryGoal: context.primaryGoal,
        dietType: context.dietType,
        calorieLimit: maxCalories,
        proteinFloor: minProteinGrams,
        recentMealCount: context.recentMealTitles.length,
      },
      recommendations: this.ranking.rankRecommendations(personalized),
    };
  }
}

function normalizeTitle(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeCountryCode(value?: string): string | null {
  const normalized = value?.trim().toUpperCase();
  return normalized || null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
