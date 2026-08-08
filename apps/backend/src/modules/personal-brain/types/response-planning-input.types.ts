import { BrainDecisionResult } from './brain-decision.types';
import { BrainReasoningContext } from './brain-reasoning-context.types';

export type ResponsePlanningInput = {
  decision: BrainDecisionResult;

  reasoningContext: BrainReasoningContext;
};
