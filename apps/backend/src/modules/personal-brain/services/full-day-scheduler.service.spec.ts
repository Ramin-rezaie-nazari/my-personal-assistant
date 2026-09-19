import { FullDaySchedulerService } from './full-day-scheduler.service';

describe('FullDaySchedulerService', () => {
  it('reads task dependencies from the canonical LifeTaskDependency table', async () => {
    const queryRaw = jest.fn().mockResolvedValue([]);
    const prisma = {
      userSettings: { findUnique: jest.fn().mockResolvedValue({ timezone: 'UTC' }) },
      $queryRaw: queryRaw,
      reminder: { findMany: jest.fn().mockResolvedValue([]) },
      supplement: { findMany: jest.fn().mockResolvedValue([]) },
      habit: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const learning = {
      buildProfile: jest.fn().mockResolvedValue({
        bestHours: [],
        preferredTaskMinutes: null,
        snoozeRate: 0,
        acceptanceRate: 0,
      }),
    };
    const policy = {
      getPolicy: jest.fn().mockReturnValue({
        workingWindow: { startHour: 8, endHour: 22 },
        focusWindow: { startHour: 9, endHour: 17 },
        bufferMinutes: 10,
      }),
    };

    const service = new FullDaySchedulerService(prisma as never, learning as never, policy as never);
    await service.buildDay('user-1', new Date('2026-08-12T12:00:00.000Z'));

    const querySource = String(queryRaw.mock.calls[0]?.[0] ?? '');
    expect(querySource).toContain('"LifeTaskDependency"');
    expect(querySource).not.toContain('"TaskDependency"');
  });
});
