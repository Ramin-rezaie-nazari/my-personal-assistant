import { Injectable } from '@nestjs/common';

export type RankedRecommendation = {
  recipeId: string;
  name: string;
  score: number;
  familyKey: string;
  reasons: string[];
  scoreBreakdown: Record<string, number>;
  missingCount: number;
  missingIngredients: unknown[];
  caloriesPerServing: number;
  proteinPerServing: number;
};

@Injectable()
export class RecommendationRankingService {
  rankRecommendations(
    candidates: RankedRecommendation[],
    limit = 5,
  ): RankedRecommendation[] {
    const remaining = [...candidates].sort(
      (a, b) => b.score - a.score || a.name.localeCompare(b.name),
    );
    const selected: RankedRecommendation[] = [];

    while (remaining.length > 0 && selected.length < limit) {
      const previousFamily = selected.at(-1)?.familyKey;
      const nextIndex =
        remaining.findIndex((candidate) => candidate.familyKey !== previousFamily) ??
        -1;
      const index = nextIndex >= 0 ? nextIndex : 0;
      selected.push(remaining.splice(index, 1)[0]);
    }

    return selected;
  }

  static familyKey(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .join(' ');
  }
}
