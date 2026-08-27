import { Injectable } from '@nestjs/common';
import { FoodOperatingLoopService } from './food-operating-loop.service';

export type ConsolidatedShoppingNeed = {
  foodId: string;
  name: string;
  quantity: number;
  unit: string;
  recipeIds: string[];
};

@Injectable()
export class RecipeShoppingConsolidationService {
  constructor(private readonly foodLoop: FoodOperatingLoopService) {}

  async build(
    userId: string,
    recipes: Array<{ recipeId: string; servings: number }>,
    countryCode = '',
  ) {
    const plans = await Promise.all(
      recipes.map((recipe) =>
        this.foodLoop.buildPlan(userId, recipe.recipeId, recipe.servings, countryCode),
      ),
    );
    const merged = new Map<string, ConsolidatedShoppingNeed>();
    for (const plan of plans) {
      for (const item of plan.inventory.missing) {
        const existing = merged.get(item.foodId);
        if (!existing) {
          merged.set(item.foodId, {
            foodId: item.foodId,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            recipeIds: [plan.recipe.id],
          });
          continue;
        }
        const compatible = merge(existing.quantity, existing.unit, item.quantity, item.unit);
        if (compatible) {
          existing.quantity = compatible.quantity;
          existing.unit = compatible.unit;
          existing.recipeIds = Array.from(new Set([...existing.recipeIds, plan.recipe.id]));
        } else {
          merged.set(`${item.foodId}:${item.unit}`, {
            foodId: item.foodId,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            recipeIds: [plan.recipe.id],
          });
        }
      }
    }
    return {
      recipes: plans.map((plan) => ({ recipeId: plan.recipe.id, name: plan.recipe.name, servings: plan.recipe.targetServings })),
      items: Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name)),
      totalItems: merged.size,
      generatedDeterministically: true,
    };
  }
}

function merge(left: number, leftUnit: string, right: number, rightUnit: string) {
  const a = normalize(leftUnit, left);
  const b = normalize(rightUnit, right);
  if (!a || !b || a.kind !== b.kind) return null;
  return { quantity: denormalize(a.base + b.base, a.kind, leftUnit), unit: leftUnit };
}

function normalize(unit: string, quantity: number): { kind: 'mass' | 'volume' | 'count'; base: number } | null {
  const u = unit.trim().toLowerCase();
  if (['g', 'gram', 'grams', 'گرم'].includes(u)) return { kind: 'mass', base: quantity };
  if (['kg', 'kilogram', 'kilograms', 'کیلو'].includes(u)) return { kind: 'mass', base: quantity * 1000 };
  if (['ml', 'milliliter', 'milliliters'].includes(u)) return { kind: 'volume', base: quantity };
  if (['l', 'liter', 'liters'].includes(u)) return { kind: 'volume', base: quantity * 1000 };
  if (['piece', 'pieces', 'pcs', 'count', 'عدد'].includes(u)) return { kind: 'count', base: quantity };
  return null;
}

function denormalize(value: number, kind: 'mass' | 'volume' | 'count', unit: string) {
  const u = unit.trim().toLowerCase();
  if (kind === 'mass' && ['kg', 'kilogram', 'kilograms', 'کیلو'].includes(u)) return Number((value / 1000).toFixed(3));
  if (kind === 'volume' && ['l', 'liter', 'liters'].includes(u)) return Number((value / 1000).toFixed(3));
  return Number(value.toFixed(3));
}
