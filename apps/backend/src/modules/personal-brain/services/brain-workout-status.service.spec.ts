import { BrainWorkoutStatusService } from './brain-workout-status.service';
import { WorkoutService } from '../../workout/services/workout.service';

describe('BrainWorkoutStatusService', () => {
  it('maps weekly workout analytics into brain state', async () => {
    const summary = {
      fromDateKey: '2026-08-06',
      toDateKey: '2026-08-12',
      workoutCount: 3,
      activeDays: 2,
      totalMinutes: 100,
      totalCaloriesBurned: 640,
      averageMinutesPerWorkout: 33,
      consistencyPercent: 29,
      currentStreak: 2,
      lastWorkout: {
        name: 'Morning Run',
        type: 'cardio',
        performedAt: '2026-08-12T08:00:00.000Z',
      },
    };
    const workoutService = {
      getWeeklySummary: jest.fn().mockResolvedValue(summary),
    } as unknown as WorkoutService;

    const service = new BrainWorkoutStatusService(workoutService);

    await expect(service.getThisWeek('user-1')).resolves.toEqual(summary);
    expect(workoutService.getWeeklySummary).toHaveBeenCalledWith('user-1');
  });
});
