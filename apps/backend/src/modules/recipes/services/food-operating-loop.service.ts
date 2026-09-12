import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { RecipeServingScalingService } from '../../nutrition/recipe-intelligence/recipe-serving-scaling.service';
import { ShoppingService } from '../../shopping/shopping.service';
import { BudgetIntelligenceService, deriveBudgetNextActions, deriveBudgetStatus } from '../../budget-intelligence/services/budget-intelligence.service';
import { GlobalCountryFoodService } from './global-country-food.service';
import { GlobalCountryFinanceService } from '../../budget-intelligence/services/global-country-finance.service';
import { FoodSafetyTaxonomyService } from '../../foods/services/food-safety-taxonomy.service';

type MealSafetyConstraints = { allergies?: string[]; dietaryPreferences?: string[] };

type ComparableUnitKind = 'mass' | 'volume' | 'count';
type NormalizedUnit = { kind: ComparableUnitKind; value: number } | null;
type InventoryRecord = { foodId: string; quantity: number; unit: string; food?: { name: string } | null };
type RecipeIngredientPersisted = { foodId: string; quantity: number; unit: string; measurementKind: string; scalingPolicy: string; scalingExponent: number | null; batchSize: number | null; maxLinearMultiplier: number | null; food?: { name: string } | null };

export type FoodOperatingPlan = {
  recipe: { id: string; name: string; baseServings: number; targetServings: number; scaleFactor: number };
  scaledRecipe: unknown;
  inventory: { coveragePercent: number; available: Array<{ foodId: string; name: string; quantity: number; unit: string }>; missing: Array<{ foodId: string; name: string; quantity: number; unit: string }> };
  shopping: { readyToAdd: Array<{ foodId: string; name: string; quantity: number; unit: string }>; source: 'recipe' };
  localContext: ReturnType<GlobalCountryFoodService['getLocalRecipeGuidance']>;
  financeContext: ReturnType<GlobalCountryFinanceService['getFinanceContext']>;
};

@Injectable()
export class FoodOperatingLoopService {
  constructor(private readonly prisma: PrismaService, private readonly scaling: RecipeServingScalingService, private readonly shopping: ShoppingService, private readonly budget: BudgetIntelligenceService, private readonly countryFood: GlobalCountryFoodService, private readonly countryFinance: GlobalCountryFinanceService, private readonly safetyTaxonomy: FoodSafetyTaxonomyService) {}

  async buildPlan(userId: string, recipeId: string, targetServings: number, countryCode = ''): Promise<FoodOperatingPlan> {
    this.validateServings(targetServings);
    const recipe = await this.prisma.recipe.findFirst({ where: { id: recipeId, OR: [{ userId: null }, { userId }] }, include: { ingredients: { include: { food: true } } } });
    if (!recipe) throw new NotFoundException('Recipe not found');
    const scaledRecipe = this.buildScaledRecipe(recipe, targetServings);
    const inventory = await this.prisma.inventoryItem.findMany({ where: { userId }, include: { food: true } });
    const inventoryByFood = new Map(inventory.map((item) => [item.foodId, item as InventoryRecord]));
    const { available, missing } = this.matchScaledIngredients(recipe.ingredients, scaledRecipe.ingredients, inventoryByFood);
    const total = scaledRecipe.ingredients.length;
    const coveragePercent = total === 0 ? 0 : Math.round(((total - missing.length) / total) * 100);
    return { recipe: { id: recipe.id, name: recipe.name, baseServings: recipe.servings, targetServings, scaleFactor: targetServings / recipe.servings }, scaledRecipe, inventory: { coveragePercent, available, missing }, shopping: { readyToAdd: missing, source: 'recipe' }, localContext: this.countryFood.getLocalRecipeGuidance(countryCode), financeContext: this.countryFinance.getFinanceContext(countryCode) };
  }

  async buildBudgetPlan(userId: string, recipeId: string, targetServings: number, budget: number, currency: string, countryCode = '') {
    if (!Number.isFinite(budget) || budget < 0) throw new BadRequestException('budget must be a non-negative number');
    const plan = await this.buildPlan(userId, recipeId, targetServings, countryCode);
    const quote = await this.budget.quoteItems(plan.inventory.missing.map((item) => ({ ...item, urgency: 'soon' as const })), currency, budget);
    return { ...plan, budget: { budget, currency: currency.trim().toUpperCase(), totalEstimatedCost: quote.totalEstimatedCost, budgetRemaining: quote.budgetRemaining, items: quote.items, status: plan.inventory.missing.length ? deriveBudgetStatus(quote.items) : 'no_missing_ingredients', nextActions: deriveBudgetNextActions(quote.items), generatedDeterministically: true } } as const;
  }

