import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { HouseholdItemNormalizerService } from '../../shopping-intelligence/services/household-item-normalizer.service';

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly normalizer: HouseholdItemNormalizerService,
  ) {}

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
    return recipes
      .map((recipe) => {
        const missing: RecipeMatch['missing'] = [];
        const available: RecipeMatch['available'] = [];
        for (const ingredient of recipe.ingredients) {
          const item = stock.get(ingredient.foodId);
          const required = this.safeNormalize(ingredient.quantity, ingredient.unit);
          const owned = item ? this.safeNormalize(item.quantity, item.unit) : null;
          const comparable = required && owned && required.unit !== undefined && owned.unit !== undefined && this.normalizer.canConvert(owned.unit, required.unit);
          const ownedInRequiredUnit = comparable ? this.normalizer.convert(item!.quantity, item!.unit, ingredient.unit) : 0;
          if (comparable && ownedInRequiredUnit >= ingredient.quantity) {
            available.push({ foodId: ingredient.foodId, name: ingredient.food.name, quantity: ingredient.quantity, unit: ingredient.unit });
          } else {
            const shortage = comparable ? Math.max(0, ingredient.quantity - ownedInRequiredUnit) : ingredient.quantity;
            missing.push({ foodId: ingredient.foodId, name: ingredient.food.name, quantity: shortage, unit: ingredient.unit });
          }
        }
        const total = recipe.ingredients.length;
        const coveragePercent = total === 0 ? 0 : Math.round(((total - missing.length) / total) * 100);
        const proteinBonus = Math.min(15, Math.round(recipe.protein / 5));
        const score = Math.max(0, Math.min(100, coveragePercent + proteinBonus + (recipe.verified ? 5 : 0) - missing.length * 2));
        return { recipeId: recipe.id, name: recipe.name, calories: recipe.calories, protein: recipe.protein, carbs: recipe.carbs, fat: recipe.fat, coveragePercent, missingCount: missing.length, missing, available, score };
      })
      .sort((a, b) => b.score - a.score || b.coveragePercent - a.coveragePercent || a.missingCount - b.missingCount);
  }

  private safeNormalize(quantity: number, unit: string) {
    try {
      return this.normalizer.normalizeQuantity(quantity, unit);
    } catch {
      return null;
    }
  }
}
