import { ScheduleRecoveryService } from './schedule-recovery.service';

describe('ScheduleRecoveryService', () => {
  it('prioritizes overdue work and proposes recovery actions for an overloaded day', async () => {
    const scheduler = {
      buildDay: jest.fn().mockResolvedValue({
        date: '2026-08-12',
        items: [
          {
            type: 'task',
            id: 'urgent',
            title: 'Urgent',
            start: '2026-08-12T08:00:00.000Z',
            end: '2026-08-12T09:00:00.000Z',
            priority: 0,
          },
          {
            type: 'task',
            id: 'low',
            title: 'Low',
            start: '2026-08-12T10:00:00.000Z',
            end: '2026-08-12T12:00:00.000Z',
            priority: 3,
          },
        ],
        unscheduled: [
          {
            id: 'later',
            title: 'Later',
            reason: 'no compatible free slot today',
          },
        ],
        validation: { overlapCount: 0 },
      }),
    };
    const health = {
      evaluate: jest.fn().mockResolvedValue({
        status: 'overloaded',
        score: 35,
        capacity: { utilization: 130, remainingMinutes: 0 },
      }),
    };
    const service = new ScheduleRecoveryService(
      scheduler as any,
      health as any,
    );
    const result = await service.analyze(
      'user-1',
      new Date('2026-08-12T09:30:00.000Z'),
    );
    expect(result.requiresRecovery).toBe(true);
    expect(
      result.actions.some((a) => a.type === 'consider_move' && a.id === 'low'),
    ).toBe(true);
    expect(
      result.actions.some((a) => a.type === 'reschedule' && a.id === 'later'),
    ).toBe(true);
  });
});
