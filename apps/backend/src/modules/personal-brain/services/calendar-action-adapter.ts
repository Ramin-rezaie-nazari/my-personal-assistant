import { Injectable } from '@nestjs/common';
import { DecisionActionAdapter, DecisionActionAdapterService } from './decision-action-adapter.service';
import { DecisionCandidate } from './unified-decision-engine.service';
import { CalendarService } from '../../calendar/services/calendar.service';

@Injectable()
export class CalendarActionAdapter implements DecisionActionAdapter {
  constructor(
    private readonly registry: DecisionActionAdapterService,
    private readonly calendar: CalendarService,
  ) {
    registry.register(this);
  }

  supports(candidate: DecisionCandidate): boolean {
    return candidate.action === 'update_calendar_event' || candidate.action === 'cancel_calendar_event';
  }

  async execute(candidate: DecisionCandidate, context: Record<string, unknown>) {
    const userId = String(context.userId ?? '');
    if (!userId) throw new Error('Missing userId');
    const state = (context.contextualState as Record<string, unknown> | undefined) ?? {};
    const eventId = String(state.targetResourceId ?? state.targetExecutionId ?? '');
    if (!eventId) throw new Error('Missing calendar event target');

    if (candidate.action === 'cancel_calendar_event') {
      return this.calendar.completeEvent(userId, eventId);
    }

    const input = String(context.input ?? '').trim();
    const time = this.extractTime(input);
    if (!time) throw new Error('Please provide a valid calendar time in HH:MM format');
    return this.calendar.updateEventTime(userId, eventId, time);
  }

  private extractTime(input: string): string | null {
    const match = input.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
    return match ? `${match[1].padStart(2, '0')}:${match[2]}` : null;
  }
}
