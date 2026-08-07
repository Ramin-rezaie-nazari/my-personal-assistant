export type BrainDecisionResult = {
  canDecide: boolean;
  confidence: number;
  blockers: string[];
};

export type BrainDecisionPipelineResult = BrainDecisionResult & {
  message: string;
};
