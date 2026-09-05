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
    const familyCounts = new Map<string, number>();

    for (const candidate of sorted) {
      const family = familyKey(candidate.name);
      const count = familyCounts.get(family) ?? 0;
      if (result.length < 3 && count >= 1) {
        const laterDifferent = sorted.find(
          (item) => !result.includes(item) && (familyCounts.get(familyKey(item.name)) ?? 0) === 0,
        );
        if (laterDifferent) continue;
      }
      result.push(candidate);
      familyCounts.set(family, count + 1);
    }

    for (const candidate of sorted) {
      if (!result.includes(candidate)) result.push(candidate);
    }

    return result.slice(0, 10).map((item, index) => ({ ...item, rank: index + 1 }));
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
