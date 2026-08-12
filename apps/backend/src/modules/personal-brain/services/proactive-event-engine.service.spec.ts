import { ProactiveEventEngineService } from './proactive-event-engine.service';

describe('ProactiveEventEngineService', () => {
  it('creates an immediate overdue event', async () => {
    const coach = { getNextCoach: jest.fn().mockResolvedValue({ primary: { type: 'start_task', priority: 'critical', title: 'Pay bill', message: 'Start now', taskId: 't1', reason: 'overdue scheduled item' } }) };
    const service = new ProactiveEventEngineService(coach as any, {} as any);
    const now = new Date('2026-08-12T10:00:00Z');
    const events = await service.buildEvents('u1', now);
    expect(events[0]).toMatchObject({ type: 'overdue_task', priority: 'critical', taskId: 't1' });
    expect(events[0].scheduledFor).toBe(now.toISOString());
  });

  it('creates a recovery event when the coach requests recovery', async () => {
    const coach = { getNextCoach: jest.fn().mockResolvedValue({ primary: { type: 'recover_schedule', priority: 'high', title: 'Recover', message: 'Replan', reason: 'capacity exceeded' } }) };
    const service = new ProactiveEventEngineService(coach as any, {} as any);
    const events = await service.buildEvents('u1', new Date('2026-08-12T10:00:00Z'));
    expect(events[0].type).toBe('schedule_recovery');
  });
});
