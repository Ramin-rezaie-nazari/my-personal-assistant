import { Injectable } from '@nestjs/common';

export type LocalPlanStep = {
  index: number;
  intent: 'create' | 'update' | 'cancel' | 'unknown';
  clause: string;
  dependsOn?: number;
  requiresConfirmation: boolean;
};

export type LocalActionPlan = {
  steps: LocalPlanStep[];
  requiresClarification: boolean;
  reason?: string;
};

@Injectable()
export class PlanningService {
  async createPlan(input?: {
    clauses?: string[];
    intents?: Array<'create' | 'update' | 'cancel' | 'unknown'>;
    contradictions?: string[];
    confidence?: number;
  }): Promise<LocalActionPlan> {
    const clauses = input?.clauses ?? [];
    const intents = input?.intents ?? [];
    const contradictions = input?.contradictions ?? [];
    const confidence = input?.confidence ?? 0;

    if (contradictions.length) {
      return { steps: [], requiresClarification: true, reason: 'conflicting_request' };
    }
    if (confidence > 0 && confidence < 0.55) {
      return { steps: [], requiresClarification: true, reason: 'low_confidence' };
    }

    const steps = clauses.map((clause, index) => ({
      index,
      intent: intents[index] ?? 'unknown',
      clause,
      requiresConfirmation: (intents[index] ?? 'unknown') === 'cancel',
      ...(index > 0 && intents[index] === 'update' && intents[index - 1] === 'create' ? { dependsOn: index - 1 } : {}),
    })).filter((step) => step.intent !== 'unknown');

    return {
      steps,
      requiresClarification: steps.length === 0 && clauses.length > 0,
      reason: steps.length === 0 && clauses.length > 0 ? 'no_actionable_intent' : undefined,
    };
  }
}
