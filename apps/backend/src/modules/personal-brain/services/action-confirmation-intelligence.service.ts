import { Injectable } from '@nestjs/common';
import { DecisionCandidate } from './unified-decision-engine.service';

export type ConfirmationRequirement = 'never' | 'confirm';

export type ActionConfirmation = {
  required: boolean;
  requirement: ConfirmationRequirement;
  reason: string;
  token?: string;
};

@Injectable()
export class ActionConfirmationIntelligenceService {
  private readonly pending = new Map<string, { token: string; expiresAt: number }>();

  assess(userId: string, candidate: DecisionCandidate, context: Record<string, unknown> = {}, now = Date.now()): ActionConfirmation {
    const action = candidate.action.toLowerCase();
    const explicitConfirmation = context.confirmed === true;
    if (explicitConfirmation) return { required: false, requirement: 'never', reason: 'user_confirmed' };

    const destructive = /delete|remove|cancel/.test(action);
    const financial = candidate.domain === 'shopping' || /purchase|buy|payment|checkout/.test(action);
    const sensitive = /health|medication|supplement|medical/.test(action) && /delete|change|take/.test(action);
    const externalImpact = /calendar|reminder|notification/.test(candidate.domain) && destructive;

    if (destructive || financial || sensitive || externalImpact) {
      const token = this.buildToken(userId, candidate);
      this.pending.set(token, { token, expiresAt: now + 5 * 60_000 });
      return {
        required: true,
        requirement: 'confirm',
        reason: financial ? 'financial_action' : sensitive ? 'sensitive_action' : destructive ? 'destructive_action' : 'external_impact',
        token,
      };
    }

    return { required: false, requirement: 'never', reason: 'low_risk_action' };
  }

  confirm(userId: string, token: string, now = Date.now()): boolean {
    const key = `${userId}:${token}`;
    const value = this.pending.get(key);
    if (!value || value.expiresAt < now) {
      this.pending.delete(key);
      return false;
    }
    this.pending.delete(key);
    return true;
  }

  private buildToken(userId: string, candidate: DecisionCandidate): string {
    let hash = 2166136261;
    for (const char of `${userId}:${candidate.id}:${candidate.action}`) {
      hash ^= char.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return `confirm-${(hash >>> 0).toString(16)}`;
  }
}
