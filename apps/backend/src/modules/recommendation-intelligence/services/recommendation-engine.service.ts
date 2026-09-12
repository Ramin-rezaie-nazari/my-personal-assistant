import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { PersonalizationService } from './personalization.service';

@Injectable()
export class RecommendationEngineService {
  constructor(private readonly prisma: PrismaService, private readonly personalization: PersonalizationService) {}

  async generateFoodRecommendations(userId: string, limit = 10) {
    const context = await this.personalization.buildContext(userId);
    const recipes = await this.prisma.recipe.findMany({
      where: { userId: null },
      include: { ingredients: { include: { food: true } } },
      take: 500,
      orderBy: [{ verified: 'desc' }, { updatedAt: 'desc' }],
    });
    const recentNames = new Set(context.recentMeals.map((meal) => meal.name.toLowerCase()));
    const scored = recipes.map((recipe) => {
      const caloriesGoal = context.nutrition.caloriesGoal ?? 0;
      const proteinGoal = context.nutrition.proteinGoal ?? 0;
      const calorieFit = caloriesGoal > 0 ? Math.max(0, 1 - Math.abs(recipe.calories - caloriesGoal * 0.35) / Math.max(caloriesGoal, 1)) : 0.5;
      const proteinFit = proteinGoal > 0 ? Math.max(0, 1 - Math.abs(recipe.protein - proteinGoal * 0.35) / Math.max(proteinGoal, 1)) : 0.5;
      const dietFit = !context.nutrition.dietType || context.nutrition.dietType === 'general' ? 0.6 : this.dietScore(recipe, context.nutrition.dietType);
      const novelty = recentNames.has(recipe.name.toLowerCase()) ? 0.15 : 0.8;
      const quality = recipe.verified ? 1 : 0.65;
      const score = 100 * (0.28 * calorieFit + 0.24 * proteinFit + 0.2 * dietFit + 0.18 * novelty + 0.1 * quality);
      return { recipe, score: Number(score.toFixed(2)), breakdown: { calorieFit, proteinFit, dietFit, novelty, quality } };
    }).sort((a, b) => b.score - a.score || a.recipe.id.localeCompare(b.recipe.id));
    return scored.slice(0, Math.max(1, Math.min(limit, 50))).map(({ recipe, score, breakdown }) => ({
      id: recipe.id, name: recipe.name, servings: recipe.servings, calories: recipe.calories, protein: recipe.protein,
      carbs: recipe.carbs, fat: recipe.fat, score, breakdown, verified: recipe.verified,
    }));
  }

  private dietScore(recipe: { ingredients: Array<{ food: { name: string } }> }, dietType: string) {
    const names = recipe.ingredients.map((item) => item.food.name.toLowerCase());
    const animal = names.some((name) => /beef|chicken|turkey|pork|lamb|fish|salmon|shrimp|egg|milk|cheese|yogurt|butter/.test(name));
    if (dietType.toLowerCase().includes('vegan')) return animal ? 0 : 1;
    if (dietType.toLowerCase().includes('vegetarian')) return names.some((name) => /beef|chicken|turkey|pork|lamb|fish|salmon|shrimp/.test(name)) ? 0 : 1;
    return 0.6;
  }
}
