import { Injectable } from '@nestjs/common';

export type RankedFoodRecommendation = {
  recipeId: string;
  name: string;
  score: number;
  baseScore: number;
  personalizationAdjustment: number;
  coveragePercent: number;
  missingCount: number;
  caloriesPerServing: number;
  proteinPerServing: number;
  targetServings: number;
  missingIngredients: unknown[];
  recentlyEaten: boolean;
  reasons: string[];
};

@Injectable()
export class RecommendationRankingService {
  rankRecommendations(recommendations: RankedFoodRecommendation[]) {
    const sorted = [...recommendations].sort(
      (a, b) => b.score - a.score || b.coveragePercent - a.coveragePercent || a.name.localeCompare(b.name),
    );

    const result: RankedFoodRecommendation[] = [];
    const remaining = [...sorted];
    const familyCounts = new Map<string, number>();

    while (remaining.length > 0 && result.length < Math.min(10, sorted.length)) {
      const candidateIndex = result.length < 3
        ? remaining.findIndex((item) => (familyCounts.get(familyKey(item.name)) ?? 0) === 0)
        : 0;
      const selectedIndex = candidateIndex >= 0 ? candidateIndex : 0;
      const [candidate] = remaining.splice(selectedIndex, 1);
      result.push(candidate);
      const family = familyKey(candidate.name);
      familyCounts.set(family, (familyCounts.get(family) ?? 0) + 1);
    }

    return result.map((item, index) => ({ ...item, rank: index + 1 }));
  }
}

function familyKey(name: string): string {
  const tokens = name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !['the', 'with', 'and', 'bowl', 'salad', 'soup', 'plate', 'style'].includes(token));
  return tokens.slice(0, 2).join(' ') || 'unknown';
}
