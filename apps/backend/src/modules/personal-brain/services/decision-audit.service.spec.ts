import { DecisionAuditService } from './decision-audit.service';

describe('DecisionAuditService', () => {
  it('records decisions and returns newest entries first', async () => {
    const service = new DecisionAuditService();
    await service.record({ decisionId: '1', selectedIds: ['a'], rejectedIds: ['b'], blockedIds: [], reason: 'test' });
    await service.record({ decisionId: '2', selectedIds: ['c'], rejectedIds: [], blockedIds: ['d'], reason: 'constraint' });
    expect((await service.recent())[0].decisionId).toBe('2');
    expect(await service.recent('', 2)).toHaveLength(2);
  });
});
