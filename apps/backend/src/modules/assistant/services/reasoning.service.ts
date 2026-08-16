import { Injectable } from '@nestjs/common';

export type LocalPlanStep = {
  id: string;
  intent: 'create' | 'update' | 'cancel' | 'unknown';
  dependsOn: string[];
  requiresConfirmation: boolean;
};

export type LocalPlan = {
  steps: LocalPlanStep[];
  requiresClarification: boolean;
  clarificationReason?: string;
  confidence: number;
};

@Injectable()
export class ReasoningService {
  async analyze(input?: {
    clauses?: string[];
    intents?: Array<'create' | 'update' | 'cancel' | 'unknown'>;
    contradictions?: string[];
    confidence?: number;
  }): Promise<LocalPlan> {
    await Promise.resolve();

    const clauses = input?.clauses ?? [];
    const intents = input?.intents ?? [];
    const contradictions = input?.contradictions ?? [];
    const confidence = input?.confidence ?? 0.35;

    if (contradictions.length) {
      return {
        steps: [],
        requiresClarification: true,
        clarificationReason: 'The request contains conflicting instructions.',
        confidence: Math.max(0.05, confidence - 0.25),
      };
    }

    const steps = intents
      .map((intent, index) => ({
        id: `step-${index + 1}`,
        intent,
        dependsOn: index === 0 ? [] : [`step-${index}`],
        requiresConfirmation: intent === 'cancel',
      }))
      .filter((step) => step.intent !== 'unknown');

    const requiresClarification =
      steps.length === 0 || clauses.length !== steps.length;

    return {
      steps,
      requiresClarification,
      clarificationReason: requiresClarification
        ? 'I need a clearer description of the requested action.'
        : undefined,
      confidence: Math.min(0.95, confidence + (steps.length ? 0.05 : 0)),
    };
  }
}
