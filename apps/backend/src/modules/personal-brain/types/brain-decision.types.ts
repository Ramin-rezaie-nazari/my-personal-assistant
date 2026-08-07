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
};
