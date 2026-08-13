import { ConversationContextService } from './conversation-context.service';

describe('ConversationContextService', () => {
  it('keeps user-scoped turns bounded and resolves the latest action', async () => {
    const history = { append: jest.fn(async (turn: any) => ({ ...turn, id: `${turn.userId}-${turn.text}`, createdAt: Date.now() })), getRecent: jest.fn(async () => []), deleteAll: jest.fn(async () => undefined) } as any;
    const service = new ConversationContextService(history);
    for (let index = 0; index < 30; index += 1) await service.append({ userId: 'u1', role: 'user', text: `message-${index}`, action: index === 29 ? 'reminder' : undefined });
    const context = await service.get('u1');
    expect(context.turns).toHaveLength(24);
    expect(context.lastUserMessage?.text).toBe('message-29');
    expect(context.lastAction?.action).toBe('reminder');
    expect((await service.get('u2')).turns).toEqual([]);
  });

  it('can clear one user without affecting another', async () => {
    const history = { append: jest.fn(async (turn: any) => ({ ...turn, id: `${turn.userId}-${turn.text}`, createdAt: Date.now() })), getRecent: jest.fn(async () => []), deleteAll: jest.fn(async () => undefined) } as any;
    const service = new ConversationContextService(history);
    await service.append({ userId: 'u1', role: 'user', text: 'keep?' });
    await service.append({ userId: 'u2', role: 'user', text: 'keep me' });
    await service.clear('u1');
    expect((await service.get('u1')).turns).toEqual([]);
    expect((await service.get('u2')).turns).toHaveLength(1);
  });
});
