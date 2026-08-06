export type BrainDecisionResult = {
  allowed: boolean;
  confidence: number;
  blockers: string[];
  message: string;
};
