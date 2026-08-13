import { DecisionAuditService } from './decision-audit.service';

describe('DecisionAuditService', () => {
  it('records decisions and reads newest entries first', async () => {
    const entries: any[] = [];
    const prisma = { decisionAuditEntry: {
      create: jest.fn().mockImplementation(({ data }) => { const entry = { id: String(entries.length + 1), ...data, createdAt: new Date(entries.length + 1) }; entries.push(entry); return Promise.resolve(entry); }),
      findMany: jest.fn().mockImplementation(({ take }) => Promise.resolve(entries.slice().reverse().slice(0, take))),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    } } as any;
    const service = new DecisionAuditService(prisma);
    await service.record({ userId: 'u1', decisionId: '1', selectedIds: ['a'], rejectedIds: ['b'], blockedIds: [], reason: 'test' });
    await service.record({ userId: 'u1', decisionId: '2', selectedIds: ['c'], rejectedIds: [], blockedIds: ['d'], reason: 'constraint' });
    expect((await service.recent('u1', 1))[0].decisionId).toBe('2');
    expect(await service.recent('u1', 2)).toHaveLength(2);
  });
});