  async addBudgetQualifiedMissingToShopping(userId: string, recipeId: string, targetServings: number, budget: number, currency: string) {
    const plan = await this.buildBudgetPlan(userId, recipeId, targetServings, budget, currency);
    const eligible = plan.budget.items.filter((item) => item.status === 'priced').map((item) => ({ foodId: item.foodId, quantity: item.recommendedQuantity, unit: item.unit }));
    const shopping = await this.shopping.addRecipeMissing(userId, recipeId, eligible);
    return { plan, shopping };
  }

  async recommend(userId: string, targetServings: number, countryCode = '', maxCalories?: number, minProteinGrams?: number, safetyConstraints: MealSafetyConstraints = {}) {
    this.validateServings(targetServings);
    const [recipes, inventory, nutritionProfile] = await Promise.all([
      this.prisma.recipe.findMany({ where: { OR: [{ userId: null }, { userId }] }, include: { ingredients: { include: { food: true } } } }),
      this.prisma.inventoryItem.findMany({ where: { userId } }),
      this.prisma.nutritionProfile.findUnique({ where: { userId }, select: { dailyCaloriesGoal: true, proteinGoalGrams: true } }),
    ]);
    const inventoryByFood = new Map(inventory.map((item) => [item.foodId, item as InventoryRecord]));
    const calorieLimit = maxCalories ?? (nutritionProfile?.dailyCaloriesGoal ? Math.round(nutritionProfile.dailyCaloriesGoal * 0.45) : undefined);
    const proteinFloor = minProteinGrams ?? (nutritionProfile?.proteinGoalGrams ? nutritionProfile.proteinGoalGrams * 0.30 : undefined);
    const ranked = this.countryFood.rankRecipesForCountry(countryCode, recipes as Array<{ name: string; cuisineFamily?: string | null }>);
    const rankIndex = new Map(ranked.map((recipe, index) => [recipe.name, index]));
    return recipes.map((recipe) => {
      const scaled = this.buildScaledRecipe(recipe, targetServings);
      const safety = this.safetyTaxonomy.evaluate(recipe.ingredients.map((ingredient) => ingredient.food?.name ?? ''), safetyConstraints);
      if (!safety.allowed) return null;
      const { missing } = this.matchScaledIngredients(recipe.ingredients, scaled.ingredients, inventoryByFood);
      const coveragePercent = scaled.ingredients.length === 0 ? 0 : Math.round(((scaled.ingredients.length - missing.length) / scaled.ingredients.length) * 100);
      const calories = scaled.nutritionForFullBatch.calories / targetServings;
      const protein = scaled.nutritionPerServing.proteinGrams;
      const nutritionScore = (calorieLimit && calories <= calorieLimit ? 15 : 0) + (proteinFloor && protein >= proteinFloor ? 15 : 0);
      const score = Math.min(100, coveragePercent + nutritionScore + Math.max(0, 20 - (rankIndex.get(recipe.name) ?? recipes.length)));
      return { recipeId: recipe.id, name: recipe.name, score, coveragePercent, missingCount: missing.length, caloriesPerServing: Number(calories.toFixed(1)), proteinPerServing: Number(protein.toFixed(1)), targetServings, missingIngredients: missing };
    }).filter((recipe): recipe is NonNullable<typeof recipe> => recipe !== null).filter((recipe) => (calorieLimit === undefined || recipe.caloriesPerServing <= calorieLimit) && (proteinFloor === undefined || recipe.proteinPerServing >= proteinFloor)).sort((a, b) => b.score - a.score || b.coveragePercent - a.coveragePercent || a.name.localeCompare(b.name)).slice(0, 10);
  }

  async addMissingToShopping(userId: string, recipeId: string, targetServings: number) {
    const plan = await this.buildPlan(userId, recipeId, targetServings);
    const result = await this.shopping.addRecipeMissing(userId, recipeId, plan.inventory.missing);
    return { plan, shopping: result };
  }

