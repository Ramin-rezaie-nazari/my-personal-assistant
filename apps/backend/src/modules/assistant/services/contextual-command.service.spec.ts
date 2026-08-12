import { ContextualCommandService } from './contextual-command.service';

describe('ContextualCommandService', () => {
  it('resolves a follow-up update against the previous action', () => {
    const context = {
      get: () => ({
        turns: [],
        lastAction: { action: 'reminder.create', executionId: 'exec-1' },
      }),
    } as any;
    const service = new ContextualCommandService(context);
    const result = service.resolve('u1', 'نه، همون رو ساعت ۸:۳۰ بذار');
    expect(result.referencesPrevious).toBe(true);
    expect(result.operation).toBe('update');
    expect(result.targetAction).toBe('reminder.create');
    expect(result.targetExecutionId).toBe('exec-1');
  });

  it('does not attach a previous target to a standalone create command', () => {
    const context = { get: () => ({ turns: [], lastAction: { action: 'reminder.create' } }) } as any;
    const service = new ContextualCommandService(context);
    const result = service.resolve('u1', 'برای فردا ساعت ۸ یادم بنداز ورزش کنم');
    expect(result.referencesPrevious).toBe(false);
    expect(result.operation).toBe('create');
    expect(result.targetAction).toBeUndefined();
  });
});
