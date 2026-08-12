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
    const asksAboutTargets =
      /\b(am i on track|am i on target|how am i doing with my (?:nutrition|calories|protein|water)|how much (?:calories|protein|water) do i have left|what do i have left today)\b/.test(
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

    if (asksAboutTargets) {
      const targets = context.state.nutritionTargets;
      const dailyStatus = context.state.dailyStatus;
      const targetBlockers = blockers.filter((blocker) => blocker !== 'missing-goals');

      if (!targets?.hasTargets) {
        return {
          canDecide: targetBlockers.length === 0,
          confidence: context.reasoning.confidence,
          blockers: targetBlockers,
          intent: 'nutrition-targets',
          recommendation: 'I do not have your nutrition targets yet. Set your daily calorie, protein, or water goals and I can track your progress against them.',
          nextAction: 'Set nutrition targets',
        };
      }

      const parts: string[] = [];
      const remaining: string[] = [];

      if (targets.dailyCaloriesGoal !== undefined) {
        parts.push(`${dailyStatus.calories}/${targets.dailyCaloriesGoal} kcal`);
        remaining.push(`${Math.max(targets.dailyCaloriesGoal - dailyStatus.calories, 0)} kcal`);
      }
      if (targets.proteinGoalGrams !== undefined) {
        parts.push(`${dailyStatus.protein}/${targets.proteinGoalGrams} g protein`);
        remaining.push(`${Math.max(targets.proteinGoalGrams - dailyStatus.protein, 0)} g protein`);
      }
      if (targets.waterGoalMl !== undefined) {
        parts.push(`${dailyStatus.waterMl}/${targets.waterGoalMl} ml water`);
        remaining.push(`${Math.max(targets.waterGoalMl - dailyStatus.waterMl, 0)} ml water`);
      }

      return {
        canDecide: targetBlockers.length === 0,
        confidence: context.reasoning.confidence,
        blockers: targetBlockers,
        intent: 'nutrition-targets',
        recommendation: `Today: ${parts.join(', ')}. Remaining: ${remaining.join(', ')}.`,
        nextAction: 'Continue logging against today targets',
      };
    }

    if (asksAboutWeek) {
      const weeklyStatus = context.state.weeklyStatus;
      const weeklyBlockers = blockers.filter((blocker) => blocker !== 'missing-goals');

      if (!weeklyStatus) {
        return {
          canDecide: false,
          confidence: context.reasoning.confidence,
          blockers: [...weeklyBlockers, 'missing-weekly-status'],
          intent: 'weekly-status',
          recommendation: 'I do not have your weekly progress data yet.',
          nextAction: 'Load weekly progress',
        };
      }

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
        recommendation: `This week: ${weeklyStatus.loggedDays}/7 days logged (${weeklyStatus.consistencyPercent}% consistency), ${weeklyStatus.totalCalories} kcal, ${weeklyStatus.totalProtein} g protein, ${weeklyStatus.totalWaterMl} ml water. Current streak: ${weeklyStatus.currentStreak} days.`,
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
