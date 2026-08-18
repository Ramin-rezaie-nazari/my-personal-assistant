import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { RecipeServingScalingService } from '../../nutrition/recipe-intelligence/recipe-serving-scaling.service';
import { ShoppingService } from '../../shopping/shopping.service';
import { GlobalCountryFoodService } from './global-country-food.service';
import { GlobalCountryFinanceService } from '../../budget-intelligence/services/global-country-finance.service';

export type FoodOperatingPlan = {
  recipe: {
    id: string;
    name: string;
    baseServings: number;
    targetServings: number;
    scaleFactor: number;
  };
  scaledRecipe: unknown;
  inventory: {
    coveragePercent: number;
    available: Array<{ foodId: string; name: string; quantity: number; unit: string }>;
    missing: Array<{ foodId: string; name: string; quantity: number; unit: string }>;
  };
  shopping: {
    readyToAdd: Array<{ foodId: string; name: string; quantity: number; unit: string }>;
    source: 'recipe';
  };
  localContext: ReturnType<GlobalCountryFoodService['getLocalRecipeGuidance']>;
  financeContext: ReturnType<GlobalCountryFinanceService['getFinanceContext']>;
};

@Injectable()
export class FoodOperatingLoopService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scaling: RecipeServingScalingService,
    private readonly shopping: ShoppingService,
    private readonly countryFood: GlobalCountryFoodService,
    private readonly countryFinance: GlobalCountryFinanceService,
  ) {}

  async buildPlan(
    userId: string,
    recipeId: string,
    targetServings: number,
    countryCode = '',
  ): Promise<FoodOperatingPlan> {
    this.validateServings(targetServings);

    const recipe = await this.prisma.recipe.findFirst({
      where: { id: recipeId, OR: [{ userId: null }, { userId }] },
      include: { ingredients: { include: { food: true } } },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');

    const scaledRecipe = this.buildScaledRecipe(recipe, targetServings);
    const inventory = await this.prisma.inventoryItem.findMany({
      where: { userId },
      include: { food: true },
    });
    const inventoryByFood = new Map(inventory.map((item) => [item.foodId, item]));
    const available: FoodOperatingPlan['inventory']['available'] = [];
    const missing: FoodOperatingPlan['inventory']['missing'] = [];

    for (const ingredient of scaledRecipe.ingredients) {
      const stored = inventoryByFood.get(ingredient.ingredientId);
      const quantity = stored?.quantity ?? 0;
      const food = recipe.ingredients.find((item) => item.foodId === ingredient.ingredientId)?.food;
      const name = food?.name ?? ingredient.ingredientId;
      if (quantity >= ingredient.scaledQuantity) {
        available.push({
          foodId: ingredient.ingredientId,
          name,
          quantity: ingredient.scaledQuantity,
          unit: ingredient.unit,
        });
      } else {
        missing.push({
          foodId: ingredient.ingredientId,
          name,
          quantity: Math.max(0, ingredient.scaledQuantity - quantity),
          unit: ingredient.unit,
        });
      }
    }

    const total = scaledRecipe.ingredients.length;
    const coveragePercent = total === 0 ? 0 : Math.round(((total - missing.length) / total) * 100);
    const localContext = this.countryFood.getLocalRecipeGuidance(countryCode);
    const financeContext = this.countryFinance.getFinanceContext(countryCode);

    return {
      recipe: {
        id: recipe.id,
        name: recipe.name,
        baseServings: recipe.servings,
        targetServings,
        scaleFactor: targetServings / recipe.servings,
      },
      scaledRecipe,
      inventory: { coveragePercent, available, missing },
      shopping: { readyToAdd: missing, source: 'recipe' },
      localContext,
      financeContext,
    };
  }

  async recommend(
    userId: string,
    targetServings: number,
    countryCode = '',
    maxCalories?: number,
    minProteinGrams?: number,
  ) {
    this.validateServings(targetServings);

    const [recipes, inventory, nutritionProfile] = await Promise.all([
      this.prisma.recipe.findMany({
        where: { OR: [{ userId: null }, { userId }] },
        include: { ingredients: { include: { food: true } } },
      }),
      this.prisma.inventoryItem.findMany({
        where: { userId },
      }),
      this.prisma.nutritionProfile.findUnique({
        where: { userId },
        select: { dailyCaloriesGoal: true, proteinGoalGrams: true },
      }),
    ]);

    const inventoryByFood = new Map(inventory.map((item) => [item.foodId, item.quantity]));
    const calorieLimit = maxCalories ?? (nutritionProfile?.dailyCaloriesGoal ? Math.round(nutritionProfile.dailyCaloriesGoal * 0.45) : undefined);
    const proteinFloor = minProteinGrams ?? (nutritionProfile?.proteinGoalGrams ? nutritionProfile.proteinGoalGrams * 0.30 : undefined);
    const ranked = this.countryFood.rankRecipesForCountry(countryCode, recipes as Array<{ name: string; cuisineFamily?: string | null }>);
    const rankIndex = new Map(ranked.map((recipe, index) => [recipe.name, index]));

    return recipes
      .map((recipe) => {
        const scaled = this.buildScaledRecipe(recipe, targetServings);
        const missing = scaled.ingredients.filter((ingredient) => (inventoryByFood.get(ingredient.ingredientId) ?? 0) < ingredient.scaledQuantity);
        const coveragePercent = scaled.ingredients.length === 0
          ? 0
          : Math.round(((scaled.ingredients.length - missing.length) / scaled.ingredients.length) * 100);
        const calories = scaled.nutritionForFullBatch.calories / targetServings;
        const protein = scaled.nutritionPerServing.proteinGrams;
        const nutritionScore = (calorieLimit && calories <= calorieLimit ? 15 : 0) + (proteinFloor && protein >= proteinFloor ? 15 : 0);
        const score = Math.min(100, coveragePercent + nutritionScore + Math.max(0, 20 - (rankIndex.get(recipe.name) ?? recipes.length)));
        return {
          recipeId: recipe.id,
          name: recipe.name,
          score,
          coveragePercent,
          missingCount: missing.length,
          caloriesPerServing: Number(calories.toFixed(1)),
          proteinPerServing: Number(protein.toFixed(1)),
          targetServings,
          missingIngredients: missing,
        };
      })
      .filter((recipe) => (calorieLimit === undefined || recipe.caloriesPerServing <= calorieLimit) && (proteinFloor === undefined || recipe.proteinPerServing >= proteinFloor))
      .sort((a, b) => b.score - a.score || b.coveragePercent - a.coveragePercent || a.name.localeCompare(b.name))
      .slice(0, 10);
  }

  async addMissingToShopping(userId: string, recipeId: string, targetServings: number) {
    const plan = await this.buildPlan(userId, recipeId, targetServings);
    const result = await this.shopping.addRecipeMissing(userId, recipeId, plan.inventory.missing);
    return { plan, shopping: result };
  }

  private validateServings(targetServings: number) {
    if (!Number.isInteger(targetServings) || targetServings <= 0 || targetServings > 10000)
      throw new NotFoundException('targetServings must be an integer between 1 and 10000');
  }

  private buildScaledRecipe(recipe: {
    id: string;
    name: string;
    servings: number;
    verified: boolean;
    userId: string | null;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    ingredients: Array<{ foodId: string; quantity: number; unit: string; food?: { name: string } | null }>;
  }, targetServings: number) {
    return this.scaling.scale(
      {
        id: recipe.id,
        canonicalName: recipe.name,
        localizedNames: {},
        countryCodes: [],
        regionIds: [],
        cuisineIds: [],
        mealTypes: [],
        dietaryTags: [],
        ingredients: recipe.ingredients.map((ingredient) => ({
          ingredientId: ingredient.foodId,
          role: 'other',
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          measurementKind: inferMeasurementKind(ingredient.unit),
          scalingPolicy: 'linear',
        })),
        nutritionPerServing: {
          calories: recipe.calories / recipe.servings,
          proteinGrams: recipe.protein / recipe.servings,
          carbohydratesGrams: recipe.carbs / recipe.servings,
          fatGrams: recipe.fat / recipe.servings,
        },
        servings: recipe.servings,
        prepMinutes: 0,
        cookMinutes: 0,
        difficulty: 'medium',
        status: recipe.verified ? 'verified' : 'draft',
        sourceType: recipe.userId ? 'user' : 'internal',
        version: 1,
      },
      { targetServings, kitchenFriendlyRounding: true },
    );
  }
}

function inferMeasurementKind(unit: string): 'mass' | 'volume' | 'count' | 'package' | 'unitless' {
  const normalized = unit.trim().toLowerCase();
  if (['g', 'kg', 'mg', 'oz', 'lb', 'gr', 'کیلو', 'گرم'].includes(normalized)) return 'mass';
  if (['ml', 'l', 'tsp', 'tbsp', 'cup', 'cups', 'ml.'].includes(normalized)) return 'volume';
  if (['piece', 'pieces', 'pcs', 'count', 'عدد'].includes(normalized)) return 'count';
  if (['package', 'pack', 'box', 'بسته'].includes(normalized)) return 'package';
  return 'unitless';
}
