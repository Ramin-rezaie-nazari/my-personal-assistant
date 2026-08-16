import { BrainOrchestratorService } from '../../personal-brain/services/brain-orchestrator.service';
import { AssistantService } from './assistant.service';

describe('AssistantService', () => {
  const makeService = (overrides: Partial<{
    processRequest: jest.Mock;
    execute: jest.Mock;
    resolve: jest.Mock;
    append: jest.Mock;
    get: jest.Mock;
    understand: jest.Mock;
    createPlan: jest.Mock;
  }> = {}) => {
    const orchestrator = { processRequest: overrides.processRequest ?? jest.fn() } as unknown as BrainOrchestratorService;
    const execution = { execute: overrides.execute ?? jest.fn() } as any;
    const contextual = {
      resolve: overrides.resolve ?? jest.fn().mockResolvedValue({ referencesPrevious: false, operation: 'unknown', entities: {}, clauses: [], intents: [], contradictions: [], confidence: 0.7 }),
    } as any;
    const conversation = {
      append: overrides.append ?? jest.fn().mockResolvedValue(undefined),
      get: overrides.get ?? jest.fn().mockResolvedValue({ turns: [] }),
    } as any;
    const localLanguageUnderstanding = {
      understand: overrides.understand ?? jest.fn().mockReturnValue({ intent: 'UNKNOWN', confidence: 0, entities: {} }),
    } as any;
    const planning = {
      createPlan: overrides.createPlan ?? jest.fn().mockResolvedValue({ requiresClarification: false, reason: 'ok', clauses: [], intents: [], contradictions: [], confidence: 0.7 }),
    } as any;
    return new AssistantService(orchestrator, execution, contextual, conversation, localLanguageUnderstanding, planning);
  };

  it('returns the assistant status', async () => {
    const service = makeService();
    await expect(service.getStatus()).resolves.toEqual({
      name: 'My Personal Assistant',
      status: 'brain foundation active',
    });
  });

  it('delegates assistant requests to the brain orchestrator with the user id', async () => {
    const processRequest = jest.fn().mockResolvedValue({
      message: 'ok',
      intent: 'general',
      confidence: 1,
      nextAction: undefined,
    });
    const service = makeService({ processRequest });

    await expect(service.process('hello', 'user-123')).resolves.toMatchObject({
      message: 'ok',
      intent: 'general',
      confidence: 1,
    });
    expect(processRequest).toHaveBeenCalledWith('hello', 'user-123');
  });

  it('maps a linked workout update to update_workout', () => {
    const service = makeService() as any;
    const result = service.resolveContextualExecution(
      { intent: 'conversation', nextAction: undefined, confidence: 0.9, message: 'ok' },
      { referencesPrevious: true, operation: 'update', targetAction: 'create_workout', targetResourceType: 'workout', targetResourceId: 'w1', entities: {} },
      'همون تمرین رو 60 دقیقه کن',
    );
    expect(result).toMatchObject({ intent: 'workout', nextAction: 'update_workout' });
  });

  it('maps a linked habit cancellation to delete_habit', () => {
    const service = makeService() as any;
    const result = service.resolveContextualExecution(
      { intent: 'conversation', nextAction: undefined, confidence: 0.9, message: 'ok' },
      { referencesPrevious: true, operation: 'cancel', targetAction: 'create_habit', targetResourceType: 'habit', targetResourceId: 'h1', entities: {} },
      'همون عادت رو لغو کن',
    );
    expect(result).toMatchObject({ intent: 'habit', nextAction: 'delete_habit' });
  });

  it('maps a linked supplement update to update_supplement', () => {
    const service = makeService() as any;
    const result = service.resolveContextualExecution(
      { intent: 'conversation', nextAction: undefined, confidence: 0.9, message: 'ok' },
      { referencesPrevious: true, operation: 'update', targetAction: 'take_supplement', targetResourceType: 'supplement', targetResourceId: 's1', entities: {} },
      'همون مکمل رو ساعت 21:00 بذار',
    );
    expect(result).toMatchObject({ intent: 'supplement', nextAction: 'update_supplement' });
  });

  it('does not rewrite an unrelated command', () => {
    const service = makeService() as any;
    const response = { intent: 'conversation', nextAction: 'create_reminder', confidence: 0.9, message: 'ok' };
    const result = service.resolveContextualExecution(
      response,
      { referencesPrevious: false, operation: 'unknown', entities: {} },
      'یک یادآوری جدید بساز',
    );
    expect(result).toBe(response);
  });
});
