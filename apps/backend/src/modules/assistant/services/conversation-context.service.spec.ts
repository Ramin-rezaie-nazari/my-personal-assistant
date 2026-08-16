import { ConversationContextService } from './conversation-context.service';

describe('ConversationContextService', () => {
  const makeTurn = (index: number, userId: string, action?: string) => ({
    id: `t-${userId}-${index}`,
    userId,
    role: 'user' as const,
    text: `message-${index}`,
    action,
    createdAt: Date.parse(`2026-08-16T00:${String(index).padStart(2, '0')}:00.000Z`),
  });

  it('keeps user-scoped turns bounded and resolves the latest action', async () => {
    const history = {
      append: jest.fn().mockImplementation(async (turn: any) => ({
        ...turn,
        id: `persisted-${Math.random()}`,
        createdAt: Date.now(),
      })),
      getRecent: jest.fn().mockResolvedValue([]),
      deleteAll: jest.fn().mockResolvedValue(undefined),
    };
    const service = new ConversationContextService(history as any);

    for (let index = 0; index < 30; index += 1) {
      await service.append({ userId: 'u1', role: 'user', text: `message-${index}`, action: index === 29 ? 'reminder' : undefined });
    }

    const context = await service.get('u1');
    expect(context.turns).toHaveLength(24);
    expect(context.lastUserMessage?.text).toBe('message-29');
    expect(context.lastAction?.action).toBe('reminder');
    expect((await service.get('u2')).turns).toEqual([]);
    expect(history.append).toHaveBeenCalledTimes(30);
  });

  it('can clear one user without affecting another', async () => {
    const history = {
      append: jest.fn().mockImplementation(async (turn: any) => ({ ...turn, id: `${turn.userId}-1`, createdAt: Date.now() })),
      getRecent: jest.fn().mockResolvedValue([]),
      deleteAll: jest.fn().mockResolvedValue(undefined),
    };
    const service = new ConversationContextService(history as any);
    await service.append({ userId: 'u1', role: 'user', text: 'keep?' });
    await service.append({ userId: 'u2', role: 'user', text: 'keep me' });
    await service.clear('u1');
    expect((await service.get('u1')).turns).toEqual([]);
    expect((await service.get('u2')).turns).toHaveLength(1);
    expect(history.deleteAll).toHaveBeenCalledWith('u1');
  });

  it('hydrates a cold session from persisted history', async () => {
    const persisted = [
      makeTurn(1, 'u3'),
      { ...makeTurn(2, 'u3'), role: 'assistant' as const, action: undefined },
      { ...makeTurn(3, 'u3'), action: 'workout', executionId: 'ex-1', resourceType: 'workout', resourceId: 'w-1' },
    ];
    const history = {
      append: jest.fn(),
      getRecent: jest.fn().mockResolvedValue(persisted),
      deleteAll: jest.fn(),
    };
    const service = new ConversationContextService(history as any);
    const context = await service.get('u3');
    expect(history.getRecent).toHaveBeenCalledWith('u3', 24);
    expect(context.turns).toHaveLength(3);
    expect(context.lastUserMessage?.text).toBe('message-3');
    expect(context.lastAssistantMessage?.role).toBe('assistant');
    expect(context.lastAction).toEqual(expect.objectContaining({ action: 'workout', executionId: 'ex-1', resourceType: 'workout', resourceId: 'w-1' }));
  });
});
