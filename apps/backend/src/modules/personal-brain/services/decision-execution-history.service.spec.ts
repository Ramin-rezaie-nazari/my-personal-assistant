import { DecisionExecutionHistoryService } from './decision-execution-history.service';

describe('DecisionExecutionHistoryService', () => {
  const receipt = (overrides: Record<string, unknown> = {}) => ({ userId: 'u1', decisionId: 'd1', action: 'notify', domain: 'notification', status: 'completed', reason: 'action_executed', durationMs: 20, attempts: 1, policy: { timeoutMs: 1000, maxAttempts: 1, retryDelayMs: 0, dryRun: false }, ...overrides } as any);

  it('filters recent execution history and calculates stats', () => {
    const service = new DecisionExecutionHistoryService();
    service.record(receipt());
    service.record(receipt({ status: 'failed', attempts: 2, durationMs: 40, action: 'workout' }));
    expect(service.recent({ userId: 'u1', status: 'failed' })).toHaveLength(1);
    expect(service.stats('u1')).toEqual({ total: 2, totalDurationMs: 60, totalAttempts: 3, byStatus: { completed: 1, failed: 1 } });
  });

  it('keeps the history bounded', () => {
    const service = new DecisionExecutionHistoryService();
    for (let i = 0; i < 510; i += 1) service.record(receipt({ decisionId: `d${i}` }));
    expect(service.recent({ limit: 100 })).toHaveLength(100);
    expect(service.recent({ limit: 1 })[0].decisionId).toBe('d509');
  });
});
