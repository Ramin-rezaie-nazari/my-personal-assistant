import { WorkoutPerformanceMemoryService } from './workout-performance-memory.service';

describe('WorkoutPerformanceMemoryService', () => {
  it('calculates four-week performance trends', async () => {
    const rows = [
      { discipline: 'gym', exerciseId: 'push-up', exerciseName: 'Push-up', performedAt: new Date('2026-07-20'), formScore: 0.72, completionRate: 0.75, perceivedDifficulty: 0.65, recoveryScore: 0.78, reps: 8, loadKg: null },
      { discipline: 'gym', exerciseId: 'push-up', exerciseName: 'Push-up', performedAt: new Date('2026-07-22'), formScore: 0.78, completionRate: 0.82, perceivedDifficulty: 0.60, recoveryScore: 0.80, reps: 10, loadKg: null },
      { discipline: 'gym', exerciseId: 'push-up', exerciseName: 'Push-up', performedAt: new Date('2026-08-05'), formScore: 0.88, completionRate: 0.90, perceivedDifficulty: 0.50, recoveryScore: 0.85, reps: 14, loadKg: null },
      { discipline: 'gym', exerciseId: 'push-up', exerciseName: 'Push-up', performedAt: new Date('2026-08-10'), formScore: 0.92, completionRate: 0.95, perceivedDifficulty: 0.42, recoveryScore: 0.90, reps: 18, loadKg: null },
    ];
    const prisma = { $queryRaw: jest.fn().mockResolvedValue(rows) } as any;
    const service = new WorkoutPerformanceMemoryService(prisma);
    const memory = await service.get('user-1', 28);
    expect(memory.sessions).toBe(4);
    expect(memory.formTrend).toBeGreaterThan(0);
    expect(memory.completionTrend).toBeGreaterThan(0);
    expect(memory.exerciseTrends[0].latestReps).toBe(18);
  });

  it('records a performance event for the authenticated user', async () => {
    const prisma = { $executeRaw: jest.fn().mockResolvedValue(1) } as any;
    const service = new WorkoutPerformanceMemoryService(prisma);
    const result = await service.record({ userId: 'user-1', discipline: 'calisthenics', exerciseId: 'squat', formScore: 0.9 });
    expect(result.recorded).toBe(true);
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
  });
});
