import { Injectable } from '@nestjs/common';
import { CreateRecommendationDto } from '../dto/create-recommendation.dto';
import { PrismaService } from '../../../common/database/prisma.service';
import { FoodOperatingLoopService } from '../../recipes/services/food-operating-loop.service';
import { GlobalCountryFoodService } from '../../recipes/services/global-country-food.service';
import { PersonalizationService } from './personalization.service';
import { RecommendationRankingService, RankedFoodRecommendation } from './recommendation-ranking.service';

export type FoodDecisionResult = {
  status: 'complete';
  intent: { category: string; goal: string; context: string; foodThemes: string[] };
  decisionPolicy: string;
  constraints: {
    targetServings: number;
    countryCode: string;
    maxCalories?: number;
    minProteinGrams?: number;
    dietaryPreferences: string[];
    allergySignals: string[];
    dislikedIngredients: string[];
  };
  recommendations: RankedFoodRecommendation[];
  rejected: Array<{ recipeId: string; name: string; reason: string }>;
  meta: {
    candidates: number;
    hardRejected: number;
    returned: number;
    confidence: number;
  };
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
    const themes = inferFoodThemes(request);
    const context = await this.personalization.getFoodDecisionContext(userId, {
      countryCode: request.countryCode,
      dietaryPreferences: request.dietaryPreferences,
      allergySignals: request.allergySignals,
      dislikedIngredients: request.dislikedIngredients,
      maxCalories: request.maxCalories,
      minProteinGrams: request.minProteinGrams,
    });

    const maxMissingIngredients = Math.max(0, request.maxMissingIngredients ?? 12);
    const maxResults = Math.min(Math.max(request.maxResults ?? 10, 1), 30);
    const recipes = await this.prisma.recipe.findMany({
      where: { OR: [{ userId: null }, { userId }] },
      include: { ingredients: { include: { food: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 500,
    });

    const base = await this.foodLoop.recommend(
      userId,
      targetServings,
      context.countryCode,
      context.targetCaloriesPerServing,
      context.targetProteinPerServing,
    );
    const baseById = new Map(base.map((item) => [item.recipeId, item]));
    const countryGuidance = context.countryCode ? this.countryFood.getLocalRecipeGuidance(context.countryCode) : null;
    const countrySignature = new Set((countryGuidance?.preferredRecipes ?? []).map((name) => normalize(name)));
    const preferredIngredients = [...(request.preferredIngredients ?? []), ...themes.preferredIngredients].map(normalize).filter(Boolean);
    const dislikedIngredients = [...context.dislikedIngredients, ...themes.dislikedIngredients].map(normalize).filter(Boolean);

    const ranked: RankedFoodRecommendation[] = [];
    const rejected: FoodDecisionResult['rejected'] = [];

    for (const recipe of recipes) {
      const baseItem = baseById.get(recipe.id);
      const ingredients = recipe.ingredients.map((item) => normalize(item.food.name));
      const joined = `${normalize(recipe.name)} ${normalize(recipe.description || '')}`;
      const hardBlock = findHardBlock(ingredients, context.allergySignals, context.dietaryPreferences);
      if (hardBlock) {
        rejected.push({ recipeId: recipe.id, name: recipe.name, reason: hardBlock });
        continue;
      }

      const missingCount = baseItem?.missingCount ?? recipe.ingredients.length;
      if (request.maxMissingIngredients !== undefined && missingCount > maxMissingIngredients) {
        rejected.push({ recipeId: recipe.id, name: recipe.name, reason: `too many missing ingredients (${missingCount} > ${maxMissingIngredients})` });
        continue;
      }

      const inventoryScore = (baseItem?.coveragePercent ?? 0) / 100;
      const nutritionScore = scoreNutrition(
        recipe.calories / Math.max(recipe.servings, 1),
        recipe.protein / Math.max(recipe.servings, 1),
        context.targetCaloriesPerServing,
        context.targetProteinPerServing,
      );
      const preferenceScore = preferredIngredients.length ? overlapScore(ingredients, preferredIngredients) : 0.5;
      const dislikePenalty = overlapScore(ingredients, dislikedIngredients);
      const allergyPenalty = overlapScore(ingredients, context.allergySignals.map(normalize));
      const noveltyScore = novelty(recipe.name, context.recentMealNames);
      const countryScore = countryFit(recipe.name, joined, countrySignature, countryGuidance?.cuisineFamily || null);
      const themeScore = themeFit(joined, ingredients, themes.foodThemes);
      const verifiedScore = recipe.verified ? 1 : 0.55;
      const missingScore = 1 - Math.min(1, missingCount / Math.max(1, recipe.ingredients.length));
      const coverageBonus = inventoryScore >= 0.8 ? 1 : inventoryScore >= 0.5 ? 0.7 : inventoryScore;

      const score = weightedScore({
        inventory: coverageBonus,
        nutrition: nutritionScore,
        preference: preferenceScore,
        novelty: noveltyScore,
        country: countryScore,
        theme: themeScore,
        verified: verifiedScore,
        missing: missingScore,
        dislike: dislikePenalty,
        allergy: allergyPenalty,
      });

      ranked.push({
        recipeId: recipe.id,
        name: recipe.name,
        score: Number(score.toFixed(2)),
        decision: score >= 78 ? 'strong_match' : score >= 58 ? 'good_match' : 'fallback',
        reasons: buildReasons({ inventoryScore, nutritionScore, preferenceScore, noveltyScore, countryScore, themeScore, verifiedScore, missingCount, maxMissingIngredients }),
        breakdown: {
          inventory: round(inventoryScore),
          nutrition: round(nutritionScore),
          preference: round(preferenceScore),
          novelty: round(noveltyScore),
          country: round(countryScore),
          theme: round(themeScore),
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
    const confidence = confidenceFor(recommendations, recipes.length, rejected.length, Boolean(countryGuidance), themes.foodThemes.length > 0);

    return {
      status: 'complete',
      intent: {
        category: request.category || 'food',
        goal: request.goal || 'choose_meal',
        context: request.context || '',
        foodThemes: themes.foodThemes,
      },
      decisionPolicy: 'intent → hard safety/dietary filters → inventory/scaling → nutrition → explicit preference → ingredient-aware cuisine/country → novelty/diversity → verification → explanation',
      constraints: {
        targetServings,
        countryCode: context.countryCode,
        maxCalories: context.targetCaloriesPerServing,
        minProteinGrams: context.targetProteinPerServing,
        dietaryPreferences: context.dietaryPreferences,
        allergySignals: context.allergySignals,
        dislikedIngredients: context.dislikedIngredients,
      },
      recommendations,
      rejected: rejected.slice(0, 100),
      meta: { candidates: recipes.length, hardRejected: rejected.length, returned: recommendations.length, confidence },
    };
  }
}

type FoodThemes = {
  foodThemes: string[];
  preferredIngredients: string[];
  dislikedIngredients: string[];
};

function inferFoodThemes(request: CreateRecommendationDto): FoodThemes {
  const text = normalize(`${request.category || ''} ${request.goal || ''} ${request.context || ''}`);
  const themes: string[] = [];
  const preferredIngredients: string[] = [];
  const dislikedIngredients: string[] = [];
  const rules: Array<[RegExp, string, string[]]> = [
    [/seafood|sea food|دریایی|ماهی|میگو|بحری/, 'seafood', ['fish', 'salmon', 'tuna', 'shrimp', 'crab']],
    [/indian|هندی|هند/, 'indian', ['cumin', 'turmeric', 'coriander', 'chickpea', 'lentil']],
    [/italian|ایتالیایی|ایتالیا/, 'italian', ['tomato', 'olive oil', 'pasta', 'basil']],
    [/mexican|مکزیکی|مکزیک/, 'mexican', ['corn', 'bean', 'chili', 'lime']],
    [/persian|iranian|ایرانی|ایران|فارسی/, 'persian', ['rice', 'herb', 'saffron', 'chickpea']],
    [/mediterranean|مدیترانه/, 'mediterranean', ['olive oil', 'tomato', 'legume', 'fish']],
    [/asian|آسیایی/, 'asian', ['rice', 'soy', 'ginger', 'sesame']],
    [/high protein|protein|پروتئین/, 'high_protein', ['chicken', 'fish', 'egg', 'lentil', 'yogurt']],
    [/light|lighter|سبک|رژیمی|کم کالری/, 'light', ['vegetable', 'fish', 'legume']],
    [/comfort|آرامش|comfort food/, 'comfort', []],
  ];
  for (const [pattern, theme, ingredients] of rules) {
    if (pattern.test(text)) {
      themes.push(theme);
      preferredIngredients.push(...ingredients);
    }
  }
  return { foodThemes: [...new Set(themes)], preferredIngredients: [...new Set(preferredIngredients)], dislikedIngredients };
}

function normalize(value: string): string {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[–—]/g, '-')
    .replace(/[^a-z0-9آ-ی]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function overlapScore(values: string[], targets: string[]): number {
  if (!targets.length) return 0.5;
  const hits = targets.filter((target) => values.some((value) => value.includes(target) || target.includes(value)));
  return Math.min(1, hits.length / Math.max(1, targets.length));
}

function findHardBlock(ingredients: string[], allergies: string[], diets: string[]): string | null {
  const joined = ingredients.join(' ');
  for (const allergy of allergies.map(normalize).filter(Boolean)) {
    if (joined.includes(allergy)) return `allergy signal: ${allergy}`;
  }
  const normalizedDiets = diets.map(normalize);
  if (normalizedDiets.some((diet) => diet === 'vegan' || diet === 'plant based') && /milk|cheese|yogurt|butter|cream|egg|chicken|beef|pork|lamb|turkey|fish|shrimp|crab|shellfish|gelatin|honey/.test(joined)) return 'not vegan-compatible';
  if (normalizedDiets.includes('vegetarian') && /chicken|beef|pork|lamb|turkey|fish|shrimp|crab|shellfish/.test(joined)) return 'not vegetarian-compatible';
  if (normalizedDiets.includes('dairy free') && /milk|cheese|yogurt|butter|cream|whey/.test(joined)) return 'contains dairy signal';
  if (normalizedDiets.includes('egg free') && /egg|mayonnaise/.test(joined)) return 'contains egg signal';
  if (normalizedDiets.includes('nut free') && /almond|walnut|cashew|pistachio|peanut|hazelnut|nut/.test(joined)) return 'contains nut signal';
  if (normalizedDiets.includes('gluten free') && /wheat|barley|rye|flour|bread|pasta|seitan/.test(joined)) return 'contains gluten signal';
  return null;
}

function scoreNutrition(calories: number, protein: number, calorieTarget?: number, proteinTarget?: number): number {
  const kcal = calorieTarget && calorieTarget > 0 ? clamp01(1 - Math.abs(calories - calorieTarget) / Math.max(calorieTarget, 150)) : 0.6;
  const prot = proteinTarget && proteinTarget > 0 ? clamp01(protein / proteinTarget) : 0.6;
  return clamp01((kcal * 0.55) + (Math.min(prot, 1) * 0.45));
}

function novelty(name: string, recent: string[]): number {
  const normalized = normalize(name);
  if (!recent.length) return 0.8;
  const hits = recent.filter((item) => normalize(item) === normalized).length;
  return hits === 0 ? 1 : Math.max(0.15, 1 - hits * 0.28);
}

function countryFit(name: string, searchable: string, signature: Set<string>, cuisineFamily: string | null): number {
  const normalizedName = normalize(name);
  const normalizedSearch = normalize(searchable);
  if (signature.has(normalizedName)) return 1;
  if (cuisineFamily && normalizedSearch.includes(normalize(cuisineFamily))) return 0.9;
  return signature.size ? 0.58 : 0.5;
}

function themeFit(searchable: string, ingredients: string[], themes: string[]): number {
  if (!themes.length) return 0.5;
  const text = normalize(searchable);
  const ingredientText = ingredients.join(' ');
  const scores = themes.map((theme) => {
    const direct = text.includes(theme.replace('_', ' ')) || themeAliases(theme).some((alias) => text.includes(alias));
    const ingredientSignals = themeIngredientSignals(theme);
    const hits = ingredientSignals.filter((signal) => ingredients.some((item) => item.includes(signal) || signal.includes(item)));
    const ingredientScore = ingredientSignals.length ? Math.min(1, hits.length / Math.min(4, ingredientSignals.length)) : 0;
    return direct ? 1 : ingredientScore;
  });
  return Math.min(1, 0.4 + Math.max(...scores) * 0.6);
}

function themeIngredientSignals(theme: string): string[] {
  const map: Record<string, string[]> = {
    seafood: ['fish', 'salmon', 'tuna', 'shrimp', 'prawn', 'crab', 'shellfish', 'anchovy'],
    indian: ['cumin', 'turmeric', 'coriander', 'garam masala', 'cardamom', 'curry', 'lentil', 'chickpea'],
    italian: ['olive oil', 'tomato', 'basil', 'parmesan', 'mozzarella', 'pasta', 'risotto'],
    mexican: ['corn', 'bean', 'chili', 'lime', 'avocado', 'jalapeno', 'cilantro'],
    persian: ['rice', 'saffron', 'dill', 'mint', 'parsley', 'chickpea', 'barberry', 'walnut'],
    mediterranean: ['olive oil', 'tomato', 'feta', 'chickpea', 'lentil', 'eggplant', 'fish'],
    asian: ['rice', 'soy', 'ginger', 'sesame', 'tofu', 'miso', 'noodle'],
    high_protein: ['chicken', 'fish', 'egg', 'beef', 'turkey', 'lentil', 'yogurt'],
    light: ['vegetable', 'fish', 'salad', 'legume', 'spinach', 'cucumber'],
    comfort: ['potato', 'cheese', 'butter', 'cream', 'stew', 'soup'],
  };
  return map[theme] || [];
}

function themeAliases(theme: string): string[] {
  const map: Record<string, string[]> = {
    seafood: ['fish', 'salmon', 'tuna', 'shrimp', 'crab', 'seafood'],
    indian: ['curry', 'masala', 'biryani', 'dal', 'tandoori'],
    italian: ['pasta', 'risotto', 'parmesan', 'italian'],
    mexican: ['taco', 'enchilada', 'salsa', 'mole', 'mexican'],
    persian: ['ghormeh', 'fesenjan', 'kebab', 'persian', 'pilaf'],
    mediterranean: ['mediterranean', 'olive oil', 'feta', 'hummus'],
    asian: ['rice', 'soy', 'ramen', 'noodle', 'stir fry'],
    high_protein: ['chicken', 'fish', 'egg', 'steak', 'protein'],
    light: ['salad', 'grilled', 'roasted', 'light'],
    comfort: ['stew', 'casserole', 'soup', 'pie'],
  };
  return map[theme] || [];
}

function weightedScore(input: { inventory:number; nutrition:number; preference:number; novelty:number; country:number; theme:number; verified:number; missing:number; dislike:number; allergy:number }): number {
  const positive =
    0.25 * input.inventory +
    0.22 * input.nutrition +
    0.12 * input.preference +
    0.08 * input.novelty +
    0.08 * input.country +
    0.10 * input.theme +
    0.05 * input.verified +
    0.10 * input.missing;
  const penalties = 0.06 * input.dislike + 0.02 * input.allergy;
  return clamp01(positive - penalties) * 100;
}

function buildReasons(input: { inventoryScore:number; nutritionScore:number; preferenceScore:number; noveltyScore:number; countryScore:number; themeScore:number; verifiedScore:number; missingCount:number; maxMissingIngredients:number }): string[] {
  const reasons: string[] = [];
  if (input.inventoryScore >= 0.7) reasons.push('uses a large share of what you already have');
  if (input.nutritionScore >= 0.75) reasons.push('fits your nutrition target well');
  if (input.preferenceScore >= 0.75) reasons.push('matches ingredients or food styles you prefer');
  if (input.themeScore >= 0.8) reasons.push('matches what you asked for');
  if (input.countryScore >= 0.9) reasons.push('fits the selected country context');
  if (input.noveltyScore >= 0.95) reasons.push('adds variety instead of repeating a recent meal');
  if (input.verifiedScore >= 1) reasons.push('uses a verified recipe');
  if (input.missingCount === 0) reasons.push('everything needed is already available');
  else if (input.missingCount <= Math.min(3, input.maxMissingIngredients)) reasons.push(`only ${input.missingCount} ingredient${input.missingCount === 1 ? '' : 's'} missing`);
  return reasons.slice(0, 5);
}

function confidenceFor(recommendations: RankedFoodRecommendation[], candidates: number, rejected: number, hasCountry: boolean, hasIntent: boolean): number {
  if (!recommendations.length || candidates === 0) return 0;
  const spread = recommendations.length > 1 ? Math.abs(recommendations[0].score - recommendations[1].score) / 100 : 0.2;
  const evidence = Math.min(0.15, recommendations[0].breakdown.inventory * 0.08 + recommendations[0].breakdown.nutrition * 0.05);
  const guardrail = rejected > 0 ? 0.05 : 0;
  return Number(clamp01(0.48 + Math.min(0.15, spread) + evidence + (hasCountry ? 0.08 : 0) + (hasIntent ? 0.08 : 0) + (recommendations.length >= 5 ? 0.08 : 0) + guardrail).toFixed(2));
}

function clamp01(value: number): number { return Math.max(0, Math.min(1, value)); }
function round(value: number, digits = 3): number { const factor = 10 ** digits; return Math.round(value * factor) / factor; }
function validServings(value: number): number { const parsed = Number(value); if (!Number.isFinite(parsed)) return 2; return Math.min(10000, Math.max(1, Math.floor(parsed))); }
