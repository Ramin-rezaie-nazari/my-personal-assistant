import { Injectable } from '@nestjs/common';

export type RecommendationCandidate = { id: string; name: string; score: number };

@Injectable()
export class RecommendationRankingService {
  rankRecommendations<T extends RecommendationCandidate>(items: T[], limit = 10) {
    const ranked: T[] = [];
    for (const item of [...items].sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))) {
      if (ranked.length >= Math.max(1, Math.min(limit, 50))) break;
      const duplicateFamily = ranked.some((selected) => this.family(selected.name) === this.family(item.name));
      if (duplicateFamily && ranked.length < 3) continue;
      ranked.push(item);
    }
    for (const item of items) if (ranked.length >= Math.max(1, Math.min(limit, 50))) break; else if (!ranked.some((selected) => selected.id === item.id)) ranked.push(item);
    return ranked;
  }

  private family(name: string) {
    return String(name).toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ').filter(Boolean).slice(0, 2).join(' ');
  }
}
