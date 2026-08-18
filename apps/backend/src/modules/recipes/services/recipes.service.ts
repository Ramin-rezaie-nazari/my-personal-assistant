import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { RecipeContract } from '../../nutrition/recipe-intelligence/recipe-domain.types';
import { RecipeServingScalingService } from '../../nutrition/recipe-intelligence/recipe-serving-scaling.service';

export type RecipeScalingPolicy = 'linear' | 'sublinear' | 'fixed' | 'per_batch' | 'manual_review';
export type RecipeMeasurementKind = 'mass' | 'volume' | 'count' | 'package' | 'unitless';
export type RecipeIngredientInput = {
  foodId: string;
  quantity: number;
  unit?: string;
  measurementKind?: RecipeMeasurementKind;
  scalingPolicy?: RecipeScalingPolicy;
  scalingExponent?: number;
  batchSize?: number;
  maxLinearMultiplier?: number;
};
export type RecipeInput = {
  name: string;
  description?: string;
  imageUrl?: string;
  imageSource?: string;
  servings?: number;
  ingredients: RecipeIngredientInput[];
};

@Injectable()
export class RecipesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recipeScaling: RecipeServingScalingService,
  ) {}

  async createRecipe(userId: string, data: RecipeInput) {
    this.validateInput(data);
    const foodIds = [...new Set(data.ingredients.map((item) => item.foodId))];
    return this.prisma.$transaction(async (tx) => {
      const foods = await tx.foodItem.findMany({ where: { id: { in: foodIds }, OR: [{ userId: null }, { userId }] } });
      if (foods.length !== foodIds.length) throw new NotFoundException('One or more food items were not found');
      const byId = new Map(foods.map((food) => [food.id, food]));
      const ingredients = data.ingredients.map((item) => {
        const food = byId.get(item.foodId)!;
        return {
          foodId: food.id,
          quantity: item.quantity,
          unit: item.unit?.trim() || 'g',
          measurementKind: item.measurementKind ?? inferMeasurementKind(item.unit ?? 'g'),
          scalingPolicy: item.scalingPolicy ?? inferScalingPolicy(food.name, item.unit ?? 'g'),
          scalingExponent: item.scalingExponent ?? null,
          batchSize: item.batchSize ?? null,
          maxLinearMultiplier: item.maxLinearMultiplier ?? null,
          calories: Math.round(food.calories * item.quantity),
          protein: food.protein * item.quantity,
          carbs: food.carbs * item.quantity,
          fat: food.fat * item.quantity,
        };
      });
      const totals = ingredients.reduce((sum, item) => ({ calories: sum.calories + item.calories, protein: sum.protein + item.protein, carbs: sum.carbs + item.carbs, fat: sum.fat + item.fat }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
      return tx.recipe.create({
        data: {
          userId,
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
          imageUrl: data.imageUrl?.trim() || undefined,
          imageSource: data.imageSource?.trim() || undefined,
          servings: data.servings ?? 2,
          ...totals,
          ingredients: { create: ingredients },
        },
        include: { ingredients: { include: { food: true } } },
      });
    });
  }

  async getRecipes(userId: string) {
    return this.prisma.recipe.findMany({ where: { OR: [{ userId: null }, { userId }] }, include: { ingredients: { include: { food: true } } }, orderBy: [{ verified: 'desc' }, { name: 'asc' }] });
  }

  async getRecipe(userId: string, id: string) {
    const recipe = await this.prisma.recipe.findFirst({ where: { id, OR: [{ userId: null }, { userId }] }, include: { ingredients: { include: { food: true } } } });
    if (!recipe) throw new NotFoundException('Recipe not found');
    return recipe;
  }

  async getScaledRecipe(userId: string, id: string, targetServings: number) {
    this.validateServings(targetServings);
    const recipe = await this.getRecipe(userId, id);
    const baseServings = recipe.servings;
    const contract: RecipeContract = {
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
        measurementKind: ingredient.measurementKind as RecipeMeasurementKind,
        scalingPolicy: ingredient.scalingPolicy as RecipeScalingPolicy,
        scalingExponent: ingredient.scalingExponent ?? undefined,
        batchSize: ingredient.batchSize ?? undefined,
        maxLinearMultiplier: ingredient.maxLinearMultiplier ?? undefined,
      })),
      nutritionPerServing: {
        calories: recipe.calories / baseServings,
        proteinGrams: recipe.protein / baseServings,
        carbohydratesGrams: recipe.carbs / baseServings,
        fatGrams: recipe.fat / baseServings,
      },
      servings: baseServings,
      prepMinutes: 0,
      cookMinutes: 0,
      difficulty: 'medium',
      status: recipe.verified ? 'verified' : 'draft',
      sourceType: recipe.userId ? 'user' : 'internal',
      version: 1,
    };
    return { recipe: { id: recipe.id, name: recipe.name, baseServings }, ...this.recipeScaling.scale(contract, { targetServings, kitchenFriendlyRounding: true }) };
  }

  async updateRecipe(userId: string, id: string, data: Partial<RecipeInput>) {
    const existing = await this.prisma.recipe.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Recipe not found');
    if (data.name !== undefined && !data.name.trim()) throw new BadRequestException('name must not be empty');
    if (data.servings !== undefined) this.validateServings(data.servings);
    if (data.ingredients !== undefined) this.validateInput({ name: data.name ?? existing.name, servings: data.servings ?? existing.servings, ingredients: data.ingredients });
    return this.prisma.$transaction(async (tx) => {
      if (data.ingredients !== undefined) {
        const foodIds = [...new Set(data.ingredients.map((item) => item.foodId))];
        const foods = await tx.foodItem.findMany({ where: { id: { in: foodIds }, OR: [{ userId: null }, { userId }] } });
        if (foods.length !== foodIds.length) throw new NotFoundException('One or more food items were not found');
        const byId = new Map(foods.map((food) => [food.id, food]));
        const ingredients = data.ingredients.map((item) => {
          const food = byId.get(item.foodId)!;
          return {
            foodId: food.id,
            quantity: item.quantity,
            unit: item.unit?.trim() || 'g',
            measurementKind: item.measurementKind ?? inferMeasurementKind(item.unit ?? 'g'),
            scalingPolicy: item.scalingPolicy ?? inferScalingPolicy(food.name, item.unit ?? 'g'),
            scalingExponent: item.scalingExponent ?? null,
            batchSize: item.batchSize ?? null,
            maxLinearMultiplier: item.maxLinearMultiplier ?? null,
            calories: Math.round(food.calories * item.quantity),
            protein: food.protein * item.quantity,
            carbs: food.carbs * item.quantity,
            fat: food.fat * item.quantity,
          };
        });
        const totals = ingredients.reduce((sum, item) => ({ calories: sum.calories + item.calories, protein: sum.protein + item.protein, carbs: sum.carbs + item.carbs, fat: sum.fat + item.fat }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
        await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
        return tx.recipe.update({ where: { id }, data: { name: data.name?.trim(), description: data.description?.trim() || undefined, imageUrl: data.imageUrl?.trim() || undefined, imageSource: data.imageSource?.trim() || undefined, servings: data.servings ?? existing.servings, ...totals, ingredients: { create: ingredients } }, include: { ingredients: { include: { food: true } } } });
      }
      return tx.recipe.update({ where: { id }, data: { name: data.name?.trim(), description: data.description?.trim() || undefined, imageUrl: data.imageUrl?.trim() || undefined, imageSource: data.imageSource?.trim() || undefined, servings: data.servings ?? existing.servings }, include: { ingredients: { include: { food: true } } } });
    });
  }

  async deleteRecipe(userId: string, id: string) {
    const result = await this.prisma.recipe.deleteMany({ where: { id, userId } });
    if (!result.count) throw new NotFoundException('Recipe not found');
    return { deleted: true };
  }

  private validateInput(data: RecipeInput) {
    if (!data.name?.trim()) throw new BadRequestException('name must not be empty');
    if (!Array.isArray(data.ingredients) || data.ingredients.length === 0) throw new BadRequestException('A recipe must contain at least one ingredient');
    if (data.servings !== undefined) this.validateServings(data.servings);
    for (const ingredient of data.ingredients) {
      if (!ingredient.foodId?.trim()) throw new BadRequestException('foodId must not be empty');
      if (!Number.isFinite(ingredient.quantity) || ingredient.quantity <= 0) throw new BadRequestException('ingredient quantity must be a positive finite number');
      if (ingredient.scalingExponent !== undefined && ingredient.scalingExponent <= 0) throw new BadRequestException('scalingExponent must be positive');
      if (ingredient.batchSize !== undefined && ingredient.batchSize <= 0) throw new BadRequestException('batchSize must be positive');
      if (ingredient.maxLinearMultiplier !== undefined && ingredient.maxLinearMultiplier <= 0) throw new BadRequestException('maxLinearMultiplier must be positive');
    }
  }

  private validateServings(value: number) {
    if (!Number.isInteger(value) || value <= 0 || value > 10000) throw new BadRequestException('servings must be an integer between 1 and 10000');
  }
}

function inferMeasurementKind(unit: string): RecipeMeasurementKind {
  const normalized = unit.trim().toLowerCase();
  if (['g', 'kg', 'mg', 'oz', 'lb', 'gr', 'کیلو', 'گرم'].includes(normalized)) return 'mass';
  if (['ml', 'l', 'tsp', 'tbsp', 'cup', 'cups', 'ml.'].includes(normalized)) return 'volume';
  if (['piece', 'pieces', 'pcs', 'count', 'عدد'].includes(normalized)) return 'count';
  if (['package', 'pack', 'box', 'بسته'].includes(normalized)) return 'package';
  return 'unitless';
}

function inferScalingPolicy(foodName: string, unit: string): RecipeScalingPolicy {
  const normalized = `${foodName} ${unit}`.trim().toLowerCase();
  if (['pinch', 'dash', 'نمک', 'salt', 'pepper', 'زعفران', 'saffron'].some((token) => normalized.includes(token))) return 'sublinear';
  if (['package', 'pack', 'box', 'بسته'].some((token) => normalized.includes(token))) return 'per_batch';
  if (['bay leaf', 'برگ بو', 'cinnamon stick', 'چوب دارچین'].some((token) => normalized.includes(token))) return 'fixed';
  if (['yeast', 'خمیرمایه', 'baking powder', 'بیکینگ پودر'].some((token) => normalized.includes(token))) return 'manual_review';
  return 'linear';
}
