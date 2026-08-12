import { Injectable } from '@nestjs/common';

import { DecisionActionAdapterService } from '../../personal-brain/services/decision-action-adapter.service';
import { DecisionExecutionCoordinatorService } from '../../personal-brain/services/decision-execution-coordinator.service';
import { UnifiedDecisionEngineService } from '../../personal-brain/services/unified-decision-engine.service';

export type NaturalActionExecution = {
  executed: boolean;
  action: string;
  message: string;
  intent: string;
  receipt?: unknown;
};

@Injectable()
export class NaturalActionExecutionService {
  constructor(
    private readonly decisionEngine: UnifiedDecisionEngineService,
    private readonly coordinator: DecisionExecutionCoordinatorService,
  ) {}

  async execute(input: string, userId: string): Promise<NaturalActionExecution> {
    const decision = this.decisionEngine.decide({ userId, input });
    if (!decision || decision.candidates.length === 0) {
      return { executed: false, action: 'none', message: 'I understood the request, but there is no safe executable action yet.', intent: 'unknown' };
    }

    const candidate = decision.candidates[0];
    const receipt = await this.coordinator.execute(userId, candidate, { source: 'natural-language' });

    if (receipt.status === 'completed') {
      return { executed: true, action: candidate.action, message: 'Done. I completed that action.', intent: candidate.action, receipt };
    }
    if (receipt.status === 'blocked') {
      return { executed: false, action: candidate.action, message: 'I did not execute that action because a safety rule blocked it.', intent: candidate.action, receipt };
    }
    if (receipt.status === 'unsupported') {
      return { executed: false, action: candidate.action, message: 'I understood what you want, but that action is not connected yet.', intent: candidate.action, receipt };
    }
    return { executed: false, action: candidate.action, message: 'I could not complete that action safely.', intent: candidate.action, receipt };
  }
}
