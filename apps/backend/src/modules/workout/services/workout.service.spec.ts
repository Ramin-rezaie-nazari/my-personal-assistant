import { WorkoutService } from './workout.service';
import { PrismaService } from '../../../common/database/prisma.service';

describe('WorkoutService', () => {
  it('creates a user-scoped workout', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'w1' });
    const prisma = { workout: { create } } as unknown as PrismaService;
    const service = new WorkoutService(prisma);

    await service.createWorkout('user-1', {
      name: 'Morning Run',
      type: 'cardio',
      durationMinutes: 31,
      caloriesBurned: 280,
    });

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        name: 'Morning Run',
        type: 'cardio',
        durationMinutes: 31,
        caloriesBurned: 280,
        performedAt: expect.any(Date),
      }),
    });
  });

  it('aggregates seven days and calculates a streak', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        name: 'Run',
        type: 'cardio',
        durationMinutes: 30,
        caloriesBurned: 300,
        performedAt: new Date('2026-08-12T08:00:00Z'),
      },
      {
        name: 'Lift',
        type: 'strength',
        durationMinutes: 45,
        caloriesBurned: 220,
        performedAt: new Date('2026-08-11T08:00:00Z'),
      },
      {
        name: 'Walk',
        type: 'cardio',
        durationMinutes: 25,
        caloriesBurned: 120,
        performedAt: new Date('2026-08-09T08:00:00Z'),
      },
    ]);
    const prisma = { workout: { findMany } } as unknown as PrismaService;
    const service = new WorkoutService(prisma);

    const result = await service.getWeeklySummary('user-1', '2026-08-12');

    expect(result.workoutCount).toBe(3);
    expect(result.activeDays).toBe(3);
    expect(result.totalMinutes).toBe(100);
    expect(result.totalCaloriesBurned).toBe(640);
    expect(result.consistencyPercent).toBe(43);
    expect(result.currentStreak).toBe(2);
    expect(result.lastWorkout?.name).toBe('Run');
  });

  it('keeps ownership on update and delete', async () => {
    const findFirst = jest.fn().mockResolvedValue({
      id: 'w1',
      userId: 'user-1',
      durationMinutes: 30,
      caloriesBurned: 200,
    });
    const update = jest.fn().mockResolvedValue({ id: 'w1' });
    const deleteMany = jest.fn().mockResolvedValue({ count: 1 });
    const prisma = {
      workout: { findFirst, update, deleteMany },
    } as unknown as PrismaService;
    const service = new WorkoutService(prisma);

    await service.updateWorkout('user-1', 'w1', { durationMinutes: 40 });
    await service.deleteWorkout('user-1', 'w1');

    expect(findFirst).toHaveBeenCalledWith({
      where: { id: 'w1', userId: 'user-1' },
    });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'w1' } }),
    );
    expect(deleteMany).toHaveBeenCalledWith({
      where: { id: 'w1', userId: 'user-1' },
    });
  });
});
