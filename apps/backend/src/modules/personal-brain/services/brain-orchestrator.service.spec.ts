import { BrainOrchestratorService } from './brain-orchestrator.service';
import { BrainDecisionPipelineService } from './brain-decision-pipeline.service';
import { BrainReasoningContextService } from './brain-reasoning-context.service';
import { ResponsePlanningService } from './response-planning.service';
import { ScenarioIntentService } from './scenario-intent.service';
import { ScenarioPlanningService } from './scenario-planning.service';

describe('BrainOrchestratorService', () => {
  it('builds reasoning context with the authenticated user, evaluates a decision, and returns the planned response', async () => {
    const reasoningContext = {
      input: 'help me plan my day',
      signals: {
        hasContext: true,
        hasMemories: true,
        hasGoals: true,
        memoryCount: 2,
        goalCount: 1,
        contextSource: 'test',
      },
    };
    const decision = {
      canDecide: true,
      intent: 'planning',
      confidence: 1,
      recommendation: 'Start with your highest-priority goal',
      nextAction: 'show-plan',
      blockers: [],
      message: 'brain is ready for decision',
    };
    const responsePlan = {
      tone: 'friendly',
      language: 'en',
      message: 'Start with your highest-priority goal',
      intent: 'planning',
      confidence: 1,
      nextAction: 'show-plan',
      decision,
      metadata: {
        formality: 'casual',
        source: 'personal-brain',
        canDecide: true,
        blockers: [],
      },
    };
    const reasoningContextService = {
      build: jest.fn().mockResolvedValue(reasoningContext),
    } as unknown as BrainReasoningContextService;
    const decisionPipelineService = {
      run: jest.fn().mockReturnValue(decision),
    } as unknown as BrainDecisionPipelineService;
    const responsePlanningService = {
      createPlan: jest.fn().mockReturnValue(responsePlan),
    } as unknown as ResponsePlanningService;
    const scenarioIntentService = {
      detect: jest.fn().mockReturnValue({
        enabled: false,
        mode: 'none',
        reason: 'not-a-scenario',
        candidates: [],
      }),
    } as unknown as ScenarioIntentService;
    const scenarioPlanningService = {
      compare: jest.fn(),
    } as unknown as ScenarioPlanningService;
    const service = new BrainOrchestratorService(
      reasoningContextService,
      decisionPipelineService,
      responsePlanningService,
      scenarioIntentService,
      scenarioPlanningService,
    );
    const userId = 'user-123';
    const result = await service.processRequest('help me plan my day', userId);
    expect(reasoningContextService.build).toHaveBeenCalledWith(
      'help me plan my day',
      userId,
    );
    expect(decisionPipelineService.run).toHaveBeenCalledWith(reasoningContext);
    expect(scenarioIntentService.detect).toHaveBeenCalledWith(
      'help me plan my day',
    );
    expect(responsePlanningService.createPlan).toHaveBeenCalledWith({
      decision,
      reasoningContext,
    });
    expect(scenarioPlanningService.compare).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        message: 'Start with your highest-priority goal',
        intent: 'planning',
        confidence: 1,
        nextAction: 'show-plan',
      }),
    );
  });
});
