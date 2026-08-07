import {
  BrainReasoningResult,
  BrainReasoningSignals,
} from './brain-reasoning.types';
import { BrainUserContext } from './brain-user-context.types';

export type BrainReasoningContext = {
  input: string;
  userContext: BrainUserContext;
  state: {
    context: unknown;
    memories: unknown[];
    goals: unknown[];
  };
  signals: BrainReasoningSignals;
  reasoning: BrainReasoningResult;
};
