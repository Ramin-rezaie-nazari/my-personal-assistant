import { Injectable } from '@nestjs/common';

import { BrainDecisionResult, BrainReasoningContext } from '../types';

@Injectable()
export class BrainDecisionService {
  evaluateDecision(context: BrainReasoningContext): BrainDecisionResult {
    const blockers = [...context.reasoning.uncertainties];
    const primaryGoal = context.userContext.goals[0];
    const hasGoal = Boolean(primaryGoal);
    const normalizedInput = context.input.trim().toLowerCase();
    const asksAboutGoal =
      /\b(what(?:'s| is) my (?:primary )?goal|tell me my goal|my goal\??)\b/.test(
        normalizedInput,
      );
    const asksAboutToday =
      /\b(how am i doing today|how(?:'s| is) my day going|today(?:'s)? progress|my progress today|how am i today)\b/.test(
        normalizedInput,
      );

    if (asksAboutGoal && primaryGoal) {
      return {
        canDecide: blockers.length === 0,
        confidence: context.reasoning.confidence,
        blockers,
        intent: 'goal',
        recommendation: `Your current primary goal is: ${primaryGoal.title}`,
        nextAction: 'Use primary goal as personal context',
      };
    }

    if (asksAboutToday) {
      const { dailyStatus } = context.state;
      const dailyBlockers = blockers.filter((blocker) => blocker !== 'missing-goals');

      if (!dailyStatus.hasLog) {
        return {
          canDecide: dailyBlockers.length === 0,
          confidence: context.reasoning.confidence,
          blockers: dailyBlockers,
          intent: 'daily-status',
          recommendation: 'I do not have a daily log for today yet. Start tracking today to see your progress here.',
          nextAction: 'Log today activity',
        };
      }

      return {
        canDecide: dailyBlockers.length === 0,
        confidence: context.reasoning.confidence,
        blockers: dailyBlockers,
        intent: 'daily-status',
        recommendation: `Today: ${dailyStatus.calories} kcal, ${dailyStatus.protein} g protein, ${dailyStatus.waterMl} ml water.`,
        nextAction: 'Review today and continue logging',
      };
    }

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
