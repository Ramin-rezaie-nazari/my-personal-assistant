import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { PricePersistenceService } from '../../price-intelligence/services/price-persistence.service';
import { CreateBudgetPlanDto } from '../dto/create-budget-plan.dto';

export type WeeklyBudgetMeal = {
  day: number;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  recipeId: string;
  recipeName: string;
  servings: number;
  caloriesPerServing: number;
  proteinPerServing: number;
  estimatedCost: number | null;
  costCurrency: string | null;
  priceCoverage: number;
  alreadyOwnedCost: number | null;
  missingIngredients: string[];
  ingredientReuseScore?: number;
};

type ExtendedBudgetPlanRequest = CreateBudgetPlanDto & {
  weeklyBudget?: number;
  days?: number;
  mealsPerDay?: number;
  currency?: string;
};

type PriceRow = {
  productKey: string;
  unitPrice: number | null;
  unit?: string | null;
  currency: string;
  observedAt: Date;
};

type RecipeIngredientLike = {
  quantity: number;
  unit: string;
  food: { name: string };
};

type Candidate = {
  recipe: {
    id: string;
    name: string;
    servings: number;
    calories: number;
    protein: number;
    verified: boolean;
    ingredients: RecipeIngredientLike[];
  };
  ingredientAnalysis: ReturnType<typeof analyzeRecipeCost>;
  score: number;
};

