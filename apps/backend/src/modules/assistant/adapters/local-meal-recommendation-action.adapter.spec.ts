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

  it('advertises and executes the meal recommendation action', async () => {
    const { recommend, registered } = build();
    expect(registered.actions).toEqual(['recommend_meal']);
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

    expect(recommend).toHaveBeenCalledWith('user-1', 4, 'IR', 700, 40, {
      allergies: [],
      dietaryPreferences: [],
    });
    expect(result.targetServings).toBe(4);
    expect(result.recommendations).toHaveLength(1);
  });

  it('passes safety constraints to the Food Operating Loop instead of silently ignoring them', async () => {
    const { recommend, registered } = build();
    await registered.execute(
      { id: 'd1', domain: 'nutrition', action: 'recommend_meal', score: 1, confidence: 1 },
      {
        userId: 'user-1',
        localUnderstanding: { entities: {
          householdSize: 4, allergies: ['milk'], dietaryPreferences: ['vegan'],
        } },
      },
    );

    expect(recommend).toHaveBeenCalledWith('user-1', 4, '', undefined, undefined, {
      allergies: ['milk'],
      dietaryPreferences: ['vegan'],
    });
  });
});
