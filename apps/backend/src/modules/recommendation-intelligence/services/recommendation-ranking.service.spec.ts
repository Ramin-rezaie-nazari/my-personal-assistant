import { RecommendationRankingService } from './recommendation-ranking.service';

describe('RecommendationRankingService', () => {
  const service = new RecommendationRankingService();

  it('keeps the highest scores while diversifying near-top recipe families', () => {
    const base = {
      baseScore: 0,
      personalizationAdjustment: 0,
      coveragePercent: 100,
      missingCount: 0,
      caloriesPerServing: 500,
      proteinPerServing: 30,
      targetServings: 2,
      missingIngredients: [],
      recentlyEaten: false,
      reasons: [],
    };

    const result = service.rankRecommendations([
      { ...base, recipeId: '1', name: 'Chicken Bowl', score: 98 },
      { ...base, recipeId: '2', name: 'Chicken Salad', score: 97 },
      { ...base, recipeId: '3', name: 'Lentil Soup', score: 96 },
      { ...base, recipeId: '4', name: 'Chicken Plate', score: 95 },
    ]);

    expect(result.map((item) => item.recipeId)).toEqual(['1', '3', '2', '4']);
    expect(result.map((item) => item.rank)).toEqual([1, 2, 3, 4]);
  });
});
