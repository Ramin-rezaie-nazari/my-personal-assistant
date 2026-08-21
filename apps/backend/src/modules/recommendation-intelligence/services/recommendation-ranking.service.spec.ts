import { RecommendationRankingService, RankedFoodRecommendation } from './recommendation-ranking.service';

function item(id: string, name: string, score: number, inventory: number): RankedFoodRecommendation {
  return {
    recipeId: id,
    name,
    score,
    decision: score >= 72 ? 'strong_match' : score >= 55 ? 'good_match' : 'fallback',
    reasons: [],
    breakdown: { inventory, nutrition: 0.8, preference: 0.5, novelty: 1, cuisine: 0.5, verified: 1, missing: 0.5, penalties: 0 },
    targetServings: 2,
    caloriesPerServing: 500,
    proteinPerServing: 30,
    missingIngredients: [],
  };
}

describe('RecommendationRankingService', () => {
  it('prefers high score and diversifies near-top recipe families', () => {
    const service = new RecommendationRankingService();
    const ranked = service.rankRecommendations([
      item('1', 'Chicken Tacos', 95, 0.9),
      item('2', 'Chicken Tacos Easy', 94, 0.95),
      item('3', 'Dal Tadka', 90, 0.5),
      item('4', 'Biryani', 88, 0.6),
    ], 3);

    expect(ranked.map((x) => x.recipeId)).toEqual(['1', '3', '4']);
  });

  it('caps the result size safely', () => {
    const service = new RecommendationRankingService();
    const ranked = service.rankRecommendations([item('1', 'Soup', 80, 0.8)], 100);
    expect(ranked).toHaveLength(1);
  });
});
