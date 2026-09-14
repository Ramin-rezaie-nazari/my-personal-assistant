import { FitnessProgressService } from './fitness-progress.service';

describe('FitnessProgressService', () => {
  it('aggregates workout, performance and active-program progress', async () => {
    const queryRaw = jest
      .fn()
      .mockResolvedValueOnce([{ count: 5n, minutes: 210, calories: 1600 }])
      .mockResolvedValueOnce([{ count: 7n, completedRate: 0.86, avgDifficulty: 7.2 }])
      .mockResolvedValueOnce([{
        id: 'assignment-1',
        status: 'active',
        currentWeek: 3,
        currentDay: 2,
        completedSessions: 8,
        durationWeeks: 8,
        sessionsPerWeek: 3,
        programName: 'Strength Foundation',
      }]);

    const service = new FitnessProgressService({ queryRaw } as any);
    await expect(service.summary('user-1')).resolves.toMatchObject({
      workouts: 5,
      workoutMinutes: 210,
      caloriesBurned: 1600,
      performanceRecords: 7,
      averageCompletionRate: 0.86,
      averageDifficulty: 7.2,
      activeProgram: {
        assignmentId: 'assignment-1',
        completedSessions: 8,
        totalSessions: 24,
        completionPercent: 33,
      },
    });
    expect(queryRaw).toHaveBeenCalledTimes(3);
  });
});
