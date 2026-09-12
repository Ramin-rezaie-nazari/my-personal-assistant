import { LocalMealRecommendationActionAdapter } from './local-meal-recommendation-action.adapter';

describe('LocalMealRecommendationActionAdapter', () => {
  function build() {
    const recommend = jest.fn().mockResolvedValue([
      { recipeId: 'recipe-1', name: 'Balanced Bowl', score: 90, coveragePercent: 100 },
    ]);
    const food = { recommend } as any;
    const register = jest.fn();
    const registry = { register } as any;
    const adapter = new LocalMealRecommendationActionAdapter(registry, food);
    adapter.onModuleInit();
    return { recommend, registered: register.mock.calls[0][0] };
  }

  it('translates supported local planning constraints into recommendations', async () => {
    const { recommend, registered } = build();
    expect(registered.supports({
      id: 'd1', domain: 'nutrition', action: 'recommend_meal', score: 1, confidence: 1,
    })).toBe(true);

    const result = await registered.execute(
      { id: 'd1', domain: 'nutrition', action: 'recommend_meal', score: 1, confidence: 1 },
      {
        userId: 'user-1',
        localUnderstanding: { entities: {
          householdSize: 4, calories: 700, proteinGrams: 40, countryCode: 'IR',
        } },
      },
    );

    expect(recommend).toHaveBeenCalledWith('user-1', 4, 'IR', 700, 40);
    expect(result.targetServings).toBe(4);
    expect(result.recommendations).toHaveLength(1);
  });

  it('fails closed when allergy or diet constraints are not supported by recipe data', async () => {
    const { recommend, registered } = build();
    await expect(registered.execute(
      { id: 'd1', domain: 'nutrition', action: 'recommend_meal', score: 1, confidence: 1 },
      {
        userId: 'user-1',
        localUnderstanding: { entities: {
          householdSize: 4, allergies: ['milk'], dietaryPreferences: ['vegan'],
        } },
      },
    )).rejects.toThrow('unsupported_hard_constraints:milk,vegan');
    expect(recommend).not.toHaveBeenCalled();
  });
});
