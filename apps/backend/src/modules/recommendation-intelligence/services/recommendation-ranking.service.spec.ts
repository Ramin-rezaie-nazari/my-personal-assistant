import { RecommendationRankingService } from './recommendation-ranking.service';

describe('RecommendationRankingService', () => {
  it('avoids adjacent recommendations from the same family when alternatives exist', () => {
    const service = new RecommendationRankingService();
    const ranked = service.rankRecommendations([
      {
        recipeId: '1',
        name: 'Chicken Curry',
        score: 95,
        familyKey: 'chicken curry',
        reasons: [],
        scoreBreakdown: {},
        missingCount: 0,
        missingIngredients: [],
        caloriesPerServing: 500,
        proteinPerServing: 35,
      },
      {
        recipeId: '2',
        name: 'Chicken Curry Light',
        score: 94,
        familyKey: 'chicken curry',
        reasons: [],
        scoreBreakdown: {},
        missingCount: 0,
        missingIngredients: [],
        caloriesPerServing: 450,
        proteinPerServing: 36,
      },
      {
        recipeId: '3',
        name: 'Lentil Soup',
        score: 90,
        familyKey: 'lentil soup',
        reasons: [],
        scoreBreakdown: {},
        missingCount: 0,
        missingIngredients: [],
        caloriesPerServing: 300,
        proteinPerServing: 18,
      },
    ], 3);

    expect(ranked.map((item) => item.recipeId)).toEqual(['1', '3', '2']);
  });

  it('creates a stable family key from the first two words', () => {
    expect(RecommendationRankingService.familyKey('  Persian Chicken Stew  ')).toBe(
      'persian chicken',
    );
  });
});
