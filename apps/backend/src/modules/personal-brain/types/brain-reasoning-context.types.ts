import {
  BrainReasoningResult,
  BrainReasoningSignals,
} from './brain-reasoning.types';

export type BrainReasoningContext = {
  input: string;
  state: {
    context: unknown;
    memories: unknown[];
    goals: unknown[];
  };
  signals: BrainReasoningSignals;
  reasoning: BrainReasoningResult;
};
