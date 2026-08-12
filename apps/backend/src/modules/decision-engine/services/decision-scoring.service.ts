import { Injectable } from '@nestjs/common';

export type ActionCandidate = {
  type: string;
  title: string;
  reason: string;
  score: number;
  urgency: 'low' | 'medium' | 'high';
  source: string;
};

@Injectable()
export class DecisionScoringService {
  rank(candidates: ActionCandidate[]) {
    return [...candidates]
      .sort((a, b) => b.score - a.score)
      .map((candidate, index) => ({ ...candidate, rank: index + 1 }));
  }
}
