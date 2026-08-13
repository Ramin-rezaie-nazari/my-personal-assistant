import { Injectable } from '@nestjs/common';
import { BrainDecisionService } from './brain-decision.service';
import { FitnessDecisionPolicyService } from './fitness-decision-policy.service';
import { BrainDecisionPipelineResult, BrainReasoningContext } from '../types';

@Injectable()
export class BrainDecisionPipelineService {
  constructor(private readonly brainDecisionService: BrainDecisionService, private readonly fitnessDecisionPolicy: FitnessDecisionPolicyService) {}

  run(context: BrainReasoningContext): BrainDecisionPipelineResult {
    const fitnessDecision = this.fitnessDecisionPolicy.evaluate(context);
    if (fitnessDecision) return { ...fitnessDecision, message: fitnessDecision.canDecide ? 'fitness-aware brain decision ready' : 'fitness-aware brain needs more information' };
    const decision = this.brainDecisionService.evaluateDecision(context);
    return { ...decision, message: decision.canDecide ? 'brain is ready for decision' : 'brain needs more information' };
  }
}
