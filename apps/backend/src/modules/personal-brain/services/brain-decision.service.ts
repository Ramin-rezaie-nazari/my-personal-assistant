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
    const asksAboutWeek =
      /\b(how did i do this week|how am i doing this week|weekly progress|this week(?:'s)? progress|how was my week|how did my week go)\b/.test(
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

    if (asksAboutWeek) {
      const weeklyStatus = context.state.weeklyStatus;
      const weeklyBlockers = blockers.filter((blocker) => blocker !== 'missing-goals');

      if (weeklyStatus.loggedDays === 0) {
        return {
          canDecide: weeklyBlockers.length === 0,
          confidence: context.reasoning.confidence,
          blockers: weeklyBlockers,
          intent: 'weekly-status',
          recommendation: 'You have not logged any days this week yet. Start tracking today and I will build your weekly progress view.',
          nextAction: 'Log today activity',
        };
      }

      return {
        canDecide: weeklyBlockers.length === 0,
        confidence: context.reasoning.confidence,
        blockers: weeklyBlockers,
        intent: 'weekly-status',
        recommendation: `This week: ${weeklyStatus.loggedDays}/7 days logged, ${weeklyStatus.totalCalories} kcal, ${weeklyStatus.totalProtein} g protein, ${weeklyStatus.totalWaterMl} ml water. Current streak: ${weeklyStatus.currentStreak} days.`,
        nextAction: 'Review weekly progress and continue logging',
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
