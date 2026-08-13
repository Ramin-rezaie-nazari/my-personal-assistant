import { Injectable } from '@nestjs/common';

export type DecisionLearningSignal = {
  stable: boolean;
  confidenceBoost: number;
  repeatedReasons: Array<{ reason: string; count: number }>;
  selectedFrequency: Array<{ id: string; count: number }>;
};

@Injectable()
export class DecisionLearningPolicyService {
  apply(baseConfidence: number, signal?: DecisionLearningSignal): { confidence: number; historicalReasons: string[] } {
    if (!signal?.stable || signal.selectedFrequency.length === 0) {
      return { confidence: baseConfidence, historicalReasons: [] };
    }

    const boost = Math.min(0.04, Math.max(0, signal.confidenceBoost || 0));
    const confidence = Math.min(0.99, Math.max(0, baseConfidence + boost));
    const historicalReasons = signal.repeatedReasons.slice(0, 3).map(({ reason, count }) => `A similar decision pattern has repeated ${count} times: ${reason}.`);
    return { confidence, historicalReasons };
  }
}
