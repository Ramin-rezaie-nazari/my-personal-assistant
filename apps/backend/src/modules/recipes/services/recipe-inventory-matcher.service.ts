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
  missing: Array<{
    foodId: string;
    name: string;
    quantity: number;
    unit: string;
  }>;
  available: Array<{
    foodId: string;
    name: string;
    quantity: number;
    unit: string;
  }>;
  score: number;
};

type UnitDimension = 'mass' | 'volume' | 'count' | 'unknown';

const UNIT_FACTORS: Record<string, { dimension: UnitDimension; factor: number }> = {
  mg: { dimension: 'mass', factor: 0.001 },
  g: { dimension: 'mass', factor: 1 },
  kg: { dimension: 'mass', factor: 1000 },
  ml: { dimension: 'volume', factor: 1 },
  l: { dimension: 'volume', factor: 1000 },
  cl: { dimension: 'volume', factor: 10 },
  unit: { dimension: 'count', factor: 1 },
  units: { dimension: 'count', factor: 1 },
  piece: { dimension: 'count', factor: 1 },
  pieces: { dimension: 'count', factor: 1 },
  pcs: { dimension: 'count', factor: 1 },
  pc: { dimension: 'count', factor: 1 },
};

function normalizeUnit(unit: string): string {
  return unit.trim().toLowerCase().replace(/\./g, '');
}

function convertQuantity(quantity: number, fromUnit: string, toUnit: string): number | null {
  const from = UNIT_FACTORS[normalizeUnit(fromUnit)];
  const to = UNIT_FACTORS[normalizeUnit(toUnit)];
  if (!from || !to || from.dimension !== to.dimension) return null;
  return (quantity * from.factor) / to.factor;
}

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
      this.prisma.inventoryItem.findMany({
        where: { userId },
        include: { food: true },
      }),
    ]);
    const stock = new Map(inventory.map((item) => [item.foodId, item]));
    return recipes
      .map((recipe) => {
        const missing: RecipeMatch['missing'] = [];
        const available: RecipeMatch['available'] = [];
        for (const ingredient of recipe.ingredients) {
          const item = stock.get(ingredient.foodId);
          const compatibleQuantity = item
            ? convertQuantity(item.quantity, item.unit, ingredient.unit)
            : null;
          const quantity = compatibleQuantity ?? 0;
          if (compatibleQuantity !== null && quantity >= ingredient.quantity) {
            available.push({
              foodId: ingredient.foodId,
              name: ingredient.food.name,
              quantity: ingredient.quantity,
              unit: ingredient.unit,
            });
          } else {
            missing.push({
              foodId: ingredient.foodId,
              name: ingredient.food.name,
              quantity: compatibleQuantity === null
                ? ingredient.quantity
                : Math.max(0, ingredient.quantity - quantity),
              unit: ingredient.unit,
            });
          }
        }
        const total = recipe.ingredients.length;
        const coveragePercent =
          total === 0
            ? 0
            : Math.round(((total - missing.length) / total) * 100);
        const proteinBonus = Math.min(15, Math.round(recipe.protein / 5));
        const score = Math.max(
          0,
          Math.min(
            100,
            coveragePercent +
              proteinBonus +
              (recipe.verified ? 5 : 0) -
              missing.length * 2,
          ),
        );
        return {
          recipeId: recipe.id,
          name: recipe.name,
          calories: recipe.calories,
          protein: recipe.protein,
          carbs: recipe.carbs,
          fat: recipe.fat,
          coveragePercent,
          missingCount: missing.length,
          missing,
          available,
          score,
        };
      })
      .sort(
        (a, b) =>
          b.score - a.score ||
          b.coveragePercent - a.coveragePercent ||
          a.missingCount - b.missingCount,
      );
  }
}
