import { Injectable } from '@nestjs/common';

import { BrainReasoningInput, BrainReasoningResult } from '../types';

@Injectable()
export class BrainReasoningEngineService {
  analyze(reasoningContext: BrainReasoningInput): BrainReasoningResult {
    const { signals, userContext, lifeContext } = reasoningContext;
    const uncertainties: string[] = [];
    const factors: BrainReasoningResult['factors'] = [];

    if (!signals.hasContext) uncertainties.push('missing-context');
    if (!signals.hasMemories) uncertainties.push('missing-memory');
    if (!signals.hasGoals) uncertainties.push('missing-goals');
    if (!signals.hasLifeContext) uncertainties.push('missing-life-context');

    const availableSignals = [signals.hasContext, signals.hasMemories, signals.hasGoals, signals.hasLifeContext];
    const baseConfidence = availableSignals.filter(Boolean).length / availableSignals.length;
    let contextScore = signals.lifeContextQuality;

    if (lifeContext) {
      if (lifeContext.habits.completionPercent < 50 && lifeContext.habits.active > 0) {
        contextScore -= 0.08;
        factors.push({ name: 'habit_adherence', impact: -0.08, direction: 'negative', reason: 'Habit completion is currently below 50%.' });
      } else if (lifeContext.habits.completionPercent >= 80 && lifeContext.habits.active > 0) {
        contextScore += 0.06;
        factors.push({ name: 'habit_adherence', impact: 0.06, direction: 'positive', reason: 'Habit completion is currently strong.' });
      }

      if (lifeContext.supplements.remaining > 0) {
        factors.push({ name: 'supplement_state', impact: 0.02, direction: 'positive', reason: 'Supplement schedule is available as additional context.' });
      }

      if (lifeContext.goals.dueSoon > 0) {
        contextScore += 0.07;
        factors.push({ name: 'goal_urgency', impact: 0.07, direction: 'positive', reason: 'At least one active goal is due within seven days.' });
      }

      if (lifeContext.reminders.pending > 5) {
        contextScore -= 0.05;
        factors.push({ name: 'reminder_load', impact: -0.05, direction: 'negative', reason: 'There are many pending reminders.' });
      }
    }

    contextScore = Math.max(0, Math.min(1, Number(contextScore.toFixed(3))));
    const confidence = Math.max(0, Math.min(1, Number(((baseConfidence * 0.65) + (contextScore * 0.35)).toFixed(3))));
    const hasUserGoals = userContext.goals.length > 0;

    let reasoningSummary: string;
    if (hasUserGoals && confidence >= 0.85) {
      reasoningSummary = 'Brain has strong context, active goals, and enough life signals for a context-aware decision';
    } else if (hasUserGoals) {
      reasoningSummary = 'Brain understands active user goals and is using available life context with some uncertainty';
    } else if (confidence >= 0.85) {
      reasoningSummary = 'Brain has strong life context but no active user goals';
    } else {
      reasoningSummary = 'Brain requires additional or fresher information before making a high-confidence decision';
    }

    return { confidence, uncertainties, reasoningSummary, contextScore, factors };
  }
}
