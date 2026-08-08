import { Injectable } from '@nestjs/common';

import { BrainReasoningInput, BrainReasoningResult } from '../types';

@Injectable()
export class BrainReasoningEngineService {
  analyze(reasoningContext: BrainReasoningInput): BrainReasoningResult {
    const { signals, userContext } = reasoningContext;

    const uncertainties: string[] = [];

    if (!signals.hasContext) {
      uncertainties.push('missing-context');
    }

    if (!signals.hasMemories) {
      uncertainties.push('missing-memory');
    }

    if (!signals.hasGoals) {
      uncertainties.push('missing-goals');
    }

    const availableSignals = [
      signals.hasContext,
      signals.hasMemories,
      signals.hasGoals,
    ];

    const availableSignalCount = availableSignals.filter(Boolean).length;
    const confidence = availableSignalCount / availableSignals.length;

    const hasUserGoals = userContext.goals.length > 0;

    let reasoningSummary: string;

    if (hasUserGoals && confidence >= 1) {
      reasoningSummary = 'Brain has complete context and active user goals';
    } else if (hasUserGoals) {
      reasoningSummary =
        'Brain understands active user goals but needs more information';
    } else if (confidence >= 1) {
      reasoningSummary =
        'Brain has enough reasoning signals but no active user goals';
    } else {
      reasoningSummary = 'Brain requires additional information';
    }

    return {
      confidence,
      uncertainties,
      reasoningSummary,
    };
  }
}
