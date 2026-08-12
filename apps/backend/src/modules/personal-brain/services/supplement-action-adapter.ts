import { Injectable } from '@nestjs/common';
import { DecisionActionAdapter, DecisionActionAdapterService } from './decision-action-adapter.service';
import { DecisionCandidate } from './unified-decision-engine.service';
import { SupplementsService } from '../../supplements/services/supplements.service';

@Injectable()
export class SupplementActionAdapter implements DecisionActionAdapter {
  constructor(
    private readonly registry: DecisionActionAdapterService,
    private readonly supplements: SupplementsService,
  ) {
    registry.register(this);
  }

  supports(candidate: DecisionCandidate): boolean {
    return ['take_supplement', 'update_supplement', 'delete_supplement'].includes(candidate.action);
  }

  async execute(candidate: DecisionCandidate, context: Record<string, unknown>) {
    const userId = String(context.userId ?? '');
    if (!userId) throw new Error('Missing userId');
    const state = (context.contextualState as Record<string, unknown> | undefined) ?? {};
    const supplementId = String(state.targetResourceId ?? state.targetExecutionId ?? '');
    if (!supplementId) throw new Error('Missing supplement target');

    if (candidate.action === 'take_supplement') {
      return this.supplements.takeToday(userId, supplementId);
    }
    if (candidate.action === 'delete_supplement') {
      return this.supplements.deleteSupplement(userId, supplementId);
    }

    const input = String(context.input ?? '').trim();
    const time = this.extractTime(input);
    if (!time) throw new Error('Please provide a valid supplement time in HH:MM format');
    return this.supplements.updateSupplement(userId, supplementId, { scheduledTime: time });
  }

  private extractTime(input: string): string | null {
    const match = input.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
    return match ? `${match[1].padStart(2, '0')}:${match[2]}` : null;
  }
}
