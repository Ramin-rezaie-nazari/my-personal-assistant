import { ConversationHistoryService } from './conversation-history.service';
import { ConversationContextService } from './conversation-context.service';

describe('ConversationContextService', () => {
  const build = () => {
    let id = 0;
    const history = {
      append: jest.fn().mockImplementation(async (turn: any) => ({ ...turn, id: `t-${++id}`, createdAt: new Date() })),
      getRecent: jest.fn().mockResolvedValue([]),
      deleteAll: jest.fn().mockResolvedValue(0),
    } as unknown as ConversationHistoryService;
    return new ConversationContextService(history);
  };

  it('keeps user-scoped turns bounded and resolves the latest action', async () => {
    const service = build();
    for (let index = 0; index < 30; index += 1) {
      await service.append({ userId: 'u1', role: 'user', text: `message-${index}`, action: index === 29 ? 'reminder' : undefined });
    }

    const context = await service.get('u1');
    expect(context.turns).toHaveLength(24);
    expect(context.lastUserMessage?.text).toBe('message-29');
    expect(context.lastAction?.action).toBe('reminder');
    expect((await service.get('u2')).turns).toEqual([]);
  });

  it('can clear one user without affecting another', async () => {
    const service = build();
    await service.append({ userId: 'u1', role: 'user', text: 'keep?' });
    await service.append({ userId: 'u2', role: 'user', text: 'keep me' });
    await service.clear('u1');
    expect((await service.get('u1')).turns).toEqual([]);
    expect((await service.get('u2')).turns).toHaveLength(1);
  });
});
