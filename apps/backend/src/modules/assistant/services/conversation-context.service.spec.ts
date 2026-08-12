import { ConversationContextService } from './conversation-context.service';

describe('ConversationContextService', () => {
  it('keeps user-scoped turns bounded and resolves the latest action', () => {
    const service = new ConversationContextService();
    for (let index = 0; index < 30; index += 1) {
      service.append({ userId: 'u1', role: 'user', text: `message-${index}`, action: index === 29 ? 'reminder' : undefined });
    }

    const context = service.get('u1');
    expect(context.turns).toHaveLength(24);
    expect(context.lastUserMessage?.text).toBe('message-29');
    expect(context.lastAction?.action).toBe('reminder');
    expect(service.get('u2').turns).toEqual([]);
  });

  it('can clear one user without affecting another', () => {
    const service = new ConversationContextService();
    service.append({ userId: 'u1', role: 'user', text: 'keep?' });
    service.append({ userId: 'u2', role: 'user', text: 'keep me' });
    service.clear('u1');
    expect(service.get('u1').turns).toEqual([]);
    expect(service.get('u2').turns).toHaveLength(1);
  });
});
