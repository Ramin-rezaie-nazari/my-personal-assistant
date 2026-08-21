import { Injectable } from '@nestjs/common';
import { CreateRecommendationDto } from '../dto/create-recommendation.dto';
import { PrismaService } from '../../../common/database/prisma.service';
import { FoodOperatingLoopService } from '../../recipes/services/food-operating-loop.service';
import { GlobalCountryFoodService } from '../../recipes/services/global-country-food.service';
import { PersonalizationService } from './personalization.service';
import { RecommendationRankingService, RankedFoodRecommendation } from './recommendation-ranking.service';

export type FoodDecisionResult = {
  status: 'complete';
  intent: { category: string; goal: string; context: string; cuisineHint: string | null };
  decisionPolicy: string;
  constraints: {
    targetServings: number;
    countryCode: string;
    maxCalories?: number;
    minProteinGrams?: number;
    dietaryPreferences: string[];
    allergySignals: string[];
    dislikedIngredients: string[];
    maxMissingIngredients?: number;
  };
  recommendations: RankedFoodRecommendation[];
  rejected: Array<{ recipeId: string; name: string; reason: string }>;
  meta: { candidates: number; returned: number; confidence: number };
};

@Injectable()
export class RecommendationEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly foodLoop: FoodOperatingLoopService,
    private readonly countryFood: GlobalCountryFoodService,
    private readonly personalization: PersonalizationService,
    private readonly ranking: RecommendationRankingService,
  ) {}

  async generateRecommendations(userId?: string, request: CreateRecommendationDto = new CreateRecommendationDto()): Promise<FoodDecisionResult> {
    if (!userId) throw new Error('userId is required for food decision recommendations');

    const targetServings = validServings(request.targetServings ?? 2);
    const context = await this.personalization.getFoodDecisionContext(userId, {
      countryCode: request.countryCode,
      dietaryPreferences: request.dietaryPreferences,
      allergySignals: request.allergySignals,
      dislikedIngredients: request.dislikedIngredients,
      maxCalories: request.maxCalories,
      minProteinGrams: request.minProteinGrams,
    });

    const maxResults = Math.min(Math.max(request.maxResults ?? 10, 1), 30);
    const explicitMissingCap = request.maxMissingIngredients !== undefined;
    const maxMissingIngredients = explicitMissingCap ? Math.max(0, request.maxMissingIngredients ?? 0) : undefined;

    const [recipes, inventory, base] = await Promise.all([
      this.prisma.recipe.findMany({
        where: { OR: [{ userId: null }, { userId }] },
        include: { ingredients: { include: { food: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 500,
      }),
      this.prisma.inventoryItem.findMany({ where: { userId }, select: { foodId: true, quantity: true } }),
      this.foodLoop.recommend(userId, targetServings, context.countryCode, context.targetCaloriesPerServing, context.targetProteinPerServing),
    ]);

    const inventoryByFood = new Map(inventory.map((item) => [item.foodId, item.quantity]));
    const baseById = new Map(base.map((item) => [item.recipeId, item]));
    const cuisineHint = detectCuisineHint(`${request.goal || ''} ${request.context || ''}`);
    const countryGuidance = context.countryCode
      ? this.countryFood.getLocalRecipeGuidance(context.countryCode)
      : cuisineHint
        ? this.countryFood.getGuidanceForCuisine(cuisineHint)
        : null;
    const countrySignature = new Set((countryGuidance?.preferredRecipes ?? []).map(normalize));
    const preferredIngredients = (request.preferredIngredients ?? []).map(normalize).filter(Boolean);

    const ranked: RankedFoodRecommendation[] = [];
    const rejected: FoodDecisionResult['rejected'] = [];

    for (const recipe of recipes) {
      const baseItem = baseById.get(recipe.id);
      const ingredientNames = recipe.ingredients.map((item) => normalize(item.food.name));
      const hardBlock = findHardBlock(ingredientNames, context.allergySignals, context.dietaryPreferences);
      if (hardBlock) {
        rejected.push({ recipeId: recipe.id, name: recipe.name, reason: hardBlock });
        continue;
      }

      const availableIngredientCount = recipe.ingredients.filter((ingredient) => Number(inventoryByFood.get(ingredient.foodId) ?? 0) > 0).length;
      const presenceInventoryScore = recipe.ingredients.length ? availableIngredientCount / recipe.ingredients.length : 0.5;
      const inventoryScore = baseItem ? (baseItem.coveragePercent / 100) : presenceInventoryScore;
      const missingCount = baseItem?.missingCount ?? Math.max(0, recipe.ingredients.length - availableIngredientCount);

      if (explicitMissingCap && missingCount > maxMissingIngredients!) {
        rejected.push({ recipeId: recipe.id, name: recipe.name, reason: `too many missing ingredients (${missingCount})` });
        continue;
      }

      const nutritionScore = scoreNutrition(
        recipe.calories / Math.max(recipe.servings, 1),
        recipe.protein / Math.max(recipe.servings, 1),
        context.targetCaloriesPerServing,
        context.targetProteinPerServing,
      );
      const preferenceScore = preferredIngredients.length ? overlapScore(ingredientNames, preferredIngredients) : 0.5;
      const dislikePenalty = overlapScore(ingredientNames, context.dislikedIngredients.map(normalize));
      const allergyPenalty = overlapScore(ingredientNames, context.allergySignals.map(normalize));
      const noveltyScore = novelty(recipe.name, context.recentMealNames);
      const signatureScore = countrySignature.size
        ? (countrySignature.has(normalize(recipe.name)) ? 1 : 0.55)
        : (countryGuidance ? 0.62 : 0.5);
      const cuisineScore = cuisineHint ? cuisineMatchScore(recipe.name, countrySignature, cuisineHint, countryGuidance?.cuisineFamily) : signatureScore;
      const verifiedScore = recipe.verified ? 1 : 0.55;
      const missingScore = 1 - Math.min(1, missingCount / Math.max(1, recipe.ingredients.length));

      const score = weightedScore({
        inventory: inventoryScore,
        nutrition: nutritionScore,
        preference: preferenceScore,
        novelty: noveltyScore,
        country: cuisineScore,
        verified: verifiedScore,
        missing: missingScore,
        dislike: dislikePenalty,
        allergy: allergyPenalty,
      });

      ranked.push({
        recipeId: recipe.id,
        name: recipe.name,
        score: Number(score.toFixed(2)),
        decision: score >= 72 ? 'strong_match' : score >= 55 ? 'good_match' : 'fallback',
        reasons: buildReasons({ inventoryScore, nutritionScore, preferenceScore, noveltyScore, cuisineScore, verifiedScore, missingCount }),
        breakdown: {
          inventory: round(inventoryScore),
          nutrition: round(nutritionScore),
          preference: round(preferenceScore),
          novelty: round(noveltyScore),
          cuisine: round(cuisineScore),
          verified: round(verifiedScore),
          missing: round(missingScore),
          penalties: round((dislikePenalty + allergyPenalty) / 2),
        },
        targetServings,
        caloriesPerServing: round(recipe.calories / Math.max(recipe.servings, 1), 1),
        proteinPerServing: round(recipe.protein / Math.max(recipe.servings, 1), 1),
        missingIngredients: baseItem?.missingIngredients ?? [],
      });
    }

    const recommendations = this.ranking.rankRecommendations(ranked, maxResults);
    const confidence = confidenceFor(recommendations, recipes.length, countryGuidance !== null || cuisineHint !== null);

    return {
      status: 'complete',
      intent: {
        category: request.category || 'food',
        goal: request.goal || 'choose_meal',
        context: request.context || '',
        cuisineHint,
      },
      decisionPolicy: 'hard safety filters → nutrition → inventory → explicit preferences → novelty → cuisine/country routing → verification → diversification',
      constraints: {
        targetServings,
        countryCode: context.countryCode,
        maxCalories: context.targetCaloriesPerServing,
        minProteinGrams: context.targetProteinPerServing,
        dietaryPreferences: context.dietaryPreferences,
        allergySignals: context.allergySignals,
        dislikedIngredients: context.dislikedIngredients,
        ...(explicitMissingCap ? { maxMissingIngredients } : {}),
      },
      recommendations,
      rejected: rejected.slice(0, 100),
      meta: { candidates: recipes.length, returned: recommendations.length, confidence },
    };
  }
}

function normalize(value: string): string {
  return String(value || '').toLowerCase().normalize('NFKD').replace(/\p{Diacritic}/gu, '').replace(/[–—]/g, '-').replace(/[^a-z0-9آ-ی]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function detectCuisineHint(value: string): string | null {
  const text = normalize(value);
  const hints: Array<[string, string[]]> = [
    ['Indian', ['indian', 'hindi', 'hindu']],
    ['Japanese', ['japanese', 'japan']],
    ['Korean', ['korean', 'korea']],
    ['Thai', ['thai', 'thailand']],
    ['Chinese', ['chinese', 'china']],
    ['Mexican', ['mexican', 'mexico']],
    ['Italian', ['italian', 'italy']],
    ['French', ['french', 'france']],
    ['Persian', ['persian', 'iranian', 'irani']],
    ['Mediterranean', ['mediterranean']],
    ['Turkish', ['turkish', 'turkey']],
    ['Spanish', ['spanish', 'spain']],
    ['Levantine', ['levantine', 'lebanese', 'levant']],
  ];
  return hints.find(([, aliases]) => aliases.some((alias) => text.includes(alias)))?.[0] ?? null;
}

function cuisineMatchScore(recipeName: string, signature: Set<string>, hint: string, family?: string): number {
  const normalizedName = normalize(recipeName);
  if (signature.has(normalizedName)) return 1;
  const normalizedFamily = normalize(family || '');
  const normalizedHint = normalize(hint);
  if (normalizedFamily.includes(normalizedHint) || normalizedHint.includes(normalizedFamily)) return 0.95;
  return 0.5;
}

function overlapScore(values: string[], targets: string[]): number {
  if (!targets.length) return 0.5;
  const hits = targets.filter((target) => values.some((value) => value.includes(target) || target.includes(value)));
  return hits.length / targets.length;
}

function findHardBlock(ingredients: string[], allergies: string[], diets: string[]): string | null {
  const joined = ingredients.join(' ');
  for (const allergy of allergies.map(normalize).filter(Boolean)) {
    if (joined.includes(allergy)) return `allergy signal: ${allergy}`;
  }
  const normalizedDiets = diets.map(normalize);
  if (normalizedDiets.some((diet) => diet === 'vegan' || diet === 'plant based') && /milk|cheese|yogurt|butter|cream|egg|chicken|beef|pork|fish|shrimp|shellfish|gelatin|honey/.test(joined)) return 'not vegan-compatible';
  if (normalizedDiets.includes('vegetarian') && /chicken|beef|pork|lamb|turkey|fish|shrimp|shellfish/.test(joined)) return 'not vegetarian-compatible';
  if (normalizedDiets.includes('dairy free') && /milk|cheese|yogurt|butter|cream|whey/.test(joined)) return 'contains dairy signal';
  if (normalizedDiets.includes('gluten free') && /wheat|barley|rye|pasta|bread|flour|seitan/.test(joined)) return 'contains gluten signal';
  return null;
}

function scoreNutrition(calories: number, protein: number, calorieTarget?: number, proteinTarget?: number): number {
  const kcal = calorieTarget && calorieTarget > 0 ? clamp01(1 - Math.abs(calories - calorieTarget) / Math.max(calorieTarget, 150)) : 0.6;
  const prot = proteinTarget && proteinTarget > 0 ? clamp01(protein / proteinTarget) : 0.6;
  return clamp01((kcal + Math.min(prot, 1)) / 2);
}

function novelty(name: string, recent: string[]): number {
  const normalized = normalize(name);
  if (!recent.length) return 0.8;
  const hits = recent.filter((item) => normalize(item) === normalized).length;
  return hits === 0 ? 1 : Math.max(0.15, 1 - hits * 0.28);
}

function weightedScore(input: { inventory:number; nutrition:number; preference:number; novelty:number; country:number; verified:number; missing:number; dislike:number; allergy:number }): number {
  const positive = 0.28 * input.inventory + 0.24 * input.nutrition + 0.12 * input.preference + 0.10 * input.novelty + 0.08 * input.country + 0.06 * input.verified + 0.12 * input.missing;
  const penalties = 0.08 * input.dislike + 0.04 * input.allergy;
  return clamp01(positive - penalties) * 100;
}

function buildReasons(input: { inventoryScore:number; nutritionScore:number; preferenceScore:number; noveltyScore:number; cuisineScore:number; verifiedScore:number; missingCount:number }): string[] {
  const reasons: string[] = [];
  if (input.inventoryScore >= 0.7) reasons.push('uses a large share of what you already have');
  if (input.nutritionScore >= 0.75) reasons.push('fits your nutrition target well');
  if (input.preferenceScore >= 0.75) reasons.push('matches ingredients you prefer');
  if (input.cuisineScore >= 0.9) reasons.push('matches the requested food culture');
  if (input.noveltyScore >= 0.95) reasons.push('adds variety instead of repeating a recent meal');
  if (input.verifiedScore >= 1) reasons.push('uses a verified recipe');
  if (input.missingCount === 0) reasons.push('everything needed is already available');
  else if (input.missingCount <= 3) reasons.push(`only ${input.missingCount} ingredient${input.missingCount === 1 ? '' : 's'} missing`);
  return reasons.slice(0, 5);
}

function confidenceFor(recommendations: RankedFoodRecommendation[], candidates: number, hasContext: boolean): number {
  if (!recommendations.length || candidates === 0) return 0;
  const spread = recommendations.length > 1 ? Math.abs(recommendations[0].score - recommendations[1].score) / 100 : 0.2;
  return Number(clamp01(0.55 + Math.min(0.2, spread) + (hasContext ? 0.1 : 0) + (recommendations.length >= 5 ? 0.1 : 0)).toFixed(2));
}

function validServings(value: number): number {
  if (!Number.isInteger(value) || value < 1 || value > 10000) throw new Error('targetServings must be an integer between 1 and 10000');
  return value;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function round(value: number, digits = 3): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
