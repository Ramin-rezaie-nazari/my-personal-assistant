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
};

type ExtendedBudgetPlanRequest = CreateBudgetPlanDto & {
  weeklyBudget?: number;
  days?: number;
  mealsPerDay?: number;
  currency?: string;
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
    const perDayBudget = weeklyBudget / days;

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
    const priceByKey = new Map<string, { unitPrice: number; currency: string; observedAt: Date }>();
    for (const row of latestPrices as Array<{ productKey: string; unitPrice: number | null; currency: string; observedAt: Date }>) {
      if (!row.unitPrice || !Number.isFinite(Number(row.unitPrice)) || Number(row.unitPrice) <= 0) continue;
      const existing = priceByKey.get(row.productKey);
      if (!existing || new Date(row.observedAt).getTime() > existing.observedAt.getTime()) {
        priceByKey.set(row.productKey, {
          unitPrice: Number(row.unitPrice),
          currency: row.currency,
          observedAt: new Date(row.observedAt),
        });
      }
    }

    const ownedByKey = new Map<string, number>();
    for (const item of inventory) {
      ownedByKey.set(normalizeKey(item.food.name), Number(item.quantity));
    }

    const ranked = recipes
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
    const usedFamilies = new Map<string, number>();
    let plannedCost = 0;

    for (let day = 1; day <= days; day += 1) {
      const dailyCandidates = [...ranked].sort((a, b) => {
        const familyPenaltyA = (usedFamilies.get(familyKey(a.recipe.name)) ?? 0) * 0.12;
        const familyPenaltyB = (usedFamilies.get(familyKey(b.recipe.name)) ?? 0) * 0.12;
        return (b.score / 100 - familyPenaltyB) - (a.score / 100 - familyPenaltyA);
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
        usedFamilies.set(family, (usedFamilies.get(family) ?? 0) + 1);
        if (chosen.ingredientAnalysis.estimatedCost !== null) plannedCost += chosen.ingredientAnalysis.estimatedCost;

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
        });
      }
    }

    const estimatedMealsWithPrice = selected.filter((item) => item.estimatedCost !== null).length;
    const averagePriceCoverage = selected.length
      ? selected.reduce((sum, item) => sum + item.priceCoverage, 0) / selected.length
      : 0;

    return {
      status: 'complete',
      budget: {
        monthlyBudget: request.monthlyBudget,
        weeklyBudget,
        perDayBudget,
        currency: extended.currency ?? null,
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
      shopping: buildShoppingSummary(selected),
      meta: {
        candidateRecipes: recipes.length,
        plannedMeals: selected.length,
        averagePriceCoverage: round(averagePriceCoverage),
        pricesWereAvailable: priceByKey.size > 0,
      },
    };
  }
}

function analyzeRecipeCost(
  recipe: { ingredients: Array<{ quantity: number; unit: string; food: { name: string } }> },
  scale: number,
  ownedByKey: Map<string, number>,
  prices: Map<string, { unitPrice: number; currency: string; observedAt: Date }>,
) {
  let cost = 0;
  let priced = 0;
  let alreadyOwnedCost = 0;
  let pricedCurrency: string | null = null;
  const missingIngredients: string[] = [];

  for (const ingredient of recipe.ingredients) {
    const key = normalizeKey(ingredient.food.name);
    const neededQuantity = Math.max(0, Number(ingredient.quantity) * scale);
    const ownedQuantity = ownedByKey.get(key) ?? 0;
    const missingQuantity = Math.max(0, neededQuantity - ownedQuantity);
    const price = prices.get(key);

    if (missingQuantity > 0) missingIngredients.push(ingredient.food.name);
    if (!price) continue;

    priced += 1;
    pricedCurrency ??= price.currency;
    cost += missingQuantity * price.unitPrice;
    alreadyOwnedCost += Math.min(ownedQuantity, neededQuantity) * price.unitPrice;
  }

  return {
    estimatedCost: priced > 0 ? cost : null,
    alreadyOwnedCost: priced > 0 ? round(alreadyOwnedCost, 2) : null,
    priceCoverage: priced / Math.max(1, recipe.ingredients.length),
    inventoryCoverage: recipe.ingredients.length
      ? recipe.ingredients.filter((ingredient) => {
          const needed = Math.max(0, Number(ingredient.quantity) * scale);
          return (ownedByKey.get(normalizeKey(ingredient.food.name)) ?? 0) >= needed;
        }).length / recipe.ingredients.length
      : 0,
    costCurrency: pricedCurrency,
    missingIngredients,
  };
}

function buildShoppingSummary(meals: WeeklyBudgetMeal[]) {
  const counts = new Map<string, number>();
  for (const meal of meals) {
    for (const ingredient of meal.missingIngredients) {
      counts.set(ingredient, (counts.get(ingredient) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([name, recipeCount]) => ({ name, recipeCount }))
    .sort((a, b) => b.recipeCount - a.recipeCount || a.name.localeCompare(b.name));
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
