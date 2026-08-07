import { BrainReasoningSignals } from './brain-reasoning.types';

export type DecisionReadiness = {
  ready: boolean;
  score: number;
  reasons: string[];
};

export type DecisionReadinessSignals = BrainReasoningSignals;
