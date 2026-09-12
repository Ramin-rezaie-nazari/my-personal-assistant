import { NaturalActionExecutionService } from './natural-action-execution.service';

describe('NaturalActionExecutionService', () => {
  const response = {
    message: 'I can help.',
    intent: 'reminder',
    confidence: 0.9,
    nextAction: 'create_reminder',
    responsePlan: {} as any,
  };

  it('executes the selected natural-language action through the coordinator', async () => {
    const coordinator = {
      execute: jest
        .fn()
        .mockResolvedValue({ status: 'completed', action: 'create_reminder' }),
    };
    const service = new NaturalActionExecutionService(coordinator as any);
    await expect(
      service.execute('remind me at 8', 'u1', response),
    ).resolves.toMatchObject({ executed: true, action: 'create_reminder' });
    expect(coordinator.execute).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({
        action: 'create_reminder',
        domain: 'reminder',
      }),
      expect.objectContaining({ source: 'natural-language' }),
    );
  });

  it('surfaces a structured action result message when the adapter provides one', async () => {
    const coordinator = {
      execute: jest.fn().mockResolvedValue({
        status: 'completed',
        action: 'get_nutrition_summary',
        result: { message: 'خلاصه تغذیه امروزت آماده‌ست.', summary: { dateKey: '2026-08-17' } },
      }),
    };
    const service = new NaturalActionExecutionService(coordinator as any);

    await expect(
      service.execute('امروز چقدر خوردم؟', 'u1', {
        ...response,
        intent: 'nutrition',
        nextAction: 'get_nutrition_summary',
      }),
    ).resolves.toMatchObject({
      executed: true,
      action: 'get_nutrition_summary',
      message: 'خلاصه تغذیه امروزت آماده‌ست.',
    });
  });

  it('returns a blocked result without pretending the action completed', async () => {
    const coordinator = {
      execute: jest.fn().mockResolvedValue({ status: 'blocked' }),
    };
    const service = new NaturalActionExecutionService(coordinator as any);
    await expect(
      service.execute('remind me at 8', 'u1', response),
    ).resolves.toMatchObject({ executed: false, action: 'create_reminder' });
  });

  it('does not execute when the brain provides no action', async () => {
    const coordinator = { execute: jest.fn() };
    const service = new NaturalActionExecutionService(coordinator as any);
    await expect(
      service.execute('hello', 'u1', { ...response, nextAction: undefined }),
    ).resolves.toMatchObject({ executed: false, action: 'none' });
    expect(coordinator.execute).not.toHaveBeenCalled();
  });
});
