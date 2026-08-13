import type { DecisionExplanation } from '../services/decision-explanation.service';

export type BrainDecisionResult = {
  canDecide: boolean;
  confidence: number;
  blockers: string[];

  intent?: string;

  recommendation?: string;

  nextAction?: string;
};

export type BrainDecisionPipelineResult = BrainDecisionResult & {
  message: string;
  explanation?: DecisionExplanation;
};
