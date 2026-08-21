import { RecommendationEngineService } from './recommendation-engine.service';
import { RecommendationRankingService } from './recommendation-ranking.service';

function buildService(recipeOverrides: Record<string, unknown> = {}) {
  const recipe = {
    id: 'r1',
    name: 'Indian Lentil Curry',
    description: 'A comforting Indian curry with cumin and turmeric',
    servings: 2,
    calories: 600,
    protein: 30,
    verified: true,
    ingredients: [
      { food: { name: 'lentil', category: 'legume' } },
      { food: { name: 'cumin', category: 'herb_spice' } },
      { food: { name: 'turmeric', category: 'herb_spice' } },
    ],
    updatedAt: new Date('2026-08-21T00:00:00Z'),
    ...recipeOverrides,
  };

  const prisma = {
    userProfile: { findUnique: jest.fn().mockResolvedValue({ primaryGoal: null }) },
    healthProfile: { findUnique: jest.fn().mockResolvedValue({ activityLevel: 'moderate' }) },
    nutritionProfile: {
      findUnique: jest.fn().mockResolvedValue({
        dietType: null,
        dailyCaloriesGoal: 2000,
        proteinGoalGrams: 100,
      }),
    },
    meal: { findMany: jest.fn().mockResolvedValue([]) },
    recipe: { findMany: jest.fn().mockResolvedValue([recipe]) },
  };

  const foodLoop = {
    recommend: jest.fn().mockResolvedValue([
      {
        recipeId: 'r1',
        coveragePercent: 100,
        missingCount: 0,
        missingIngredients: [],
      },
    ]),
  };

  const countryFood = {
    getLocalRecipeGuidance: jest.fn().mockReturnValue({
      cuisineFamily: 'Indian',
      preferredRecipes: [],
    }),
  };

  const personalization = {
    getFoodDecisionContext: jest.fn().mockImplementation(async (_userId: string, overrides: Record<string, unknown>) => ({
      dietaryPreferences: (overrides.dietaryPreferences as string[] | undefined) ?? [],
      allergySignals: (overrides.allergySignals as string[] | undefined) ?? [],
      dislikedIngredients: (overrides.dislikedIngredients as string[] | undefined) ?? [],
      recentMealNames: [],
      targetCaloriesPerServing: (overrides.maxCalories as number | undefined) ?? 600,
      targetProteinPerServing: (overrides.minProteinGrams as number | undefined) ?? 30,
      countryCode: String(overrides.countryCode ?? '').toUpperCase(),
      primaryGoal: undefined,
      activityLevel: 'moderate',
    })),
  };

  const ranking = new RecommendationRankingService();
  const service = new RecommendationEngineService(
    prisma as never,
    foodLoop as never,
    countryFood as never,
    personalization as never,
    ranking,
  );

  return { service, prisma, foodLoop, countryFood };
}

describe('RecommendationEngineService food decision brain', () => {
  it('understands a global cuisine request independently of the user country', async () => {
    const { service, countryFood } = buildService();

    const result = await service.generateRecommendations('user-1', {
      category: 'food',
      goal: 'choose meal',
      context: 'I feel like Indian food today',
      targetServings: 2,
      countryCode: 'IR',
    });

    expect(result.intent.foodThemes).toContain('indian');
    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0].reasons.join(' ')).toMatch(/cuisine|nutrition|already available/i);
    expect(countryFood.getLocalRecipeGuidance).toHaveBeenCalledWith('IR');
  });

  it('hard-blocks a recipe that conflicts with an allergy signal', async () => {
    const { service } = buildService({
      name: 'Creamy Chicken Pasta',
      description: 'Chicken pasta with dairy cream',
      ingredients: [
        { food: { name: 'chicken', category: 'poultry' } },
        { food: { name: 'cream', category: 'dairy' } },
      ],
    });

    const result = await service.generateRecommendations('user-1', {
      category: 'food',
      goal: 'choose meal',
      context: '',
      targetServings: 2,
      allergySignals: ['cream'],
    });

    expect(result.recommendations).toHaveLength(0);
    expect(result.rejected[0]?.reason).toContain('allergy signal');
    expect(result.meta.hardRejected).toBe(1);
  });

  it('only treats missing-ingredient count as a hard blocker when explicitly requested', async () => {
    const { service, foodLoop } = buildService();
    foodLoop.recommend.mockResolvedValue([
      {
        recipeId: 'r1',
        coveragePercent: 10,
        missingCount: 8,
        missingIngredients: [],
      },
    ]);

    const defaultResult = await service.generateRecommendations('user-1', {
      category: 'food',
      goal: 'choose meal',
      context: '',
      targetServings: 2,
    });
    expect(defaultResult.recommendations).toHaveLength(1);

    const strictResult = await service.generateRecommendations('user-1', {
      category: 'food',
      goal: 'choose meal',
      context: '',
      targetServings: 2,
      maxMissingIngredients: 3,
    });
    expect(strictResult.recommendations).toHaveLength(0);
    expect(strictResult.rejected[0]?.reason).toContain('too many missing ingredients');
  });
});
