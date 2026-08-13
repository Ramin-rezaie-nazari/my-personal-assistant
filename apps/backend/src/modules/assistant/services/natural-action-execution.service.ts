import { Injectable } from '@nestjs/common';

import { BrainResponse } from '../../personal-brain/types';
import { DecisionExecutionCoordinatorService } from '../../personal-brain/services/decision-execution-coordinator.service';
import { DecisionCandidate } from '../../personal-brain/services/unified-decision-engine.service';

export type NaturalActionExecution = {
  executed: boolean;
  action: string;
  message: string;
  intent: string;
  receipt?: unknown;
};

@Injectable()
export class NaturalActionExecutionService {
  constructor(private readonly coordinator: DecisionExecutionCoordinatorService) {}

  async execute(input: string, userId: string, response: BrainResponse, contextualState: Record<string, unknown> = {}): Promise<NaturalActionExecution> {
    if (!response.nextAction) return { executed: false, action: 'none', message: 'No executable action was selected.', intent: response.intent };
    const candidate: DecisionCandidate = { id: this.buildId(userId, input, response.nextAction), domain: this.domainFor(response.intent), action: response.nextAction, score: response.confidence, confidence: response.confidence, source: 'natural-language' };
    const receipt = await this.coordinator.execute(userId, candidate, { userId, source: 'natural-language', input, contextualState });
    return this.fromReceipt(candidate, response.intent, receipt);
  }

  async confirm(userId: string, token: string) {
    return this.coordinator.confirmAndExecute(userId, token);
  }

  private fromReceipt(candidate: DecisionCandidate, intent: string, receipt: any): NaturalActionExecution {
    if (receipt.status === 'completed') return { executed: true, action: candidate.action, message: 'Done. I completed that action.', intent, receipt };
    if (receipt.status === 'pending_confirmation') return { executed: false, action: candidate.action, message: 'I can do that, but I need your confirmation first.', intent, receipt };
    if (receipt.status === 'blocked') return { executed: false, action: candidate.action, message: 'I did not execute that action because a safety rule blocked it.', intent, receipt };
    if (receipt.status === 'unsupported') return { executed: false, action: candidate.action, message: 'I understood what you want, but that action is not connected yet.', intent, receipt };
    return { executed: false, action: candidate.action, message: receipt.reason || 'I could not complete that action safely.', intent, receipt };
  }

  private buildId(userId: string, input: string, action: string): string {
    let hash = 2166136261;
    for (const char of `${userId}:${action}:${input.trim().toLowerCase()}`) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
    return `nl-${(hash >>> 0).toString(16)}`;
  }

  private domainFor(intent: string): DecisionCandidate['domain'] {
    const value = intent.toLowerCase();
    if (value.includes('workout') || value.includes('exercise') || value.includes('training')) return 'workout';
    if (value.includes('reminder')) return 'reminder';
    if (value.includes('notification')) return 'notification';
    if (value.includes('habit')) return 'habit';
    if (value.includes('nutrition') || value.includes('meal') || value.includes('food')) return 'nutrition';
    if (value.includes('schedule') || value.includes('calendar')) return 'schedule';
    return 'conversation';
  }
}
