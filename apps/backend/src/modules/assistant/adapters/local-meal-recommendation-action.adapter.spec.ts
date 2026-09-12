import { LocalMealRecommendationActionAdapter } from './local-meal-recommendation-action.adapter';

describe('LocalMealRecommendationActionAdapter', () => {
  it('translates local planning constraints into Food Operating Loop recommendations', async () => {
    const recommend = jest.fn().mockResolvedValue([
      { recipeId: 'recipe-1', name: 'Balanced Bowl', score: 90, coveragePercent: 100 },
    ]);
    const food = { recommend } as any;
    const register = jest.fn();
    const registry = { register } as any;
    const adapter = new LocalMealRecommendationActionAdapter(registry, food);

    adapter.onModuleInit();
    const registered = register.mock.calls[0][0];
    expect(registered.supports({
      id: 'd1', domain: 'nutrition', action: 'recommend_meal', score: 1, confidence: 1,
    })).toBe(true);

    const result = await registered.execute(
      { id: 'd1', domain: 'nutrition', action: 'recommend_meal', score: 1, confidence: 1 },
      {
        userId: 'user-1',
        localUnderstanding: { entities: {
          householdSize: 4, calories: 700, proteinGrams: 40, countryCode: 'IR',
          allergies: ['milk'], dietaryPreferences: ['high_protein'],
        } },
      },
    );

    expect(recommend).toHaveBeenCalledWith('user-1', 4, 'IR', 700, 40);
    expect(result.targetServings).toBe(4);
    expect(result.constraints.unsupportedHardConstraints).toEqual(['milk', 'high_protein']);
    expect(result.recommendations).toHaveLength(1);
  });
});
