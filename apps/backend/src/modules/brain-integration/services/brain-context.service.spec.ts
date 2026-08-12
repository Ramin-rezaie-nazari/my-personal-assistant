import { BrainContextService } from './brain-context.service';

describe('BrainContextService', () => {
  const prisma = {
    userProfile: { findUnique: jest.fn() },
    dailyLog: { findUnique: jest.fn() },
    nutritionProfile: { findUnique: jest.fn() },
    habit: { findMany: jest.fn() },
    supplement: { findMany: jest.fn() },
    reminder: { count: jest.fn(), findFirst: jest.fn(), findMany: jest.fn() },
    workout: { findMany: jest.fn() },
    notification: { count: jest.fn() },
  };

  beforeEach(() => jest.clearAllMocks());

  it('builds a user-scoped context and actionable priorities', async () => {
    prisma.userProfile.findUnique.mockResolvedValue({ primaryGoal: 'Get healthier' });
    prisma.dailyLog.findUnique.mockResolvedValue({ calories: 900, protein: 40, waterMl: 600 });
    prisma.nutritionProfile.findUnique.mockResolvedValue({ dailyCaloriesGoal: 2000, proteinGoalGrams: 140, waterGoalMl: 2400 });
    prisma.habit.findMany.mockResolvedValue([{ logs: [{ id: 'h1' }] }, { logs: [] }]);
    prisma.supplement.findMany.mockResolvedValue([{ logs: [{ id: 's1' }] }, { logs: [] }]);
    prisma.reminder.count.mockResolvedValue(3);
    prisma.reminder.findFirst.mockResolvedValue({ id: 'r1', title: 'Call doctor', type: 'health', scheduledAt: new Date('2026-08-12T15:00:00Z'), completed: false });
    prisma.reminder.findMany.mockResolvedValue([{ id: 'c1', title: 'Gym', type: 'calendar', scheduledAt: new Date('2026-08-12T18:00:00Z'), completed: false }]);
    prisma.workout.findMany.mockResolvedValue([{ id: 'w1', name: 'Walk', type: 'cardio', durationMinutes: 30, caloriesBurned: 150, performedAt: new Date('2026-08-12T09:00:00Z') }]);
    prisma.notification.count.mockResolvedValue(2);

    const service = new BrainContextService(prisma as never);
    const result = await service.getContext('u1', '2026-08-12');

    expect(prisma.dailyLog.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { userId_dateKey: { userId: 'u1', dateKey: '2026-08-12' } } }));
    expect(result.primaryGoal).toBe('Get healthier');
    expect(result.habits).toEqual({ active: 2, completed: 1, streaks: [1, 0] });
    expect(result.supplements).toEqual({ active: 2, taken: 1, remaining: 1 });
    expect(result.calendar.todayCount).toBe(1);
    expect(result.notifications.unread).toBe(2);
    expect(result.priorities[0]).toContain('2 unread assistant notifications');
    expect(result.priorities).toContain('Catch up on water');
    expect(result.priorities).toContain('Boost your protein');
  });

  it('returns a clean zero state without invented activity', async () => {
    prisma.userProfile.findUnique.mockResolvedValue(null);
    prisma.dailyLog.findUnique.mockResolvedValue(null);
    prisma.nutritionProfile.findUnique.mockResolvedValue(null);
    prisma.habit.findMany.mockResolvedValue([]);
    prisma.supplement.findMany.mockResolvedValue([]);
    prisma.reminder.count.mockResolvedValue(0);
    prisma.reminder.findFirst.mockResolvedValue(null);
    prisma.reminder.findMany.mockResolvedValue([]);
    prisma.workout.findMany.mockResolvedValue([]);
    prisma.notification.count.mockResolvedValue(0);

    const service = new BrainContextService(prisma as never);
    const result = await service.getContext('new-user', '2026-08-12');

    expect(result.primaryGoal).toBeNull();
    expect(result.today).toEqual({ calories: 0, calorieGoal: null, protein: 0, proteinGoal: null, waterMl: 0, waterGoalMl: null });
    expect(result.habits).toEqual({ active: 0, completed: 0, streaks: [] });
    expect(result.calendar.todayCount).toBe(0);
    expect(result.workouts.latest).toBeNull();
    expect(result.priorities).toContain('Start your daily log');
  });
});
