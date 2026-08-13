import { Injectable } from '@nestjs/common';
import { BrainDecisionService } from './brain-decision.service';
import { FitnessDecisionPolicyService } from './fitness-decision-policy.service';
import { DecisionExplanationService } from './decision-explanation.service';
import { BrainDecisionPipelineResult, BrainReasoningContext } from '../types';

@Injectable()
export class BrainDecisionPipelineService {
  constructor(
    private readonly brainDecisionService: BrainDecisionService,
    private readonly fitnessDecisionPolicy: FitnessDecisionPolicyService,
    private readonly explanationService: DecisionExplanationService,
  ) {}

  run(context: BrainReasoningContext): BrainDecisionPipelineResult {
    const fitnessDecision = this.fitnessDecisionPolicy.evaluate(context);
    if (fitnessDecision) {
      const message = fitnessDecision.canDecide ? 'fitness-aware brain decision ready' : 'fitness-aware brain needs more information';
      const result = { ...fitnessDecision, message };
      return { ...result, explanation: this.explanationService.explainBrain(context, result) };
    }
    const decision = this.brainDecisionService.evaluateDecision(context);
    const message = decision.canDecide ? 'brain is ready for decision' : 'brain needs more information';
    const result = { ...decision, message };
    return { ...result, explanation: this.explanationService.explainBrain(context, result) };
  }
}
