import { Injectable } from '@nestjs/common';

type DecisionReadiness = {
  ready: boolean;
  score: number;
  reasons: string[];
};

type BrainState = {
  context: unknown;
  memories: unknown[];
  goals: unknown[];
};

@Injectable()
export class DecisionReadinessService {
  evaluate(state: BrainState): DecisionReadiness {
    const reasons: string[] = [];

    if (!state.context) {
      reasons.push('missing-context');
    }

    if (!Array.isArray(state.memories) || state.memories.length === 0) {
      reasons.push('missing-memory');
    }

    if (!Array.isArray(state.goals) || state.goals.length === 0) {
      reasons.push('missing-goals');
    }

    const score = 100 - reasons.length * 25;

    return {
      ready: score >= 75,
      score,
      reasons,
    };
  }
}
