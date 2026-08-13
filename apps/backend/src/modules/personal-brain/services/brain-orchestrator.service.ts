import { Injectable } from '@nestjs/common';

import { BrainDecisionPipelineService } from './brain-decision-pipeline.service';
import { BrainReasoningContextService } from './brain-reasoning-context.service';
import { ResponsePlanningService } from './response-planning.service';
import { ScenarioIntentService } from './scenario-intent.service';
import { ScenarioPlanningService } from './scenario-planning.service';

import { BrainResponse } from '../types';

@Injectable()
export class BrainOrchestratorService {
  constructor(
    private readonly brainReasoningContextService: BrainReasoningContextService,
    private readonly brainDecisionPipelineService: BrainDecisionPipelineService,
    private readonly responsePlanningService: ResponsePlanningService,
    private readonly scenarioIntentService: ScenarioIntentService,
    private readonly scenarioPlanningService: ScenarioPlanningService,
  ) {}

  async processRequest(input: string, userId: string): Promise<BrainResponse> {
    const reasoningContext = await this.brainReasoningContextService.build(input, userId);
    const decision = this.brainDecisionPipelineService.run(reasoningContext);
    const scenarioIntent = this.scenarioIntentService.detect(input);

    if (scenarioIntent.enabled && decision.candidates?.length) {
      const comparison = this.scenarioPlanningService.compare({
        candidates: decision.candidates,
        context: {
          budgetPressure: false,
          capacityPressure: false,
          healthConstraint: false,
        },
      });
      const responsePlan = this.responsePlanningService.createPlan({ decision, reasoningContext });
      const best = comparison.best;
      const scenarioMessage = best
        ? `I compared the available options. The strongest path right now is: ${best.title}. ${best.rationale.join('; ')}.`
        : responsePlan.message;
      return {
        message: scenarioMessage,
        intent: 'scenario_compare',
        confidence: best?.state.confidence ?? responsePlan.confidence,
        nextAction: undefined,
        responsePlan,
        metadata: {
          ...responsePlan.metadata,
          scenario: {
            mode: scenarioIntent.mode,
            reason: scenarioIntent.reason,
            best,
            alternatives: comparison.scenarios.slice(1, 4),
          },
        },
      };
    }

    const responsePlan = this.responsePlanningService.createPlan({
      decision,
      reasoningContext,
    });

    return {
      message: responsePlan.message,
      intent: responsePlan.intent,
      confidence: responsePlan.confidence,
      nextAction: responsePlan.nextAction,
      responsePlan,
      metadata: {
        ...responsePlan.metadata,
      },
    };
  }
}
