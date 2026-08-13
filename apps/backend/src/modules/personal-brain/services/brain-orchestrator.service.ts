import { Injectable } from '@nestjs/common';

import { BrainDecisionPipelineService } from './brain-decision-pipeline.service';
import { BrainReasoningContextService } from './brain-reasoning-context.service';
import { ResponsePlanningService } from './response-planning.service';
import { ScenarioIntentService } from './scenario-intent.service';
import { ScenarioPlanningService } from './scenario-planning.service';
import { DecisionCandidate } from './unified-decision-engine.service';

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

    const responsePlan = this.responsePlanningService.createPlan({ decision, reasoningContext });

    if (scenarioIntent.enabled && decision.nextAction) {
      const candidates = this.buildScenarioCandidates(decision.nextAction, decision.confidence, reasoningContext);
      const comparison = this.scenarioPlanningService.compare({
        candidates,
        context: {
          budgetPressure: Boolean(reasoningContext.state.lifeContext?.goals.dueSoon && reasoningContext.state.lifeContext.goals.dueSoon > 0),
          capacityPressure: Boolean(reasoningContext.state.dailyStatus.hasLog && reasoningContext.state.dailyStatus.calories > 0),
          healthConstraint: false,
        },
      });
      const best = comparison.best;
      return {
        message: best
          ? `I compared the available paths. The strongest option right now is: ${best.title}. ${best.rationale.join('; ')}.`
          : responsePlan.message,
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

  private buildScenarioCandidates(nextAction: string, confidence: number, reasoningContext: Awaited<ReturnType<BrainReasoningContextService['build']>>): DecisionCandidate[] {
    const domain = this.domainForAction(nextAction);
    const alignment = this.goalAlignment(reasoningContext);
    return [
      {
        id: `primary:${nextAction}`,
        domain,
        action: nextAction,
        score: Math.min(1, 0.7 + confidence * 0.3),
        confidence,
        priority: 0.8,
        goalAlignment: alignment,
        goalDownside: 1 - alignment,
      },
      {
        id: `defer:${nextAction}`,
        domain,
        action: `defer_${nextAction}`,
        score: 0.45,
        confidence: Math.max(0.35, confidence - 0.15),
        priority: 0.45,
        goalAlignment: Math.max(0, alignment - 0.25),
        goalDownside: Math.min(1, 1 - alignment + 0.2),
      },
    ];
  }

  private goalAlignment(reasoningContext: Awaited<ReturnType<BrainReasoningContextService['build']>>): number {
    const goal = reasoningContext.state.lifeContext?.goals.next;
    if (!goal) return 0.5;
    const urgency = goal.daysRemaining !== null && goal.daysRemaining <= 7 ? 1 : 0.6;
    const progress = Math.max(0, Math.min(1, goal.progressPercent / 100));
    return Number(Math.max(0.1, Math.min(1, urgency * 0.6 + progress * 0.4)).toFixed(3));
  }

  private domainForAction(action: string): DecisionCandidate['domain'] {
    const value = action.toLowerCase();
    if (value.includes('workout') || value.includes('exercise') || value.includes('training')) return 'workout';
    if (value.includes('reminder')) return 'reminder';
    if (value.includes('nutrition') || value.includes('meal') || value.includes('food')) return 'nutrition';
    if (value.includes('habit')) return 'habit';
    if (value.includes('shop') || value.includes('buy') || value.includes('purchase')) return 'shopping';
    if (value.includes('schedule') || value.includes('calendar')) return 'schedule';
    return 'conversation';
  }
}
