import { FitnessProgressService } from './fitness-progress.service';

describe('FitnessProgressService', () => {
  it('summarizes workouts, performances and active program completion', async () => {
    const prisma = {
      $queryRaw: jest.fn()
        .mockResolvedValueOnce([{ count: 2n, minutes: 90, calories: 600 }])
        .mockResolvedValueOnce([{ count: 4n, completedRate: 87.5, avgDifficulty: 6.25 }])
        .mockResolvedValueOnce([{
          id: 'assignment-1',
          status: 'active',
          currentWeek: 2,
          currentDay: 1,
          completedSessions: 4,
          durationWeeks: 4,
          sessionsPerWeek: 3,
          programName: 'Strength Foundation',
        }]),
    } as any;

    const service = new FitnessProgressService(prisma);
    await expect(service.summary('user-1')).resolves.toEqual({
      workouts: 2,
      workoutMinutes: 90,
      caloriesBurned: 600,
      performanceRecords: 4,
      averageCompletionRate: 87.5,
      averageDifficulty: 6.25,
      activeProgram: {
        assignmentId: 'assignment-1',
        programName: 'Strength Foundation',
        status: 'active',
        currentWeek: 2,
        currentDay: 1,
        completedSessions: 4,
        totalSessions: 12,
        completionPercent: 33,
      },
    });
  });
});