@Injectable()
export class BudgetIntelligenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly prices: PricePersistenceService,
  ) {}

  async createPlan() {
    await Promise.resolve();

    return {
      message: 'Smart food budget plan created',
      budget: null,
      suggestions: [],
    };
  }

  async createWeeklyPlan(
    userId: string,
    request: CreateBudgetPlanDto,
    countryCode = '',
  ) {
    if (!userId) throw new BadRequestException('userId is required');
    if (!Number.isFinite(request.monthlyBudget) || request.monthlyBudget <= 0)
      throw new BadRequestException('monthlyBudget must be greater than 0');
    if (!Number.isInteger(request.familySize) || request.familySize <= 0 || request.familySize > 100)
      throw new BadRequestException('familySize must be an integer between 1 and 100');

    const extended = request as ExtendedBudgetPlanRequest;
    const days = clampInteger(extended.days ?? 7, 1, 7);
    const mealsPerDay = clampInteger(extended.mealsPerDay ?? 3, 1, 3);
    const weeklyBudget = extended.weeklyBudget ?? request.monthlyBudget / 4.345;
    if (!Number.isFinite(weeklyBudget) || weeklyBudget <= 0)
      throw new BadRequestException('weeklyBudget must be greater than 0');
    const perDayBudget = weeklyBudget / days;
    const requestedCurrency = normalizeCurrency(extended.currency);

    const [recipes, inventory] = await Promise.all([
      this.prisma.recipe.findMany({
        where: { OR: [{ userId: null }, { userId }] },
        include: { ingredients: { include: { food: true } } },
        orderBy: [{ verified: 'desc' }, { updatedAt: 'desc' }],
        take: 500,
      }),
      this.prisma.inventoryItem.findMany({
        where: { userId },
        include: { food: true },
      }),
    ]);

    const latestPrices = await this.prices.latest();
    const priceByKey = new Map<string, PriceRow>();
    for (const row of latestPrices as PriceRow[]) {
      if (requestedCurrency && normalizeCurrency(row.currency) !== requestedCurrency) continue;
      if (!Number.isFinite(Number(row.unitPrice)) || Number(row.unitPrice) <= 0) continue;
      if (!row.unit) continue;
      const existing = priceByKey.get(row.productKey);
      if (!existing || new Date(row.observedAt).getTime() > existing.observedAt.getTime()) {
        priceByKey.set(row.productKey, {
          productKey: row.productKey,
          unitPrice: Number(row.unitPrice),
          unit: row.unit,
          currency: row.currency,
          observedAt: new Date(row.observedAt),
        });
      }
    }

    const ownedByKey = new Map<string, { quantity: number; unit: string }>();
    for (const item of inventory) {
      ownedByKey.set(normalizeKey(item.food.name), {
        quantity: Number(item.quantity),
        unit: item.unit,
      });
    }

    const ranked: Candidate[] = recipes
      .map((recipe) => {
        const scale = request.familySize / Math.max(recipe.servings, 1);
        const ingredientAnalysis = analyzeRecipeCost(recipe, scale, ownedByKey, priceByKey);
        const nutrition = nutritionFit(recipe.calories / Math.max(recipe.servings, 1), recipe.protein / Math.max(recipe.servings, 1));
        const affordability = ingredientAnalysis.estimatedCost === null
          ? 0.55
          : clamp01(1 - ingredientAnalysis.estimatedCost / Math.max(perDayBudget, 1));
        const verified = recipe.verified ? 1 : 0.5;
        const simplicity = clamp01(1 - Math.max(0, recipe.ingredients.length - 12) / 12);
        const score = (
          nutrition * 0.34 +
          affordability * 0.36 +
          ingredientAnalysis.inventoryCoverage * 0.15 +
          verified * 0.10 +
          simplicity * 0.05
        ) * 100;

        return { recipe, ingredientAnalysis, score };
      })
      .sort((a, b) => b.score - a.score || a.recipe.name.localeCompare(b.recipe.name));

    const selected: WeeklyBudgetMeal[] = [];
    const selectedCandidates: Candidate[] = [];
    const usedFamilies = new Map<string, number>();
    let plannedCost = 0;

    for (let day = 1; day <= days; day += 1) {
      const dailyCandidates = [...ranked].sort((a, b) => {
        const familyPenaltyA = (usedFamilies.get(familyKey(a.recipe.name)) ?? 0) * 0.12;
        const familyPenaltyB = (usedFamilies.get(familyKey(b.recipe.name)) ?? 0) * 0.12;
        const reuseA = ingredientReuseScore(a.recipe.ingredients, selectedCandidates.slice(-mealsPerDay));
        const reuseB = ingredientReuseScore(b.recipe.ingredients, selectedCandidates.slice(-mealsPerDay));
        return (
          b.score / 100 + reuseB * 0.08 - familyPenaltyB
        ) - (
          a.score / 100 + reuseA * 0.08 - familyPenaltyA
        );
      });

      for (const mealType of mealTypesFor(mealsPerDay)) {
        const chosen = dailyCandidates.find((item) => {
          const family = familyKey(item.recipe.name);
          if ((usedFamilies.get(family) ?? 0) >= 2) return false;
          if (item.ingredientAnalysis.estimatedCost !== null && plannedCost + item.ingredientAnalysis.estimatedCost > weeklyBudget * 1.02) return false;
          return !selected.some((meal) => meal.recipeId === item.recipe.id && meal.day === day);
        }) ?? dailyCandidates.find((item) => !selected.some((meal) => meal.recipeId === item.recipe.id && meal.day === day));

        if (!chosen) continue;

        const family = familyKey(chosen.recipe.name);
        const reuseScore = ingredientReuseScore(chosen.recipe.ingredients, selectedCandidates.slice(-mealsPerDay));
        usedFamilies.set(family, (usedFamilies.get(family) ?? 0) + 1);
        if (chosen.ingredientAnalysis.estimatedCost !== null) plannedCost += chosen.ingredientAnalysis.estimatedCost;

        selectedCandidates.push(chosen);
        selected.push({
          day,
          mealType,
          recipeId: chosen.recipe.id,
          recipeName: chosen.recipe.name,
          servings: request.familySize,
          caloriesPerServing: round(chosen.recipe.calories / Math.max(chosen.recipe.servings, 1), 1),
          proteinPerServing: round(chosen.recipe.protein / Math.max(chosen.recipe.servings, 1), 1),
          estimatedCost: chosen.ingredientAnalysis.estimatedCost,
          costCurrency: chosen.ingredientAnalysis.costCurrency,
          priceCoverage: round(chosen.ingredientAnalysis.priceCoverage),
          alreadyOwnedCost: chosen.ingredientAnalysis.alreadyOwnedCost,
          missingIngredients: chosen.ingredientAnalysis.missingIngredients,
          ingredientReuseScore: round(reuseScore),
        });
      }
    }

    const estimatedMealsWithPrice = selected.filter((item) => item.estimatedCost !== null).length;
    const averagePriceCoverage = selected.length
      ? selected.reduce((sum, item) => sum + item.priceCoverage, 0) / selected.length
      : 0;
    const planCurrency = requestedCurrency || selected.find((item) => item.costCurrency)?.costCurrency || null;

    return {
      status: 'complete',
      budget: {
        monthlyBudget: request.monthlyBudget,
        weeklyBudget,
        perDayBudget,
        currency: planCurrency,
        plannedEstimatedCost: plannedCost > 0 ? round(plannedCost, 2) : null,
        remainingEstimatedBudget: plannedCost > 0 ? round(Math.max(0, weeklyBudget - plannedCost), 2) : null,
        budgetConfidence: estimatedMealsWithPrice / Math.max(1, selected.length),
      },
      household: {
        familySize: request.familySize,
        days,
        mealsPerDay,
        countryCode: countryCode.trim().toUpperCase() || null,
        goal: request.goal,
      },
      meals: selected,
      shopping: buildShoppingSummary(selected, recipes, request.familySize),
      meta: {
        candidateRecipes: recipes.length,
        plannedMeals: selected.length,
        averagePriceCoverage: round(averagePriceCoverage),
        pricesWereAvailable: priceByKey.size > 0,
        priceCurrencyFiltered: Boolean(requestedCurrency),
      },
    };
  }
}

