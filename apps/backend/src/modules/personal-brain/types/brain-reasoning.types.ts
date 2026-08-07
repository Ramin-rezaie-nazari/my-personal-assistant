export type BrainReasoningSignals = {
  hasContext: boolean;
  hasMemories: boolean;
  hasGoals: boolean;
};

export type BrainReasoningResult = {
  confidence: number;
  uncertainties: string[];
  reasoningSummary: string;
};

import { BrainUserContext } from './brain-user-context.types';

export type BrainReasoningInput = {
  input: string;
  userContext: BrainUserContext;
  signals: BrainReasoningSignals;
};
