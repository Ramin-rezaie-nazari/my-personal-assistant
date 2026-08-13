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

    const historical = context.state.lifeContext?.decisionMemory ? {
      stable: context.state.lifeContext.decisionMemory.changeSignal === 'stable',
      confidenceBoost: context.state.lifeContext.decisionMemory.selectedFrequency.some((item) => item.count >= 3) ? 0.03 : 0,
      repeatedReasons: context.state.lifeContext.decisionMemory.repeatedReasons,
      selectedFrequency: context.state.lifeContext.decisionMemory.selectedFrequency,
    } : undefined;

    const learning = this.learningPolicy.apply(base.confidence, historical);
    const outcomeMemory = context.state.lifeContext?.outcomeMemory;
    const outcomeAdjustment = outcomeMemory && outcomeMemory.sampleSize >= 5 ? Math.max(-0.04, Math.min(0.04, outcomeMemory.confidenceAdjustment)) : 0;
    const confidence = Math.min(0.99, Math.max(0, learning.confidence + outcomeAdjustment));
    const historicalReasons = [
      ...learning.historicalReasons,
      ...(outcomeAdjustment > 0 ? ['Similar past decisions have produced positive outcomes for you.'] : []),
      ...(outcomeAdjustment < 0 ? ['Similar past decisions have not been working as well recently, so I reduced confidence slightly.'] : []),
    ];

    const result = {
      ...base,
      confidence,
      historicalReasons,
      message,
    };

    const explanation = this.explanationService.explainBrain(context, result);
    return { ...result, explanation };
  }
}
