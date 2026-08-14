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

    const steps = clauses.map((clause, index) => {
      const intent = intents[index] ?? 'unknown';
      const previousIntent = index > 0 ? intents[index - 1] : undefined;
      const referencesPreviousStep = /\b(?:همون|همین|اینو|اونو|قبلی|previous|same|it|that)\b/i.test(clause);
      const dependsOn = index > 0 && (
        (intent === 'update' && previousIntent === 'create') ||
        referencesPreviousStep
      ) ? index - 1 : undefined;

      return {
        index,
        intent,
        clause,
        ...(dependsOn !== undefined ? { dependsOn } : {}),
        requiresConfirmation: intent === 'cancel',
      };
    }).filter((step) => step.intent !== 'unknown');

    if (clauses.length > 1 && steps.length !== clauses.filter((_, index) => (intents[index] ?? 'unknown') !== 'unknown').length) {
      return { steps, requiresClarification: true, reason: 'partially_understood_request' };
    }

    if (steps.some((step) => step.dependsOn !== undefined && step.dependsOn >= step.index)) {
      return { steps: [], requiresClarification: true, reason: 'invalid_plan_dependency' };
    }

    return {
      steps,
      requiresClarification: steps.length === 0 && clauses.length > 0,
      reason: steps.length === 0 && clauses.length > 0 ? 'no_actionable_intent' : undefined,
    };
  }
}