function analyzeRecipeCost(
  recipe: { ingredients: RecipeIngredientLike[] },
  scale: number,
  ownedByKey: Map<string, { quantity: number; unit: string }>,
  prices: Map<string, PriceRow>,
) {
  let cost = 0;
  let priced = 0;
  let alreadyOwnedCost = 0;
  let pricedCurrency: string | null = null;
  const missingIngredients: string[] = [];

  for (const ingredient of recipe.ingredients) {
    const key = normalizeKey(ingredient.food.name);
    const neededQuantity = Math.max(0, Number(ingredient.quantity) * scale);
    const owned = ownedByKey.get(key);
    const ownedQuantity = owned && compatibleUnits(ingredient.unit, owned.unit)
      ? convertQuantity(owned.quantity, owned.unit, ingredient.unit)
      : 0;
    const missingQuantity = Math.max(0, neededQuantity - ownedQuantity);
    const price = prices.get(key);

    if (missingQuantity > 0) missingIngredients.push(ingredient.food.name);
    if (!price || !price.unit || !compatibleUnits(ingredient.unit, price.unit)) continue;

    priced += 1;
    pricedCurrency ??= price.currency;
    const missingInPriceUnit = convertQuantity(missingQuantity, ingredient.unit, price.unit);
    const ownedInPriceUnit = convertQuantity(Math.min(ownedQuantity, neededQuantity), ingredient.unit, price.unit);
    cost += missingInPriceUnit * Number(price.unitPrice);
    alreadyOwnedCost += ownedInPriceUnit * Number(price.unitPrice);
  }

  return {
    estimatedCost: priced > 0 ? cost : null,
    alreadyOwnedCost: priced > 0 ? round(alreadyOwnedCost, 2) : null,
    priceCoverage: priced / Math.max(1, recipe.ingredients.length),
    inventoryCoverage: recipe.ingredients.length
      ? recipe.ingredients.filter((ingredient) => {
          const needed = Math.max(0, Number(ingredient.quantity) * scale);
          const owned = ownedByKey.get(normalizeKey(ingredient.food.name));
          if (!owned || !compatibleUnits(ingredient.unit, owned.unit)) return false;
          return convertQuantity(owned.quantity, owned.unit, ingredient.unit) >= needed;
        }).length / recipe.ingredients.length
      : 0,
    costCurrency: pricedCurrency,
    missingIngredients,
  };
}