  private matchScaledIngredients(recipeIngredients: RecipeIngredientPersisted[], scaledIngredients: Array<{ ingredientId: string; scaledQuantity: number; unit: string }>, inventoryByFood: Map<string, InventoryRecord>) {
    const available: FoodOperatingPlan['inventory']['available'] = [];
    const missing: FoodOperatingPlan['inventory']['missing'] = [];
    for (const ingredient of scaledIngredients) {
      const stored = inventoryByFood.get(ingredient.ingredientId);
      const required = normalizeUnit(ingredient.scaledQuantity, ingredient.unit);
      const availableNormalized = stored ? normalizeUnit(stored.quantity, stored.unit) : null;
      const food = recipeIngredients.find((item) => item.foodId === ingredient.ingredientId)?.food;
      const name = food?.name ?? stored?.food?.name ?? ingredient.ingredientId;
      const canCompare = required !== null && availableNormalized !== null && required.kind === availableNormalized.kind;
      const enough = canCompare && availableNormalized.value >= required.value;
      if (enough) available.push({ foodId: ingredient.ingredientId, name, quantity: ingredient.scaledQuantity, unit: ingredient.unit });
      else {
        const missingQuantity = canCompare ? denormalizeUnit(Math.max(0, required!.value - availableNormalized!.value), required!.kind, ingredient.unit) : ingredient.scaledQuantity;
        missing.push({ foodId: ingredient.ingredientId, name, quantity: missingQuantity, unit: ingredient.unit });
      }
    }
    return { available, missing };
  }

  private validateServings(targetServings: number) {
    if (!Number.isInteger(targetServings) || targetServings <= 0 || targetServings > 10000)
      throw new BadRequestException('targetServings must be an integer between 1 and 10000');
  }

  private buildScaledRecipe(recipe: { id: string; name: string; servings: number; verified: boolean; userId: string | null; calories: number; protein: number; carbs: number; fat: number; ingredients: RecipeIngredientPersisted[] }, targetServings: number) {
    return this.scaling.scale({ id: recipe.id, canonicalName: recipe.name, localizedNames: {}, countryCodes: [], regionIds: [], cuisineIds: [], mealTypes: [], dietaryTags: [], ingredients: recipe.ingredients.map((ingredient) => ({ ingredientId: ingredient.foodId, role: 'other', quantity: ingredient.quantity, unit: ingredient.unit, measurementKind: ingredient.measurementKind as any, scalingPolicy: ingredient.scalingPolicy as any, scalingExponent: ingredient.scalingExponent ?? undefined, batchSize: ingredient.batchSize ?? undefined, maxLinearMultiplier: ingredient.maxLinearMultiplier ?? undefined })), nutritionPerServing: { calories: recipe.calories / recipe.servings, proteinGrams: recipe.protein / recipe.servings, carbohydratesGrams: recipe.carbs / recipe.servings, fatGrams: recipe.fat / recipe.servings }, servings: recipe.servings, prepMinutes: 0, cookMinutes: 0, difficulty: 'medium', status: recipe.verified ? 'verified' : 'draft', sourceType: recipe.userId ? 'user' : 'internal', version: 1 }, { targetServings, kitchenFriendlyRounding: true });
  }
}

function normalizeUnit(quantity: number, unit: string): NormalizedUnit {
  const normalized = unit.trim().toLowerCase();
  if (['g','gr','gram','grams','گرم'].includes(normalized)) return { kind:'mass', value:quantity };
  if (['kg','kilogram','kilograms','کیلو'].includes(normalized)) return { kind:'mass', value:quantity*1000 };
  if (['mg','milligram','milligrams'].includes(normalized)) return { kind:'mass', value:quantity/1000 };
  if (['oz','ounce','ounces'].includes(normalized)) return { kind:'mass', value:quantity*28.349523125 };
  if (['lb','lbs','pound','pounds'].includes(normalized)) return { kind:'mass', value:quantity*453.59237 };
  if (['ml','milliliter','milliliters'].includes(normalized)) return { kind:'volume', value:quantity };
  if (['l','liter','liters'].includes(normalized)) return { kind:'volume', value:quantity*1000 };
  if (['piece','pieces','pcs','count','عدد'].includes(normalized)) return { kind:'count', value:quantity };
  return null;
}

function denormalizeUnit(value: number, kind: ComparableUnitKind, unit: string): number {
  const normalized = unit.trim().toLowerCase();
  if (kind === 'mass') {
    if (['kg','kilogram','kilograms','کیلو'].includes(normalized)) return Number((value/1000).toFixed(3));
    if (['mg','milligram','milligrams'].includes(normalized)) return Number((value*1000).toFixed(2));
    if (['oz','ounce','ounces'].includes(normalized)) return Number((value/28.349523125).toFixed(3));
    if (['lb','lbs','pound','pounds'].includes(normalized)) return Number((value/453.59237).toFixed(3));
  }
  if (kind === 'volume' && ['l','liter','liters'].includes(normalized)) return Number((value/1000).toFixed(3));
  return Number(value.toFixed(3));
}
