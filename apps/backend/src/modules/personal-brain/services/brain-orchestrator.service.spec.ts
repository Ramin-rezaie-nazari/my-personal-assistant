import { BrainOrchestratorService } from './brain-orchestrator.service';
import { BrainDecisionPipelineService } from './brain-decision-pipeline.service';
import { BrainReasoningContextService } from './brain-reasoning-context.service';
import { ResponsePlanningService } from './response-planning.service';

describe('BrainOrchestratorService', () => {
  it('builds reasoning context, evaluates a decision, and returns the planned response', async () => {
    const reasoningContextService = {
      build: jest.fn().mockResolvedValue({
        input: 'help me plan my day',
        signals: {
          hasContext: true,
          hasMemories: true,
          hasGoals: true,
          memoryCount: 2,
          goalCount: 1,
          contextSource: 'test',
        },
      }),
    } as unknown as BrainReasoningContextService;

    const decisionPipelineService = {
      run: jest.fn().mockReturnValue({
        canDecide: true,
        intent: 'planning',
        confidence: 1,
        recommendation: 'Start with your highest-priority goal',
        nextAction: 'show-plan',
        blockers: [],
        message: 'brain is ready for decision',
      }),
    } as unknown as BrainDecisionPipelineService;

    const responsePlanningService = {
      createPlan: jest.fn().mockReturnValue({
        tone: 'friendly',
        language: 'en',
        message: 'Start with your highest-priority goal',
        intent: 'planning',
        confidence: 1,
        nextAction: 'show-plan',
        decision: {
          canDecide: true,
          intent: 'planning',
          confidence: 1,
          recommendation: 'Start with your highest-priority goal',
          nextAction: 'show-plan',
          blockers: [],
          message: 'brain is ready for decision',
        },
        metadata: {
          formality: 'casual',
          source: 'personal-brain',
          canDecide: true,
          blockers: [],
        },
      }),
    } as unknown as ResponsePlanningService;

    const service = new BrainOrchestratorService(
      reasoningContextService,
      decisionPipelineService,
      responsePlanningService,
    );

    const result = await service.processRequest('help me plan my day');

    expect(reasoningContextService.build).toHaveBeenCalledWith(
      'help me plan my day',
    );
    expect(decisionPipelineService.run).toHaveBeenCalledWith(
      await reasoningContextService.build.mock.results[0].value,
    );
    expect(responsePlanningService.createPlan).toHaveBeenCalledWith({
      decision: await decisionPipelineService.run.mock.results[0].value,
      reasoningContext: await reasoningContextService.build.mock.results[0].value,
    });
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
