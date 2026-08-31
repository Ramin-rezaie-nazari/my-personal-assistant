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

    if (contradictions.length)
      return {
        steps: [],
        requiresClarification: true,
        reason: 'conflicting_request',
      };

    const steps = clauses
      .map((clause, index) => {
        const intent = intents[index] ?? 'unknown';
        const previousIntent = index > 0 ? intents[index - 1] : undefined;
        const referencesPreviousStep =
          /(?:همون|همین|اینو|اونو|قبلی|previous|same|it|that)/i.test(clause);
        const dependsOn =
          index > 0 &&
          ((intent === 'update' && previousIntent === 'create') ||
            referencesPreviousStep)
            ? index - 1
            : undefined;
        return {
          index,
          intent,
          clause,
          ...(dependsOn !== undefined ? { dependsOn } : {}),
          requiresConfirmation: intent === 'cancel',
        };
      })
      .filter((step) => step.intent !== 'unknown');

    const actionableCount = clauses.filter(
      (_, index) => (intents[index] ?? 'unknown') !== 'unknown',
    ).length;
    if (clauses.length > 1 && steps.length !== actionableCount) {
      return {
        steps,
        requiresClarification: true,
        reason: 'partially_understood_request',
      };
    }

    const dependencyError = steps.some(
      (step) =>
        step.dependsOn !== undefined &&
        (step.dependsOn < 0 || step.dependsOn >= step.index),
    );
    if (dependencyError)
      return {
        steps: [],
        requiresClarification: true,
        reason: 'invalid_plan_dependency',
      };

    const hasUnsafeFollowUp = steps.some(
      (step) => step.intent === 'cancel' && step.dependsOn !== undefined,
    );
    if (hasUnsafeFollowUp)
      return {
        steps,
        requiresClarification: true,
        reason: 'confirmation_required_for_dependent_cancel',
      };

    // A low-confidence or unknown conversational request is not itself a
    // clarification-worthy action plan. It must continue to the Personal
    // Brain so the Brain can answer naturally. Clarification is reserved for
    // genuine contradictions or partially understood multi-step requests.
    return {
      steps,
      requiresClarification: false,
      reason: confidence > 0 && confidence < 0.55 ? 'low_confidence' : undefined,
    };
  }
}
