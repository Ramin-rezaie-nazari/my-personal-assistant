import { Injectable } from '@nestjs/common';

type DecisionReadiness = {
  ready: boolean;
  score: number;
  reasons: string[];
};

type BrainReasoningSignals = {
  hasContext: boolean;
  hasMemories: boolean;
  hasGoals: boolean;
};

@Injectable()
export class DecisionReadinessService {
  evaluate(signals: BrainReasoningSignals): DecisionReadiness {
    const reasons: string[] = [];

    if (!signals.hasContext) {
      reasons.push('missing-context');
    }

    if (!signals.hasMemories) {
      reasons.push('missing-memory');
    }

    if (!signals.hasGoals) {
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
