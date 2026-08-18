import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { GlobalCountryFoodService } from '../../recipes/services/global-country-food.service';

export type MealPlanSlot = 'breakfast' | 'lunch' | 'dinner';

@Injectable()
export class MealPlanningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly countryFood: GlobalCountryFoodService,
  ) {}

  async createMealPlan(
    userId: string,
    targetServings = 1,
    countryCode = '',
  ) {
    if (!Number.isInteger(targetServings) || targetServings <= 0 || targetServings > 10000)
      throw new BadRequestException('targetServings must be an integer between 1 and 10000');

    const [recipes, profile] = await Promise.all([
      this.prisma.recipe.findMany({
        where: { OR: [{ userId: null }, { userId }] },
        orderBy: [{ verified: 'desc' }, { name: 'asc' }],
      }),
      this.prisma.nutritionProfile.findUnique({
        where: { userId },
        select: { dailyCaloriesGoal: true, proteinGoalGrams: true },
      }),
    ]);

    const dailyCalories = profile?.dailyCaloriesGoal ?? null;
    const dailyProtein = profile?.proteinGoalGrams ?? null;
    const caloriePerMeal = dailyCalories ? dailyCalories / 3 : null;
    const proteinPerMeal = dailyProtein ? dailyProtein / 3 : null;
    const countryRanked = this.countryFood.rankRecipesForCountry(countryCode, recipes as Array<{ name: string; cuisineFamily?: string | null }>);
    const countryRank = new Map(countryRanked.map((recipe, index) => [recipe.name, index]));

    const candidates = recipes.map((recipe) => {
      const caloriesPerServing = recipe.calories / recipe.servings;
      const proteinPerServing = recipe.protein / recipe.servings;
      const calorieDistance = caloriePerMeal ? Math.abs(caloriesPerServing - caloriePerMeal) / Math.max(1, caloriePerMeal) : 0;
      const proteinDistance = proteinPerMeal ? Math.abs(proteinPerServing - proteinPerMeal) / Math.max(1, proteinPerMeal) : 0;
      const localBoost = Math.max(0, 10 - (countryRank.get(recipe.name) ?? recipes.length));
      const score = Math.max(0, Math.round(100 - calorieDistance * 45 - proteinDistance * 30 + localBoost));
      return {
        recipeId: recipe.id,
        name: recipe.name,
        caloriesPerServing: Number(caloriesPerServing.toFixed(1)),
        proteinPerServing: Number(proteinPerServing.toFixed(1)),
        score,
      };
    }).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

    const chosen: MealPlanSlot[] = ['breakfast', 'lunch', 'dinner'];
    const used = new Set<string>();
    const meals = chosen.map((mealType, index) => {
      const candidate = candidates.find((item) => !used.has(item.recipeId)) ?? candidates[index] ?? null;
      if (candidate) used.add(candidate.recipeId);
      return { mealType, recipe: candidate };
    });

    return {
      targetServings,
      countryCode: countryCode.trim().toUpperCase() || null,
      targets: {
        dailyCalories,
        dailyProteinGrams: dailyProtein,
        caloriesPerMeal: caloriePerMeal === null ? null : Number(caloriePerMeal.toFixed(1)),
        proteinPerMealGrams: proteinPerMeal === null ? null : Number(proteinPerMeal.toFixed(1)),
      },
      meals,
      generatedDeterministically: true,
    };
  }

  async createMealBudgetPlan() {
    return {
      message: 'Meal budget plan requires a user context and target country.',
      budget: null,
      suggestions: [],
    };
  }
}
