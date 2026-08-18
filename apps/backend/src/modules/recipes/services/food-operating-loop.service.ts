import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { RecipeServingScalingService } from '../../nutrition/recipe-intelligence/recipe-serving-scaling.service';
import { RecipeInventoryMatcherService } from './recipe-inventory-matcher.service';
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
    private readonly matcher: RecipeInventoryMatcherService,
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
    if (!Number.isInteger(targetServings) || targetServings <= 0 || targetServings > 10000)
      throw new NotFoundException('targetServings must be an integer between 1 and 10000');

    const recipe = await this.prisma.recipe.findFirst({
      where: { id: recipeId, OR: [{ userId: null }, { userId }] },
      include: { ingredients: { include: { food: true } } },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');

    const match = (await this.matcher.match(userId)).find((item) => item.recipeId === recipeId);
    if (!match) throw new NotFoundException('Recipe inventory match not found');

    const scaledRecipe = await this.loadScaledRecipe(userId, recipe.id, targetServings);
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
      inventory: {
        coveragePercent: match.coveragePercent,
        available: match.available,
        missing: match.missing,
      },
      shopping: {
        readyToAdd: match.missing,
        source: 'recipe',
      },
      localContext,
      financeContext,
    };
  }

  async addMissingToShopping(
    userId: string,
    recipeId: string,
    targetServings: number,
  ) {
    const plan = await this.buildPlan(userId, recipeId, targetServings);
    const result = await this.shopping.addRecipeMissing(
      userId,
      recipeId,
      plan.inventory.missing,
    );
    return { plan, shopping: result };
  }

  private async loadScaledRecipe(userId: string, recipeId: string, targetServings: number) {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id: recipeId, OR: [{ userId: null }, { userId }] },
      include: { ingredients: true },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');

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
          scalingPolicy: (ingredient.scalingPolicy ?? 'linear') as 'linear' | 'sublinear' | 'fixed' | 'per_batch' | 'manual_review',
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
