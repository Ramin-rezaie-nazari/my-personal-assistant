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

export type BrainReasoningInput = {
  input: string;
  signals: BrainReasoningSignals;
};
