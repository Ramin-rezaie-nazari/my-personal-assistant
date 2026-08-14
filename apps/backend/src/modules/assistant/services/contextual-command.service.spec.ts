import { ContextualCommandService } from './contextual-command.service';

describe('ContextualCommandService', () => {
  const makeService = () => {
    const context = {
      get: jest.fn().mockResolvedValue({
        turns: [],
        lastAction: {
          action: 'create_reminder',
          executionId: 'rem-123',
          resourceType: 'reminder',
          resourceId: 'resource-123',
        },
      }),
    } as any;
    return new ContextualCommandService(context);
  };

  it('resolves a follow-up update against the previous action', async () => {
    const result = await makeService().resolve('u1', 'نه، همون رو ساعت ۸:۳۰ بذار');
    expect(result.referencesPrevious).toBe(true);
    expect(result.operation).toBe('update');
    expect(result.targetAction).toBe('create_reminder');
    expect(result.targetExecutionId).toBe('rem-123');
    expect(result.entities.time).toBe('08:30');
  });

  it('resolves Persian pronouns and extracts quantity', async () => {
    const result = await makeService().resolve('u1', 'اونو دو تا کن');
    expect(result.referencesPrevious).toBe(true);
    expect(result.operation).toBe('update');
    expect(result.entities.quantity).toBe(2);
    expect(result.targetResourceId).toBe('resource-123');
  });

  it('extracts duration from a natural follow-up', async () => {
    const result = await makeService().resolve('u1', 'همون قبلی رو ۳۰ دقیقه کن');
    expect(result.referencesPrevious).toBe(true);
    expect(result.entities.durationMinutes).toBe(30);
  });

  it('does not attach a previous target to a standalone create command', async () => {
    const result = await makeService().resolve('u1', 'برای فردا ساعت ۸ یادم بنداز ورزش کنم');
    expect(result.referencesPrevious).toBe(false);
    expect(result.operation).toBe('create');
    expect(result.targetAction).toBeUndefined();
  });
});
