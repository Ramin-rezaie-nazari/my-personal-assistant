import { ScheduleHealthService } from './schedule-health.service';

describe('ScheduleHealthService', () => {
  it('marks an overloaded plan and calculates remaining capacity', async () => {
    const scheduler = {
      buildDay: jest.fn().mockResolvedValue({
        date: '2026-08-12',
        items: [
          {
            type: 'task',
            start: '2026-08-12T09:00:00.000Z',
            end: '2026-08-12T14:00:00.000Z',
          },
        ],
        unscheduled: [{ id: '2' }],
        validation: { overlapCount: 1 },
        adaptive: {},
      }),
    };
    const policy = {
      getPolicy: jest.fn().mockReturnValue({ maxFocusedMinutes: 180 }),
    };
    const service = new ScheduleHealthService(scheduler as any, policy);
    const result = await service.evaluate('user-1', new Date('2026-08-12'));
    expect(result.status).toBe('overloaded');
    expect(result.capacity.taskMinutes).toBe(300);
    expect(result.capacity.remainingMinutes).toBe(0);
    expect(result.issues).toEqual({ overlaps: 1, unscheduled: 1 });
  });
});
