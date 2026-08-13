import { DecisionAuditService } from '../../src/modules/personal-brain/services/decision-audit.service';

describe('DecisionAuditService', () => {
  const prisma = {
    decisionAuditEntry: {
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  } as any;

  it('records and scopes recent audit entries by user', async () => {
    prisma.decisionAuditEntry.create.mockResolvedValue({
      id: 'audit-1', userId: 'u1', decisionId: 'd1', selectedIds: ['d1'], rejectedIds: [], blockedIds: [], reason: 'completed:d1', createdAt: new Date('2026-08-13T05:00:00Z'),
    });
    prisma.decisionAuditEntry.findMany.mockResolvedValue([]);
    const service = new DecisionAuditService(prisma);
    await service.record({ userId: 'u1', decisionId: 'd1', selectedIds: ['d1'], rejectedIds: [], blockedIds: [], reason: 'completed:d1' });
    await service.recent('u1', 10);
    expect(prisma.decisionAuditEntry.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'u1' } }));
  });

  it('clears only one user history', async () => {
    prisma.decisionAuditEntry.deleteMany.mockResolvedValue({ count: 2 });
    const service = new DecisionAuditService(prisma);
    await service.clear('u2');
    expect(prisma.decisionAuditEntry.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u2' } });
  });
});
