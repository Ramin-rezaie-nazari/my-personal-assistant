import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { FoodOperatingLoopService } from '../../recipes/services/food-operating-loop.service';
import { GlobalCountryFoodService } from '../../recipes/services/global-country-food.service';
import {
  FoodPersonalizationContext,
  PersonalizationService,
} from './personalization.service';
import {
  RecommendationRankingService,
  RankedRecommendation,
} from './recommendation-ranking.service';
import { CreateRecommendationDto } from '../dto/create-recommendation.dto';

export type FoodRecommendationResult = {
  generatedDeterministically: true;
  request: CreateRecommendationDto;
  context: FoodPersonalizationContext;
  recommendations: RankedRecommendation[];
  rejectedCandidates: Array<{
    recipeId: string;
    name: string;
    reasons: string[];
  }>;
};

type RecipeCandidate = {
  recipeId: string;
  name: string;
  score: number;
  coveragePercent: number;
  missingCount: number;
  caloriesPerServing: number;
  proteinPerServing: number;
  targetServings: number;
  missingIngredients: unknown[];
};

type RecipeDetails = {
  id: string;
  name: string;
  description: string | null;
  servings: number;
  ingredients: Array<{
    food: { name: string; category: string };
  }>;
};

@Injectable()
export class RecommendationEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly foodOperatingLoop: FoodOperatingLoopService,
    private readonly countryFood: GlobalCountryFoodService,
    private readonly personalization: PersonalizationService,
    private readonly ranking: RecommendationRankingService,
  ) {}

  async generateFoodRecommendations(
    userId: string,
    request: CreateRecommendationDto,
  ): Promise<FoodRecommendationResult> {
    const targetServings = request.targetServings ?? 2;
    const limit = request.limit ?? 5;
    const context = await this.personalization.buildFoodContext(userId);
    const effectiveMaxCalories =
      request.maxCalories ??
      (context.dailyCaloriesGoal
        ? Math.round(context.dailyCaloriesGoal * 0.45)
        : undefined);
    const effectiveMinProtein =
      request.minProteinGrams ??
      (context.proteinGoalGrams
        ? Number((context.proteinGoalGrams * 0.3).toFixed(1))
        : undefined);

    const candidates = (await this.foodOperatingLoop.recommend(
      userId,
      targetServings,
      request.countryCode ?? '',
      effectiveMaxCalories,
      effectiveMinProtein,
    )) as RecipeCandidate[];

    const recipeIds = candidates.map((candidate) => candidate.recipeId);
    const recipes = (await this.prisma.recipe.findMany({
      where: { id: { in: recipeIds } },
      include: { ingredients: { include: { food: { select: { name: true, category: true } } } } },
    })) as RecipeDetails[];
    const recipeById = new Map(recipes.map((recipe) => [recipe.id, recipe]));

    const countryRank = this.countryFood.rankRecipesForCountry(
      request.countryCode ?? '',
      candidates.map((candidate) => ({ name: candidate.name })),
    );
    const countryRankIndex = new Map(
      countryRank.map((candidate, index) => [candidate.name, index]),
    );

    const rejectedCandidates: FoodRecommendationResult['rejectedCandidates'] = [];
    const scored: RankedRecommendation[] = [];

    for (const candidate of candidates) {
      const recipe = recipeById.get(candidate.recipeId);
      if (!recipe) continue;

      const hardBlockReasons = this.getHardBlockReasons(recipe, context);
      if (request.maxMissingIngredients !== undefined && candidate.missingCount > request.maxMissingIngredients) {
        hardBlockReasons.push(
          `requires ${candidate.missingCount} missing ingredients (limit ${request.maxMissingIngredients})`,
        );
      }

      if (hardBlockReasons.length > 0) {
        rejectedCandidates.push({
          recipeId: recipe.id,
          name: recipe.name,
          reasons: hardBlockReasons,
        });
        continue;
      }

      const searchableText = `${recipe.name} ${recipe.description ?? ''}`.toLowerCase();
      const intentTokens = tokenize(
        [request.category, request.goal, request.context, context.primaryGoal, context.nutritionGoal]
          .filter(Boolean)
          .join(' '),
      );
      const intentMatch = overlapRatio(intentTokens, tokenize(searchableText));
      const baseScore = clamp(candidate.score * 0.4, 0, 40);
      const inventoryScore = clamp(candidate.coveragePercent * 0.15, 0, 15);
      const intentScore = clamp(intentMatch * 15, 0, 15);
      const nutritionScore = this.nutritionScore(
        candidate,
        effectiveMaxCalories,
        effectiveMinProtein,
      );
      const countryIndex = countryRankIndex.get(recipe.name);
      const countryScore = countryIndex === 0 ? 10 : countryIndex !== undefined && countryIndex < 3 ? 7 : request.countryCode ? 4 : 0;
      const noveltyScore = context.recentMealNames.some(
        (mealName) => normalize(mealName) === normalize(recipe.name),
      )
        ? 0
        : 5;

      const score = Math.round(
        clamp(
          baseScore + inventoryScore + intentScore + nutritionScore + countryScore + noveltyScore,
          0,
          100,
        ) * 10,
      ) / 10;

      const reasons = [
        candidate.coveragePercent >= 80
          ? `good pantry coverage (${candidate.coveragePercent}%)`
          : `pantry coverage is ${candidate.coveragePercent}%`,
        `${Math.round(intentMatch * 100)}% intent-token match`,
        `nutrition fit: ${candidate.caloriesPerServing} kcal / ${candidate.proteinPerServing}g protein per serving`,
        request.countryCode ? `country relevance score ${countryScore}/10` : 'country context not requested',
        noveltyScore > 0 ? 'not eaten recently' : 'recent meal match lowered novelty',
      ];

      scored.push({
        recipeId: recipe.id,
        name: recipe.name,
        score,
        familyKey: RecommendationRankingService.familyKey(recipe.name),
        reasons,
        scoreBreakdown: {
          baseFoodOperatingLoop: round(baseScore),
          inventoryCoverage: round(inventoryScore),
          intentMatch: round(intentScore),
          nutritionFit: round(nutritionScore),
          countryRelevance: round(countryScore),
          novelty: round(noveltyScore),
        },
        missingCount: candidate.missingCount,
        missingIngredients: candidate.missingIngredients,
        caloriesPerServing: candidate.caloriesPerServing,
        proteinPerServing: candidate.proteinPerServing,
      });
    }

    return {
      generatedDeterministically: true,
      request,
      context,
      recommendations: this.ranking.rankRecommendations(scored, limit),
      rejectedCandidates,
    };
  }

  private getHardBlockReasons(
    recipe: RecipeDetails,
    context: FoodPersonalizationContext,
  ): string[] {
    const ingredientText = recipe.ingredients
      .map((ingredient) => `${ingredient.food.name} ${ingredient.food.category}`)
      .join(' ')
      .toLowerCase();
    const reasons: string[] = [];

    for (const allergy of context.allergyTerms) {
      if (allergy && ingredientText.includes(allergy)) {
        reasons.push(`allergy conflict: ${allergy}`);
      }
    }

    const diet = normalize(context.dietType ?? '');
    if (diet.includes('vegan') && containsAny(ingredientText, ['milk', 'cheese', 'butter', 'egg', 'yogurt', 'cream', 'meat', 'chicken', 'beef', 'fish', 'دود', 'پنیر', 'کره', 'تخم مرغ'])) {
      reasons.push('conflicts with vegan diet');
    } else if (diet.includes('vegetarian') && containsAny(ingredientText, ['meat', 'chicken', 'beef', 'pork', 'fish', 'shrimp', 'مرغ', 'گوشت', 'ماهی'])) {
      reasons.push('conflicts with vegetarian diet');
    }

    return reasons;
  }

  private nutritionScore(
    candidate: RecipeCandidate,
    maxCalories?: number,
    minProteinGrams?: number,
  ): number {
    const calorieFit = maxCalories === undefined ? 5 : candidate.caloriesPerServing <= maxCalories ? 7.5 : 0;
    const proteinFit = minProteinGrams === undefined ? 5 : candidate.proteinPerServing >= minProteinGrams ? 7.5 : 0;
    return calorieFit + proteinFit;
  }
}

function tokenize(value: string): string[] {
  return [...new Set(normalize(value).split(/\s+/).filter((token) => token.length >= 3))];
}

function overlapRatio(requestTokens: string[], candidateTokens: string[]): number {
  if (requestTokens.length === 0) return 0;
  const candidate = new Set(candidateTokens);
  const hits = requestTokens.filter((token) => candidate.has(token)).length;
  return hits / requestTokens.length;
}

function containsAny(value: string, tokens: string[]): boolean {
  return tokens.some((token) => value.includes(token));
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[ً-ٖ]/g, '')
    .replace(/[إأآ]/g, 'ا')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .trim();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
