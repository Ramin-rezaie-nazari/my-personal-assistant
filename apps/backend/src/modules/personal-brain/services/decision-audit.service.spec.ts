import { DecisionAuditService } from './decision-audit.service';

describe('DecisionAuditService', () => {
  it('records decisions and returns newest entries first', () => {
    const service = new DecisionAuditService();
    service.record({ userId: 'u1', decisionId: '1', selectedIds: ['a'], rejectedIds: ['b'], blockedIds: [], reason: 'test' });
    service.record({ userId: 'u1', decisionId: '2', selectedIds: ['c'], rejectedIds: [], blockedIds: ['d'], reason: 'constraint' });
    expect(service.recent('u1', 1)[0].decisionId).toBe('2');
    expect(service.recent('u1', 2)).toHaveLength(2);
  });
});
