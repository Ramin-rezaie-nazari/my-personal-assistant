import { Injectable } from '@nestjs/common';
import { BrainDecisionService } from './brain-decision.service';
import { FitnessDecisionPolicyService } from './fitness-decision-policy.service';
import { DecisionExplanationService } from './decision-explanation.service';
import { DecisionLearningPolicyService } from './decision-learning-policy.service';
import { BrainDecisionPipelineResult, BrainReasoningContext } from '../types';

@Injectable()
export class BrainDecisionPipelineService {
  constructor(
    private readonly brainDecisionService: BrainDecisionService,
    private readonly fitnessDecisionPolicy: FitnessDecisionPolicyService,
    private readonly explanationService: DecisionExplanationService,
    private readonly learningPolicy: DecisionLearningPolicyService,
  ) {}

  run(context: BrainReasoningContext): BrainDecisionPipelineResult {
    const fitnessDecision = this.fitnessDecisionPolicy.evaluate(context);
    const base = fitnessDecision ?? this.brainDecisionService.evaluateDecision(context);
    const message = base.canDecide
      ? fitnessDecision ? 'fitness-aware brain decision ready' : 'brain is ready for decision'
      : fitnessDecision ? 'fitness-aware brain needs more information' : 'brain needs more information';

    const learning = this.learningPolicy.apply(base.confidence, context.state.lifeContext?.decisionMemory ? {
      stable: context.state.lifeContext.decisionMemory.changeSignal === 'stable',
      confidenceBoost: context.state.lifeContext.decisionMemory.selectedFrequency.some((item) => item.count >= 3) ? 0.03 : 0,
      repeatedReasons: context.state.lifeContext.decisionMemory.repeatedReasons,
      selectedFrequency: context.state.lifeContext.decisionMemory.selectedFrequency,
    } : undefined);

    const result = {
      ...base,
      confidence: learning.confidence,
      historicalReasons: learning.historicalReasons,
      message,
    };

    const explanation = this.explanationService.explainBrain(context, result);
    return { ...result, explanation };
  }
}
