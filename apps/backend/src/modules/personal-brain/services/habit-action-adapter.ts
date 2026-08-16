import { Injectable } from '@nestjs/common';
import {
  DecisionActionAdapter,
  DecisionActionAdapterService,
} from './decision-action-adapter.service';
import { DecisionCandidate } from './unified-decision-engine.service';
import { HabitsService } from '../../habits/services/habits.service';

@Injectable()
export class HabitActionAdapter implements DecisionActionAdapter {
  constructor(
    private readonly registry: DecisionActionAdapterService,
    private readonly habits: HabitsService,
  ) {
    registry.register(this);
  }
  supports(candidate: DecisionCandidate): boolean {
    return ['complete_habit', 'update_habit', 'delete_habit'].includes(
      candidate.action,
    );
  }
  async execute(
    candidate: DecisionCandidate,
    context: Record<string, unknown>,
  ) {
    const userId = String(context.userId ?? '');
    if (!userId) throw new Error('Missing userId');
    const state =
      (context.contextualState as Record<string, unknown> | undefined) ?? {};
    const habitId = String(
      state.targetResourceId ?? state.targetExecutionId ?? '',
    );
    if (!habitId) throw new Error('Missing habit target');
    if (candidate.action === 'complete_habit')
      return this.habits.completeToday(userId, habitId);
    if (candidate.action === 'delete_habit')
      return this.habits.deleteHabit(userId, habitId);
    const target = this.extractTarget(
      this.normalizeDigits(String(context.input ?? '').trim()),
    );
    if (target === null)
      throw new Error('Please provide a valid weekly target between 1 and 7');
    return this.habits.updateHabit(userId, habitId, { targetPerWeek: target });
  }
  private normalizeDigits(input: string) {
    return input.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
  }
  private extractTarget(input: string): number | null {
    const match = input.match(
      /(?:^|\s)([1-7])\s*(?:times?|x|بار|مرتبه)(?=\s|$|\s*(?:per|a)?\s*week|\s*در\s*هفته)/i,
    );
    return match ? Number(match[1]) : null;
  }
}
