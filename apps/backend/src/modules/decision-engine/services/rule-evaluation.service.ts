import { Injectable } from '@nestjs/common';
import { BrainLifeContext } from '../../personal-brain/types';
import { ActionCandidate } from './decision-scoring.service';

@Injectable()
export class RuleEvaluationService {
  evaluate(context: BrainLifeContext): ActionCandidate[] {
    const candidates: ActionCandidate[] = [];

    if (context.goals.next) {
      const goal = context.goals.next;
      const dueBoost = goal.daysRemaining !== null && goal.daysRemaining <= 3 ? 30 : goal.daysRemaining !== null && goal.daysRemaining <= 7 ? 15 : 0;
      const progressBoost = Math.max(0, 25 - goal.progressPercent / 4);
      candidates.push({
        type: 'goal_action',
        title: `Move forward: ${goal.title}`,
        reason: goal.daysRemaining !== null && goal.daysRemaining <= 7 ? `This goal is due in ${goal.daysRemaining} day${goal.daysRemaining === 1 ? '' : 's'}.` : `Your highest-priority active goal is at ${goal.progressPercent}% progress.`,
        score: 45 + (3 - Math.min(goal.priority, 3)) * 10 + dueBoost + progressBoost,
        urgency: goal.daysRemaining !== null && goal.daysRemaining <= 3 ? 'high' : 'medium',
        source: 'goals',
      });
    }

    if (context.reminders.next) {
      candidates.push({
        type: 'reminder_action',
        title: context.reminders.next.title,
        reason: 'You have an upcoming scheduled reminder.',
        score: 62,
        urgency: 'high',
        source: 'reminders',
      });
    }

    if (context.supplements.next) {
      candidates.push({
        type: 'supplement_action',
        title: `Take ${context.supplements.next.name}`,
        reason: context.supplements.next.dosage ? `Scheduled dose: ${context.supplements.next.dosage}.` : 'This supplement is still pending today.',
        score: 58,
        urgency: 'medium',
        source: 'supplements',
      });
    }

    if (context.habits.active > 0 && context.habits.completionPercent < 50) {
      candidates.push({
        type: 'habit_action',
        title: 'Complete one small habit',
        reason: `Habit completion is at ${context.habits.completionPercent}% this week.`,
        score: 52 + Math.min(20, 50 - context.habits.completionPercent),
        urgency: 'medium',
        source: 'habits',
      });
    }

    return candidates;
  }
}
