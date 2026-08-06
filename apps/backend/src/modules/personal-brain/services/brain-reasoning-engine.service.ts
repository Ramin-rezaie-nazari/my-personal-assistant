import { Injectable } from '@nestjs/common';

type BrainReasoningSignals = {
  hasContext: boolean;
  hasMemories: boolean;
  hasGoals: boolean;
};

type BrainReasoningInput = {
  input: string;
  signals: BrainReasoningSignals;
};

type BrainReasoningResult = {
  confidence: number;
  uncertainties: string[];
  reasoningSummary: string;
};

@Injectable()
export class BrainReasoningEngineService {
  analyze(reasoningContext: BrainReasoningInput): BrainReasoningResult {
    const uncertainties: string[] = [];

    if (!reasoningContext.signals.hasContext) {
      uncertainties.push('missing-context');
    }

    if (!reasoningContext.signals.hasMemories) {
      uncertainties.push('missing-memory');
    }

    if (!reasoningContext.signals.hasGoals) {
      uncertainties.push('missing-goals');
    }

    const confidence = 1 - uncertainties.length / 3;

    return {
      confidence,
      uncertainties,
      reasoningSummary:
        uncertainties.length === 0
          ? 'Brain has enough reasoning signals'
          : 'Brain requires additional information',
    };
  }
}
