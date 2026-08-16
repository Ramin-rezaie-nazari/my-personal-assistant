import { Injectable } from '@nestjs/common';
import {
  DecisionActionAdapter,
  DecisionActionAdapterService,
} from './decision-action-adapter.service';
import { DecisionCandidate } from './unified-decision-engine.service';
import { RemindersService } from '../../reminders/services/reminders.service';

@Injectable()
export class ReminderActionAdapter implements DecisionActionAdapter {
  constructor(
    private readonly registry: DecisionActionAdapterService,
    private readonly reminders: RemindersService,
  ) {
    registry.register(this);
  }

  supports(candidate: DecisionCandidate): boolean {
    return (
      candidate.action === 'create_reminder' ||
      candidate.action === 'update_reminder' ||
      candidate.action === 'cancel_reminder'
    );
  }

  async execute(
    candidate: DecisionCandidate,
    context: Record<string, unknown>,
  ) {
    const userId = String(context.userId ?? '');
    if (!userId) throw new Error('Missing userId');
    const input = String(context.input ?? '').trim();
    const contextualState =
      (context.contextualState as Record<string, unknown> | undefined) ?? {};
    const reminderId = String(
      contextualState.targetResourceId ??
        contextualState.targetExecutionId ??
        '',
    );

    if (candidate.action === 'cancel_reminder') {
      if (!reminderId) throw new Error('Missing reminder target');
      return this.reminders.deleteReminder(userId, reminderId);
    }

    const time = this.extractTime(input);
    if (!time)
      throw new Error('Please provide a valid reminder time in HH:MM format');

    if (candidate.action === 'update_reminder') {
      if (!reminderId) throw new Error('Missing reminder target');
      return this.reminders.updateReminder(userId, reminderId, { time });
    }

    const title = this.extractTitle(input);
    return this.reminders.createReminder(userId, {
      title: title || 'Assistant reminder',
      type: 'assistant',
      time,
    });
  }

  private extractTime(input: string): string | null {
    const match = input.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
    return match ? `${match[1].padStart(2, '0')}:${match[2]}` : null;
  }

  private extractTitle(input: string): string {
    return input
      .replace(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g, '')
      .replace(
        /(remind me|set a reminder|create a reminder|یادم بنداز|یادآوری|یادآوریم کن|قرار بده|همون رو|همون|قبلی|اون|این)/gi,
        '',
      )
      .replace(/[.,!?؟،]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
