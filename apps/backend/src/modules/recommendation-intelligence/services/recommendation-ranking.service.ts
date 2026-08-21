import { Injectable } from '@nestjs/common';

export type RankedFoodRecommendation = {
  recipeId: string;
  name: string;
  score: number;
  decision: 'strong_match' | 'good_match' | 'fallback';
  reasons: string[];
  breakdown: Record<string, number>;
  targetServings: number;
  caloriesPerServing: number;
  proteinPerServing: number;
  missingIngredients: Array<{ foodId: string; name: string; quantity: number; unit: string }>;
};

@Injectable()
export class RecommendationRankingService {
  rankRecommendations(items: RankedFoodRecommendation[], limit = 10): RankedFoodRecommendation[] {
    const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 30);
    const sorted = [...items].sort((a, b) => b.score - a.score || b.breakdown.inventory - a.breakdown.inventory || a.name.localeCompare(b.name));
    const result: RankedFoodRecommendation[] = [];
    const seen = new Set<string>();
    const diversityWindow = Math.max(3, Math.floor(safeLimit * 0.6));

    for (const item of sorted) {
      const family = familyKey(item.name);
      if (seen.has(family) && result.length < diversityWindow) continue;
      result.push(item);
      seen.add(family);
      if (result.length >= safeLimit) break;
    }

    if (result.length < safeLimit) {
      for (const item of sorted) {
        if (result.some((existing) => existing.recipeId === item.recipeId)) continue;
        result.push(item);
        if (result.length >= safeLimit) break;
      }
    }

    return result;
  }
}

function familyKey(name: string): string {
  return String(name || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\b(with|and|or|style|easy|classic|recipe)\b/g, ' ')
    .replace(/[^a-z0-9آ-ی]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 3)
    .join(' ');
}
