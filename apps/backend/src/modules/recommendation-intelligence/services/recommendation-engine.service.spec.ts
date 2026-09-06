import { RecommendationEngineService } from './recommendation-engine.service';

describe('RecommendationEngineService', () => {
  const foodOperatingLoop = {
    recommend: jest.fn(),
  };
  const personalization = {
    buildFoodContext: jest.fn(),
  };
  const ranking = {
    rankRecommendations: jest.fn((items) => items),
  };

  const service = new RecommendationEngineService(
    foodOperatingLoop as never,
    personalization as never,
    ranking as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('builds personalized deterministic recommendations from the canonical food loop', async () => {
    personalization.buildFoodContext.mockResolvedValue({
      calorieLimit: 900,
      proteinFloor: 36,
      dietType: 'balanced',
      primaryGoal: 'muscle_gain',
      recentMealTitles: ['Chicken Bowl'],
    });
    foodOperatingLoop.recommend.mockResolvedValue([
      {
        recipeId: 'r1',
        name: 'Chicken Bowl',
        score: 92,
        coveragePercent: 100,
        missingCount: 0,
        caloriesPerServing: 700,
        proteinPerServing: 50,
        targetServings: 2,
        missingIngredients: [],
      },
      {
        recipeId: 'r2',
        name: 'Lentil Plate',
        score: 80,
        coveragePercent: 75,
        missingCount: 1,
        caloriesPerServing: 650,
        proteinPerServing: 40,
        targetServings: 2,
        missingIngredients: [{ foodId: 'f1' }],
      },
    ]);

    const result = await service.generateRecommendations('u1', {
      targetServings: 2,
      countryCode: 'ir',
      maxMissingIngredients: 2,
    });

    expect(foodOperatingLoop.recommend).toHaveBeenCalledWith('u1', 2, 'ir', 900, 36, 2);
    expect(result.generatedDeterministically).toBe(true);
    expect(result.countryCode).toBe('IR');
    expect(result.recommendations[0]).toMatchObject({
      recipeId: 'r1',
      baseScore: 92,
      personalizationAdjustment: -10,
      score: 82,
      recentlyEaten: true,
    });
    expect(result.recommendations[1]).toMatchObject({
      recipeId: 'r2',
      personalizationAdjustment: 0,
      score: 80,
      recentlyEaten: false,
    });
  });

  it('uses explicit request nutrition thresholds over profile defaults', async () => {
    personalization.buildFoodContext.mockResolvedValue({
      calorieLimit: 800,
      proteinFloor: 30,
      dietType: null,
      primaryGoal: null,
      recentMealTitles: [],
    });
    foodOperatingLoop.recommend.mockResolvedValue([]);

    await service.generateRecommendations('u1', {
      targetServings: 4,
      maxCalories: 600,
      minProteinGrams: 45,
    });

    expect(foodOperatingLoop.recommend).toHaveBeenCalledWith('u1', 4, '', 600, 45, undefined);
  });
});
