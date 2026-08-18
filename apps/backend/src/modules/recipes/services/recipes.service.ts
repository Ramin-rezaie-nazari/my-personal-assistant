import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

export type RecipeInput = {
  name: string;
  description?: string;
  imageUrl?: string;
  imageSource?: string;
  servings?: number;
  ingredients: Array<{ foodId: string; quantity: number; unit?: string }>;
};

@Injectable()
export class RecipesService {
  constructor(private readonly prisma: PrismaService) {}

  async createRecipe(userId: string, data: RecipeInput) {
    this.validateInput(data);
    const foodIds = [...new Set(data.ingredients.map((item) => item.foodId))];
    return this.prisma.$transaction(async (tx) => {
      const foods = await tx.foodItem.findMany({
        where: { id: { in: foodIds }, OR: [{ userId: null }, { userId }] },
      });
      if (foods.length !== foodIds.length)
        throw new NotFoundException('One or more food items were not found');
      const byId = new Map(foods.map((food) => [food.id, food]));
      const ingredients = data.ingredients.map((item) => {
        const food = byId.get(item.foodId)!;
        return {
          foodId: food.id,
          quantity: item.quantity,
          unit: item.unit?.trim() || 'g',
          calories: Math.round(food.calories * item.quantity),
          protein: food.protein * item.quantity,
          carbs: food.carbs * item.quantity,
          fat: food.fat * item.quantity,
        };
      });
      const totals = ingredients.reduce(
        (sum, item) => ({
          calories: sum.calories + item.calories,
          protein: sum.protein + item.protein,
          carbs: sum.carbs + item.carbs,
          fat: sum.fat + item.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      );
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
    return this.prisma.recipe.findMany({
      where: { OR: [{ userId: null }, { userId }] },
      include: { ingredients: { include: { food: true } } },
      orderBy: [{ verified: 'desc' }, { name: 'asc' }],
    });
  }

  async getRecipe(userId: string, id: string) {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id, OR: [{ userId: null }, { userId }] },
      include: { ingredients: { include: { food: true } } },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');
    return recipe;
  }

  async updateRecipe(userId: string, id: string, data: Partial<RecipeInput>) {
    const existing = await this.prisma.recipe.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new NotFoundException('Recipe not found');
    if (data.name !== undefined && !data.name.trim())
      throw new BadRequestException('name must not be empty');
    if (data.servings !== undefined) this.validateServings(data.servings);
    if (data.ingredients !== undefined) {
      this.validateInput({
        name: data.name ?? existing.name,
        servings: data.servings ?? existing.servings,
        ingredients: data.ingredients,
      });
    }
    return this.prisma.$transaction(async (tx) => {
      if (data.ingredients !== undefined) {
        const foodIds = [
          ...new Set(data.ingredients.map((item) => item.foodId)),
        ];
        const foods = await tx.foodItem.findMany({
          where: { id: { in: foodIds }, OR: [{ userId: null }, { userId }] },
        });
        if (foods.length !== foodIds.length)
          throw new NotFoundException('One or more food items were not found');
        const byId = new Map(foods.map((food) => [food.id, food]));
        const ingredients = data.ingredients.map((item) => {
          const food = byId.get(item.foodId)!;
          return {
            foodId: food.id,
            quantity: item.quantity,
            unit: item.unit?.trim() || 'g',
            calories: Math.round(food.calories * item.quantity),
            protein: food.protein * item.quantity,
            carbs: food.carbs * item.quantity,
            fat: food.fat * item.quantity,
          };
        });
        const totals = ingredients.reduce(
          (sum, item) => ({
            calories: sum.calories + item.calories,
            protein: sum.protein + item.protein,
            carbs: sum.carbs + item.carbs,
            fat: sum.fat + item.fat,
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 },
        );
        await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
        return tx.recipe.update({
          where: { id },
          data: {
            name: data.name?.trim(),
            description: data.description?.trim() || undefined,
            imageUrl: data.imageUrl?.trim() || undefined,
            imageSource: data.imageSource?.trim() || undefined,
            servings: data.servings ?? existing.servings,
            ...totals,
            ingredients: { create: ingredients },
          },
          include: { ingredients: { include: { food: true } } },
        });
      }
      return tx.recipe.update({
        where: { id },
        data: {
          name: data.name?.trim(),
          description: data.description?.trim() || undefined,
          imageUrl: data.imageUrl?.trim() || undefined,
          imageSource: data.imageSource?.trim() || undefined,
          servings: data.servings ?? existing.servings,
        },
        include: { ingredients: { include: { food: true } } },
      });
    });
  }

  async deleteRecipe(userId: string, id: string) {
    const result = await this.prisma.recipe.deleteMany({
      where: { id, userId },
    });
    if (!result.count) throw new NotFoundException('Recipe not found');
    return { deleted: true };
  }

  private validateInput(data: RecipeInput) {
    if (!data.name?.trim())
      throw new BadRequestException('name must not be empty');
    if (!Array.isArray(data.ingredients) || data.ingredients.length === 0)
      throw new BadRequestException(
        'A recipe must contain at least one ingredient',
      );
    if (data.servings !== undefined) this.validateServings(data.servings);
    for (const ingredient of data.ingredients) {
      if (!ingredient.foodId?.trim())
        throw new BadRequestException('foodId must not be empty');
      if (!Number.isFinite(ingredient.quantity) || ingredient.quantity <= 0)
        throw new BadRequestException(
          'ingredient quantity must be a positive finite number',
        );
    }
  }

  private validateServings(value: number) {
    if (!Number.isInteger(value) || value <= 0 || value > 10000)
      throw new BadRequestException(
        'servings must be an integer between 1 and 10000',
      );
  }
}