import { ConversationHistoryService } from './conversation-history.service';

describe('ConversationHistoryService', () => {
  const prisma = {
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn(),
  } as any;

  beforeEach(() => jest.clearAllMocks());

  it('persists a normalized user turn', async () => {
    prisma.$executeRaw.mockResolvedValue(1);
    const service = new ConversationHistoryService(prisma);

    const turn = await service.append({ userId: 'u1', role: 'user', text: '  Hello  ' });

    expect(turn.userId).toBe('u1');
    expect(turn.text).toBe('Hello');
    expect(prisma.$executeRaw).toHaveBeenCalled();
  });

  it('returns only the authenticated user recent history in chronological order', async () => {
    const older = new Date('2026-08-12T10:00:00Z');
    const newer = new Date('2026-08-12T10:01:00Z');
    prisma.$queryRaw.mockResolvedValue([
      { id: '2', userId: 'u1', role: 'assistant', text: 'Done', intent: 'reminder', action: 'create_reminder', executionId: 'e1', createdAt: newer },
      { id: '1', userId: 'u1', role: 'user', text: 'Remind me', intent: null, action: null, executionId: null, createdAt: older },
    ]);
    const service = new ConversationHistoryService(prisma);

    const result = await service.getRecent('u1', 24);

    expect(result.map((item) => item.id)).toEqual(['1', '2']);
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it('finds the latest action for contextual linking', async () => {
    prisma.$queryRaw.mockResolvedValue([{ id: '2', userId: 'u1', role: 'assistant', text: 'Done', intent: 'reminder', action: 'create_reminder', executionId: 'e1', createdAt: new Date() }]);
    const service = new ConversationHistoryService(prisma);

    await expect(service.getLatestAction('u1')).resolves.toMatchObject({ action: 'create_reminder', executionId: 'e1' });
  });

  it('supports scoped deletion for privacy controls', async () => {
    prisma.$executeRaw.mockResolvedValue(7);
    const service = new ConversationHistoryService(prisma);

    await expect(service.deleteSince('u1', new Date('2026-08-12T10:00:00Z'))).resolves.toEqual({ deleted: 7 });
    await expect(service.deleteAll('u1')).resolves.toEqual({ deleted: 7 });
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(2);
  });
});
