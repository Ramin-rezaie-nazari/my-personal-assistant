import { BrainUserContext } from './brain-user-context.types';

export type BrainReasoningSignals = {
  hasContext: boolean;

  hasMemories: boolean;

  hasGoals: boolean;

  memoryCount: number;

  goalCount: number;

  contextSource?: string;
};

export type BrainReasoningInput = {
  input: string;

  userContext: BrainUserContext;

  signals: BrainReasoningSignals;
};

export type BrainReasoningResult = {
  confidence: number;

  uncertainties: string[];

  reasoningSummary: string;
};