function buildShoppingSummary(
  meals: WeeklyBudgetMeal[],
  recipes: Array<{ id: string; servings: number; ingredients: RecipeIngredientLike[] }>,
  familySize: number,
) {
  const recipeById = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  const totals = new Map<string, { name: string; quantity: number; unit: string; recipeCount: number }>();
  const selectedRecipeUses = new Map<string, number>();

  for (const meal of meals) {
    const recipe = recipeById.get(meal.recipeId);
    if (!recipe) continue;
    selectedRecipeUses.set(meal.recipeId, (selectedRecipeUses.get(meal.recipeId) ?? 0) + 1);
  }

  for (const meal of meals) {
    const recipe = recipeById.get(meal.recipeId);
    if (!recipe) continue;
    const scale = familySize / Math.max(recipe.servings, 1);
    for (const ingredient of recipe.ingredients) {
      const key = `${normalizeKey(ingredient.food.name)}|${normalizeUnit(ingredient.unit)}`;
      const needed = Math.max(0, Number(ingredient.quantity) * scale);
      const current = totals.get(key) ?? {
        name: ingredient.food.name,
        quantity: 0,
        unit: ingredient.unit,
        recipeCount: 0,
      };
      current.quantity += needed;
      current.recipeCount += 1;
      totals.set(key, current);
    }
  }

  return [...totals.values()]
    .map((item) => ({ ...item, quantity: round(item.quantity, 2) }))
    .sort((a, b) => b.recipeCount - a.recipeCount || a.name.localeCompare(b.name));
}

function ingredientReuseScore(ingredients: RecipeIngredientLike[], previous: Candidate[]): number {
  if (!previous.length || !ingredients.length) return 0;
  const current = new Set(ingredients.map((ingredient) => normalizeKey(ingredient.food.name)).filter(Boolean));
  const previousKeys = new Set<string>();
  for (const candidate of previous) {
    for (const ingredient of candidate.recipe.ingredients) previousKeys.add(normalizeKey(ingredient.food.name));
  }
  if (!previousKeys.size) return 0;
  let hits = 0;
  for (const key of current) if (previousKeys.has(key)) hits += 1;
  return clamp01(hits / Math.max(1, Math.min(current.size, previousKeys.size)));
}

function mealTypesFor(mealsPerDay: number): Array<'breakfast' | 'lunch' | 'dinner'> {
  return (['breakfast', 'lunch', 'dinner'] as const).slice(0, mealsPerDay);
}

function nutritionFit(calories: number, protein: number) {
  const calorieScore = clamp01(1 - Math.abs(calories - 550) / 550);
  const proteinScore = clamp01(protein / 30);
  return calorieScore * 0.55 + proteinScore * 0.45;
}

function familyKey(name: string): string {
  return normalizeKey(name).split('-').slice(0, 3).join('-');
}

function normalizeKey(value: string): string {
  return String(value || '')
    .trim()
    .toLocaleLowerCase('fa-IR')
    .replace(/[\u200c\s]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .slice(0, 180);
}

function normalizeUnit(value?: string | null): string {
  return String(value || '').trim().toLowerCase();
}

function normalizeCurrency(value?: string | null): string | null {
  const currency = String(value || '').trim().toUpperCase();
  return currency || null;
}

function compatibleUnits(left?: string | null, right?: string | null): boolean {
  const a = normalizeUnit(left);
  const b = normalizeUnit(right);
  if (!a || !b) return false;
  return unitFamily(a) === unitFamily(b);
}

function unitFamily(unit: string): 'mass' | 'volume' | 'count' | 'other' {
  if (['mg', 'g', 'kg', 'oz', 'lb'].includes(unit)) return 'mass';
  if (['ml', 'l', 'cup', 'tbsp', 'tsp'].includes(unit)) return 'volume';
  if (['piece', 'pieces', 'pcs', 'count', 'unit'].includes(unit)) return 'count';
  return 'other';
}

function convertQuantity(quantity: number, from?: string | null, to?: string | null): number {
  const source = normalizeUnit(from);
  const target = normalizeUnit(to);
  if (source === target) return quantity;
  if (unitFamily(source) !== unitFamily(target)) return 0;

  const massToGram: Record<string, number> = { mg: 0.001, g: 1, kg: 1000, oz: 28.349523125, lb: 453.59237 };
  const volumeToMl: Record<string, number> = { ml: 1, l: 1000, cup: 240, tbsp: 15, tsp: 5 };

  if (unitFamily(source) === 'mass') return (quantity * massToGram[source]) / massToGram[target];
  if (unitFamily(source) === 'volume') return (quantity * volumeToMl[source]) / volumeToMl[target];
  return quantity;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function clampInteger(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.floor(value)));
}

function round(value: number, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
