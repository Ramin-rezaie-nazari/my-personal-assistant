import { BrainDecisionResult } from '../services/brain-decision.service';
import { BrainReasoningContext } from './brain-reasoning-context.types';

export type BrainResponse = {
  input: string;
  reasoningContext: BrainReasoningContext;
  decision: BrainDecisionResult & {
    message: string;
  };
};
