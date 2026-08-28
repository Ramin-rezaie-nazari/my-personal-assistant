import { RecommendationEngineService } from './recommendation-engine.service';
import { RecommendationRankingService } from './recommendation-ranking.service';

describe('RecommendationEngineService', () => {
  it('rejects allergy/diet conflicts and returns scored deterministic candidates', async () => {
    const prisma = {
      recipe: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'r1',
            name: 'Chickpea Salad',
            description: 'High protein salad',
            servings: 2,
            ingredients: [
              { food: { name: 'chickpea', category: 'legume' } },
            ],
          },
          {
            id: 'r2',
            name: 'Peanut Noodles',
            description: 'Quick noodles',
            servings: 2,
            ingredients: [
              { food: { name: 'peanut', category: 'nut' } },
            ],
          },
        ]),
      },
    };

    const loop = {
      recommend: jest.fn().mockResolvedValue([
        {
          recipeId: 'r1',
          name: 'Chickpea Salad',
          score: 80,
          coveragePercent: 90,
          missingCount: 1,
          caloriesPerServing: 350,
          proteinPerServing: 18,
          targetServings: 2,
          missingIngredients: [{ name: 'lemon' }],
        },
        {
          recipeId: 'r2',
          name: 'Peanut Noodles',
          score: 92,
          coveragePercent: 100,
          missingCount: 0,
          caloriesPerServing: 500,
          proteinPerServing: 20,
          targetServings: 2,
          missingIngredients: [],
        },
      ]),
    };

    const country = {
      rankRecipesForCountry: jest.fn().mockImplementation((_country, recipes) => recipes),
    };

    const personalization = {
      buildFoodContext: jest.fn().mockResolvedValue({
        primaryGoal: 'weight loss',
        nutritionGoal: 'high protein',
        dietType: 'vegetarian',
        dailyCaloriesGoal: 2000,
        proteinGoalGrams: 100,
        recentMealNames: [],
        allergyTerms: ['peanut'],
        dietaryTerms: [],
      }),
    };

    const ranking = new RecommendationRankingService();
    const service = new RecommendationEngineService(
      prisma as never,
      loop as never,
      country as never,
      personalization as never,
      ranking,
    );

    const result = await service.generateFoodRecommendations('user-1', {
      category: 'salad',
      goal: 'weight loss',
      context: 'high protein',
      countryCode: 'IR',
      targetServings: 2,
      limit: 5,
    });

    expect(result.generatedDeterministically).toBe(true);
    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0].recipeId).toBe('r1');
    expect(result.recommendations[0].scoreBreakdown).toEqual(
      expect.objectContaining({
        baseFoodOperatingLoop: expect.any(Number),
        inventoryCoverage: expect.any(Number),
        intentMatch: expect.any(Number),
        nutritionFit: expect.any(Number),
      }),
    );
    expect(result.recommendations[0].reasons.length).toBeGreaterThan(0);
    expect(result.rejectedCandidates).toEqual([
      {
        recipeId: 'r2',
        name: 'Peanut Noodles',
        reasons: ['allergy conflict: peanut'],
      },
    ]);
  });
});
