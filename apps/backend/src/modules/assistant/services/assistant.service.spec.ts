import { BrainOrchestratorService } from '../../personal-brain/services/brain-orchestrator.service';
import { AssistantService } from './assistant.service';

describe('AssistantService', () => {
  const makeService = (
    overrides: Partial<{
      processRequest: jest.Mock;
      execute: jest.Mock;
      resolve: jest.Mock;
      append: jest.Mock;
      get: jest.Mock;
      understand: jest.Mock;
      createPlan: jest.Mock;
      runForUser: jest.Mock;
    }> = {},
  ) => {
    const orchestrator = {
      processRequest: overrides.processRequest ?? jest.fn(),
    } as unknown as BrainOrchestratorService;
    const execution = { execute: overrides.execute ?? jest.fn() } as any;
    const contextual = {
      resolve:
        overrides.resolve ??
        jest.fn().mockResolvedValue({
          referencesPrevious: false,
          operation: 'unknown',
          entities: {},
          clauses: [],
          intents: [],
          contradictions: [],
          confidence: 0.7,
        }),
    } as any;
    const conversation = {
      append: overrides.append ?? jest.fn().mockResolvedValue(undefined),
      get: overrides.get ?? jest.fn().mockResolvedValue({ turns: [] }),
    } as any;
    const localLanguageUnderstanding = {
      understand:
        overrides.understand ??
        jest
          .fn()
          .mockReturnValue({ intent: 'UNKNOWN', confidence: 0, entities: {} }),
    } as any;
    const planning = {
      createPlan:
        overrides.createPlan ??
        jest.fn().mockResolvedValue({
          requiresClarification: false,
          reason: 'ok',
          clauses: [],
          intents: [],
          contradictions: [],
          confidence: 0.7,
        }),
    } as any;
    const aiCore = {
      runForUser:
        overrides.runForUser ??
        jest.fn().mockResolvedValue({
          providerId: 'local-core',
          text: 'context-aware response',
          task: 'text-generation',
          context: { dateKey: '2026-08-17' },
        }),
    } as any;
    return new AssistantService(
      orchestrator,
      execution,
      contextual,
      conversation,
      aiCore,
      localLanguageUnderstanding,
      planning,
    );
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
    const runForUser = jest.fn().mockRejectedValue(new Error('no-ai-fallback'));
    const service = makeService({ processRequest, runForUser });

    await expect(service.process('hello', 'user-123')).resolves.toMatchObject({
      message: 'ok',
      intent: 'general',
      confidence: 1,
    });
    expect(processRequest).toHaveBeenCalledWith('hello', 'user-123');
    expect(runForUser).toHaveBeenCalledWith({
      userId: 'user-123',
      input: 'hello',
      task: 'text-generation',
    });
  });

  it('uses contextual AI for an unknown local request', async () => {
    const runForUser = jest.fn().mockResolvedValue({
      providerId: 'local-core',
      text: 'با توجه به شرایط امروزت...',
      task: 'text-generation',
      context: { dateKey: '2026-08-17' },
    });
    const processRequest = jest.fn();
    const service = makeService({ runForUser, processRequest });

    await expect(
      service.process('امروز با توجه به شرایط من چی پیشنهاد میدی؟', 'u1'),
    ).resolves.toMatchObject({
      message: 'با توجه به شرایط امروزت...',
      intent: 'assistant',
      confidence: 0.6,
      metadata: expect.objectContaining({ aiCore: true }),
    });
    expect(runForUser).toHaveBeenCalledWith({
      userId: 'u1',
      input: 'امروز با توجه به شرایط من چی پیشنهاد میدی؟',
      task: 'text-generation',
    });
    expect(processRequest).not.toHaveBeenCalled();
  });

  it('falls back to the brain when contextual AI is unavailable', async () => {
    const processRequest = jest.fn().mockResolvedValue({
      message: 'brain fallback',
      intent: 'general',
      confidence: 0.8,
      nextAction: undefined,
    });
    const runForUser = jest.fn().mockRejectedValue(new Error('provider unavailable'));
    const service = makeService({ processRequest, runForUser });

    await expect(service.process('یه سؤال ناشناخته', 'u1')).resolves.toMatchObject({
      message: 'brain fallback',
      intent: 'general',
      confidence: 0.8,
    });
    expect(processRequest).toHaveBeenCalledWith('یه سؤال ناشناخته', 'u1');
  });

  it('maps a local water intent to add_water', () => {
    const service = makeService() as any;
    const result = service.responseForLocalIntent({
      intent: 'ADD_WATER',
      entities: { waterAmountMl: 500 },
      confidence: 0.97,
      normalizedText: '۵۰۰ میلی لیتر آب خوردم',
    });
    expect(result).toMatchObject({
      intent: 'hydration',
      nextAction: 'add_water',
    });
  });

  it('maps a linked workout update to update_workout', () => {
    const service = makeService() as any;
    const result = service.resolveContextualExecution(
      {
        intent: 'conversation',
        nextAction: undefined,
        confidence: 0.9,
        message: 'ok',
      },
      {
        referencesPrevious: true,
        operation: 'update',
        targetAction: 'create_workout',
        targetResourceType: 'workout',
        targetResourceId: 'w1',
        entities: {},
      },
      'همون تمرین رو 60 دقیقه کن',
    );
    expect(result).toMatchObject({
      intent: 'workout',
      nextAction: 'update_workout',
    });
  });

  it('maps a linked habit cancellation to delete_habit', () => {
    const service = makeService() as any;
    const result = service.resolveContextualExecution(
      {
        intent: 'conversation',
        nextAction: undefined,
        confidence: 0.9,
        message: 'ok',
      },
      {
        referencesPrevious: true,
        operation: 'cancel',
        targetAction: 'create_habit',
        targetResourceType: 'habit',
        targetResourceId: 'h1',
        entities: {},
      },
      'همون عادت رو لغو کن',
    );
    expect(result).toMatchObject({
      intent: 'habit',
      nextAction: 'delete_habit',
    });
  });

  it('maps a linked supplement update to update_supplement', () => {
    const service = makeService() as any;
    const result = service.resolveContextualExecution(
      {
        intent: 'conversation',
        nextAction: undefined,
        confidence: 0.9,
        message: 'ok',
      },
      {
        referencesPrevious: true,
        operation: 'update',
        targetAction: 'take_supplement',
        targetResourceType: 'supplement',
        targetResourceId: 's1',
        entities: {},
      },
      'همون مکمل رو ساعت 21:00 بذار',
    );
    expect(result).toMatchObject({
      intent: 'supplement',
      nextAction: 'update_supplement',
    });
  });

  it('does not rewrite an unrelated command', () => {
    const service = makeService() as any;
    const response = {
      intent: 'conversation',
      nextAction: 'create_reminder',
      confidence: 0.9,
      message: 'ok',
    };
    const result = service.resolveContextualExecution(
      response,
      { referencesPrevious: false, operation: 'unknown', entities: {} },
      'یک یادآوری جدید بساز',
    );
    expect(result).toBe(response);
  });
});
