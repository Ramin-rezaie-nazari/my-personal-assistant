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
    const asksAboutWorkout =
      /\b(workout|workouts|exercise|exercised|fitness|training|gym|how often did i work out|how much did i exercise|how is my fitness progress|how am i doing with exercise)\b/.test(
        normalizedInput,
      );
    const asksAboutHabits =
      /\b(habit|habits|streak|streaks|routine|routines|how consistent am i|how consistent are my habits)\b/.test(
        normalizedInput,
      );
    const asksAboutReminders =
      /\b(reminder|reminders|what(?:'s| is) next|what do i need to do next|upcoming reminder|next reminder)\b/.test(
        normalizedInput,
      );
    const asksAboutSupplements =
      /\b(supplement|supplements|vitamin|vitamins|did i take my supplement|have i taken my supplements|what supplement is next)\b/.test(
        normalizedInput,
      );

    if (asksAboutGoal && primaryGoal) {
      return {
        canDecide: blockers.length === 0,
        confidence: context.reasoning.confidence,
        blockers,
        intent: 'goal',
        recommendation: `Your current primary goal is: ${primaryGoal.title}`,
        nextAction: undefined,
      };
    }

    if (asksAboutTargets) {
      const targets = context.state.nutritionTargets;
      const dailyStatus = context.state.dailyStatus;
      const targetBlockers = blockers.filter(
        (blocker) => blocker !== 'missing-goals',
      );
      if (!targets?.hasTargets) {
        return {
          canDecide: targetBlockers.length === 0,
          confidence: context.reasoning.confidence,
          blockers: targetBlockers,
          intent: 'nutrition-targets',
          recommendation:
            'I do not have your nutrition targets yet. Set your daily calorie, protein, or water goals and I can track your progress against them.',
          nextAction: undefined,
        };
      }
      const parts: string[] = [];
      const remaining: string[] = [];
      if (targets.dailyCaloriesGoal !== undefined) {
        parts.push(`${dailyStatus.calories}/${targets.dailyCaloriesGoal} kcal`);
        remaining.push(
          `${Math.max(targets.dailyCaloriesGoal - dailyStatus.calories, 0)} kcal`,
        );
      }
      if (targets.proteinGoalGrams !== undefined) {
        parts.push(
          `${dailyStatus.protein}/${targets.proteinGoalGrams} g protein`,
        );
        remaining.push(
          `${Math.max(targets.proteinGoalGrams - dailyStatus.protein, 0)} g protein`,
        );
      }
      if (targets.waterGoalMl !== undefined) {
        parts.push(`${dailyStatus.waterMl}/${targets.waterGoalMl} ml water`);
        remaining.push(
          `${Math.max(targets.waterGoalMl - dailyStatus.waterMl, 0)} ml water`,
        );
      }
      return {
        canDecide: targetBlockers.length === 0,
        confidence: context.reasoning.confidence,
        blockers: targetBlockers,
        intent: 'nutrition-targets',
        recommendation: `Today: ${parts.join(', ')}. Remaining: ${remaining.join(', ')}.`,
        nextAction: undefined,
      };
    }

    if (asksAboutHabits) {
      const life = context.state.lifeContext;
      if (!life)
        return {
          canDecide: false,
          confidence: context.reasoning.confidence,
          blockers: [...blockers, 'missing-life-context'],
          intent: 'habit-status',
          recommendation: 'I do not have your habit progress available yet.',
          nextAction: undefined,
        };
      if (life.habits.active === 0)
        return {
          canDecide: blockers.length === 0,
          confidence: context.reasoning.confidence,
          blockers,
          intent: 'habit-status',
          recommendation:
            'You do not have any active habits yet. Add one small habit and I can track completions and streaks for you.',
          nextAction: undefined,
        };
      const weakest = [...life.habits.items].sort(
        (a, b) =>
          a.completedThisWeek / Math.max(a.targetPerWeek, 1) -
          b.completedThisWeek / Math.max(b.targetPerWeek, 1),
      )[0];
      const detail = weakest
        ? ` Your weakest habit this week is ${weakest.name} (${weakest.completedThisWeek}/${weakest.targetPerWeek}), with a ${weakest.streak}-day streak.`
        : '';
      return {
        canDecide: blockers.length === 0,
        confidence: context.reasoning.confidence,
        blockers,
        intent: 'habit-status',
        recommendation: `Habits: ${life.habits.active} active, ${life.habits.completedThisWeek} completions this week, ${life.habits.completionPercent}% completion, best current streak ${life.habits.currentStreak} days.${detail}`,
        nextAction: undefined,
      };
    }

    if (asksAboutReminders) {
      const life = context.state.lifeContext;
      if (!life)
        return {
          canDecide: false,
          confidence: context.reasoning.confidence,
          blockers: [...blockers, 'missing-life-context'],
          intent: 'reminders',
          recommendation: 'I do not have your reminders available yet.',
          nextAction: undefined,
        };
      if (!life.reminders.next)
        return {
          canDecide: blockers.length === 0,
          confidence: context.reasoning.confidence,
          blockers,
          intent: 'reminders',
          recommendation: life.reminders.pending
            ? `You have ${life.reminders.pending} pending reminders, but nothing scheduled next.`
            : 'You have no pending reminders right now.',
          nextAction: undefined,
        };
      const next = life.reminders.next;
      return {
        canDecide: blockers.length === 0,
        confidence: context.reasoning.confidence,
        blockers,
        intent: 'reminders',
        recommendation: `Your next reminder is “${next.title}” (${next.type}) at ${new Date(next.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. You have ${life.reminders.pending} pending reminders.`,
        nextAction: undefined,
      };
    }

    if (asksAboutSupplements) {
      const life = context.state.lifeContext;
      if (!life)
        return {
          canDecide: false,
          confidence: context.reasoning.confidence,
          blockers: [...blockers, 'missing-life-context'],
          intent: 'supplements',
          recommendation: 'I do not have your supplement status available yet.',
          nextAction: undefined,
        };
      if (life.supplements.total === 0)
        return {
          canDecide: blockers.length === 0,
          confidence: context.reasoning.confidence,
          blockers,
          intent: 'supplements',
          recommendation: 'You have no active supplements tracked yet.',
          nextAction: undefined,
        };
      const next = life.supplements.next
        ? ` Next: ${life.supplements.next.name}${life.supplements.next.dosage ? ` (${life.supplements.next.dosage})` : ''} at ${life.supplements.next.scheduledTime}.`
        : ' All tracked supplements are taken for today.';
      return {
        canDecide: blockers.length === 0,
        confidence: context.reasoning.confidence,
        blockers,
        intent: 'supplements',
        recommendation: `Today: ${life.supplements.taken}/${life.supplements.total} supplements taken (${life.supplements.completionPercent}%).${next}`,
        nextAction: undefined,
      };
    }

    if (asksAboutWorkout) {
      const workoutStatus = context.state.workoutStatus;
      const workoutBlockers = blockers.filter(
        (blocker) => blocker !== 'missing-goals',
      );
      if (!workoutStatus)
        return {
          canDecide: false,
          confidence: context.reasoning.confidence,
          blockers: [...workoutBlockers, 'missing-workout-status'],
          intent: 'workout-status',
          recommendation: 'I do not have your workout progress data yet.',
          nextAction: undefined,
        };
      if (workoutStatus.workoutCount === 0)
        return {
          canDecide: workoutBlockers.length === 0,
          confidence: context.reasoning.confidence,
          blockers: workoutBlockers,
          intent: 'workout-status',
          recommendation:
            'You have not logged a workout in the last seven days. Start logging your exercise and I will track consistency, minutes, and calories burned.',
          nextAction: undefined,
        };
      const lastWorkout = workoutStatus.lastWorkout
        ? ` Last workout: ${workoutStatus.lastWorkout.name} (${workoutStatus.lastWorkout.type}).`
        : '';
      return {
        canDecide: workoutBlockers.length === 0,
        confidence: context.reasoning.confidence,
        blockers: workoutBlockers,
        intent: 'workout-status',
        recommendation: `This week: ${workoutStatus.workoutCount} workouts across ${workoutStatus.activeDays} active days, ${workoutStatus.totalMinutes} minutes, ${workoutStatus.totalCaloriesBurned} kcal burned, ${workoutStatus.consistencyPercent}% consistency, current streak ${workoutStatus.currentStreak} days.${lastWorkout}`,
        nextAction: undefined,
      };
    }

    if (asksAboutWeek) {
      const weeklyStatus = context.state.weeklyStatus;
      const weeklyBlockers = blockers.filter(
        (blocker) => blocker !== 'missing-goals',
      );
      if (!weeklyStatus)
        return {
          canDecide: false,
          confidence: context.reasoning.confidence,
          blockers: [...weeklyBlockers, 'missing-weekly-status'],
          intent: 'weekly-status',
          recommendation: 'I do not have your weekly progress data yet.',
          nextAction: undefined,
        };
      if (weeklyStatus.loggedDays === 0)
        return {
          canDecide: weeklyBlockers.length === 0,
          confidence: context.reasoning.confidence,
          blockers: weeklyBlockers,
          intent: 'weekly-status',
          recommendation:
            'You have not logged any days this week yet. Start tracking today and I will build your weekly progress view.',
          nextAction: undefined,
        };
      return {
        canDecide: weeklyBlockers.length === 0,
        confidence: context.reasoning.confidence,
        blockers: weeklyBlockers,
        intent: 'weekly-status',
        recommendation: `This week: ${weeklyStatus.loggedDays}/7 days logged (${weeklyStatus.consistencyPercent}% consistency), ${weeklyStatus.totalCalories} kcal, ${weeklyStatus.totalProtein} g protein, ${weeklyStatus.totalWaterMl} ml water. Current streak: ${weeklyStatus.currentStreak} days.`,
        nextAction: undefined,
      };
    }

    if (asksAboutToday) {
      const { dailyStatus } = context.state;
      const dailyBlockers = blockers.filter(
        (blocker) => blocker !== 'missing-goals',
      );
      if (!dailyStatus.hasLog)
        return {
          canDecide: dailyBlockers.length === 0,
          confidence: context.reasoning.confidence,
          blockers: dailyBlockers,
          intent: 'daily-status',
          recommendation:
            'I do not have a daily log for today yet. Start tracking today to see your progress here.',
          nextAction: undefined,
        };
      return {
        canDecide: dailyBlockers.length === 0,
        confidence: context.reasoning.confidence,
        blockers: dailyBlockers,
        intent: 'daily-status',
        recommendation: `Today: ${dailyStatus.calories} kcal, ${dailyStatus.protein} g protein, ${dailyStatus.waterMl} ml water.`,
        nextAction: undefined,
      };
    }

    const persian = /[\u0600-\u06ff]/u.test(context.input);
    return {
      canDecide: false,
      confidence: context.reasoning.confidence,
      blockers: hasGoal ? blockers : [...blockers, 'missing-primary-goal'],
      intent: 'conversation',
      recommendation: persian
        ? 'باشه 🌷 من اینجام. بگو دقیقاً دوست داری چه کمکی ازم بگیری.'
        : 'I’m here. Tell me what you would like me to help you with.',
      nextAction: undefined,
    };
  }
}
