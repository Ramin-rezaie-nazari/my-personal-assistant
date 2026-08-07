import { Injectable } from '@nestjs/common';

import { BrainDecisionResult, BrainReasoningContext } from '../types';

@Injectable()
export class BrainDecisionService {
  evaluateDecision(context: BrainReasoningContext): BrainDecisionResult {
    const blockers = [...context.reasoning.uncertainties];

    const primaryGoal = context.userContext.goals[0];

    const hasGoal = Boolean(primaryGoal);

    return {
      canDecide: blockers.length === 0 && hasGoal,
      confidence: context.reasoning.confidence,
      blockers: hasGoal ? blockers : [...blockers, 'missing-primary-goal'],
      intent: primaryGoal?.category ?? 'general',
      recommendation: primaryGoal
        ? `Support user goal: ${primaryGoal.title}`
        : 'Understand user objective first',
      nextAction: primaryGoal
        ? 'Provide goal-specific guidance'
        : 'Ask user about desired outcome',
    };
  }
}
