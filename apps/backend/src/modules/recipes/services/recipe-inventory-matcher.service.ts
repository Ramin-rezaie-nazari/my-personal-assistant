import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

export type RecipeMatch = {
  recipeId: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  coveragePercent: number;
  missingCount: number;
  missing: Array<{ foodId: string; name: string; quantity: number; unit: string }>;
  available: Array<{ foodId: string; name: string; quantity: number; unit: string }>;
  score: number;
};

@Injectable()
export class RecipeInventoryMatcherService {
  constructor(private readonly prisma: PrismaService) {}

  async match(userId: string): Promise<RecipeMatch[]> {
    const [recipes, inventory] = await Promise.all([
      this.prisma.recipe.findMany({
        where: { OR: [{ userId: null }, { userId }] },
        include: { ingredients: { include: { food: true } } },
        orderBy: [{ verified: 'desc' }, { name: 'asc' }],
      }),
      this.prisma.inventoryItem.findMany({ where: { userId }, include: { food: true } }),
    ]);
    const stock = new Map(inventory.map((item) => [item.foodId, item]));
    return recipes.map((recipe) => {
      const missing: RecipeMatch['missing'] = [];
      const available: RecipeMatch['available'] = [];
      for (const ingredient of recipe.ingredients) {
        const item = stock.get(ingredient.foodId);
        const quantity = item?.quantity ?? 0;
        if (quantity >= ingredient.quantity) available.push({ foodId: ingredient.foodId, name: ingredient.food.name, quantity: ingredient.quantity, unit: ingredient.unit });
        else missing.push({ foodId: ingredient.foodId, name: ingredient.food.name, quantity: Math.max(0, ingredient.quantity - quantity), unit: ingredient.unit });
      }
      const total = recipe.ingredients.length;
      const coveragePercent = total === 0 ? 0 : Math.round(((total - missing.length) / total) * 100);
      const proteinBonus = Math.min(15, Math.round(recipe.protein / 5));
      const score = Math.max(0, Math.min(100, coveragePercent + proteinBonus + (recipe.verified ? 5 : 0) - missing.length * 2));
      return { recipeId: recipe.id, name: recipe.name, calories: recipe.calories, protein: recipe.protein, carbs: recipe.carbs, fat: recipe.fat, coveragePercent, missingCount: missing.length, missing, available, score };
    }).sort((a, b) => b.score - a.score || b.coveragePercent - a.coveragePercent || a.missingCount - b.missingCount);
  }
}
