import { ContextualCommandService } from './contextual-command.service';

describe('ContextualCommandService', () => {
  it('resolves a follow-up update against the previous action', async () => {
    const context = {
      get: jest.fn().mockResolvedValue({
        turns: [],
        lastAction: { action: 'create_reminder', executionId: 'rem-123' },
      }),
    } as any;
    const service = new ContextualCommandService(context);
    const result = await service.resolve('u1', 'نه، همون رو ساعت ۸:۳۰ بذار');
    expect(result.referencesPrevious).toBe(true);
    expect(result.operation).toBe('update');
    expect(result.targetAction).toBe('create_reminder');
    expect(result.targetExecutionId).toBe('rem-123');
  });

  it('does not attach a previous target to a standalone create command', async () => {
    const context = { get: jest.fn().mockResolvedValue({ turns: [], lastAction: { action: 'create_reminder' } }) } as any;
    const service = new ContextualCommandService(context);
    const result = await service.resolve('u1', 'برای فردا ساعت ۸ یادم بنداز ورزش کنم');
    expect(result.referencesPrevious).toBe(false);
    expect(result.operation).toBe('create');
    expect(result.targetAction).toBeUndefined();
  });
});
