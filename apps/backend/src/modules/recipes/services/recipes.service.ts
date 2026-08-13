import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

export type RecipeInput = {
  name: string;
  description?: string;
  ingredients: Array<{ foodId: string; quantity: number; unit?: string }>;
};

@Injectable()
export class RecipesService {
  constructor(private readonly prisma: PrismaService) {}

  async getRecipes(userId: string) {
    return this.prisma.recipe.findMany({
      where: { OR: [{ userId: null }, { userId }] },
      include: { ingredients: { include: { food: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createRecipe(userId: string, input: RecipeInput) {
    if (!input.name.trim()) throw new BadRequestException('Recipe name is required');
    if (!input.ingredients.length) throw new BadRequestException('A recipe must contain at least one ingredient');

    const foodIds = [...new Set(input.ingredients.map((item) => item.foodId))];

    return this.prisma.$transaction(async (tx) => {
      const foods = await tx.foodItem.findMany({ where: { id: { in: foodIds }, OR: [{ userId: null }, { userId }] } });
      if (foods.length !== foodIds.length) throw new NotFoundException('One or more food items were not found');

      const byId = new Map(foods.map((food) => [food.id, food]));
      const ingredients = input.ingredients.map((item) => {
        if (!Number.isFinite(item.quantity) || item.quantity <= 0) throw new BadRequestException('Ingredient quantity must be positive');
        const food = byId.get(item.foodId)!;
        return {
          foodId: food.id,
          quantity: item.quantity,
          unit: item.unit ?? 'serving',
          calories: Math.round(food.calories * item.quantity),
          protein: food.protein * item.quantity,
          carbs: food.carbs * item.quantity,
          fat: food.fat * item.quantity,
        };
      });

      const totals = ingredients.reduce((sum, item) => ({
        calories: sum.calories + item.calories,
        protein: sum.protein + item.protein,
        carbs: sum.carbs + item.carbs,
        fat: sum.fat + item.fat,
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

      return tx.recipe.create({
        data: {
          userId,
          name: input.name.trim(),
          description: input.description,
          ...totals,
          ingredients: { create: ingredients },
        },
        include: { ingredients: { include: { food: true } } },
      });
    });
  }
}
