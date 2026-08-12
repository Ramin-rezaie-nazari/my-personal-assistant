import { DailyCommandCenterService } from './daily-command-center.service';

describe('DailyCommandCenterService', () => {
  const prisma = {
    userProfile: { findUnique: jest.fn() },
    dailyLog: { findUnique: jest.fn() },
    reminder: { findFirst: jest.fn(), count: jest.fn() },
    habit: { findMany: jest.fn() },
    supplement: { findMany: jest.fn() },
    workout: { findMany: jest.fn() },
    nutritionProfile: { findUnique: jest.fn() },
  };
  const notificationsService = { getUnreadCount: jest.fn() };

  beforeEach(() => jest.clearAllMocks());

  it('builds one actionable cross-domain daily briefing for the user', async () => {
    prisma.userProfile.findUnique.mockResolvedValue({ primaryGoal: 'Get healthier' });
    prisma.dailyLog.findUnique.mockResolvedValue({ calories: 1200, protein: 80, waterMl: 800 });
    prisma.reminder.findFirst.mockResolvedValue({ id: 'r1', title: 'Drink water', type: 'health', scheduledAt: new Date('2026-08-12T12:30:00Z') });
    prisma.reminder.count.mockResolvedValue(2);
    prisma.habit.findMany.mockResolvedValue([
      { id: 'h1', logs: [{ id: 'l1' }] },
      { id: 'h2', logs: [] },
    ]);
    prisma.supplement.findMany.mockResolvedValue([
      { id: 's1', logs: [{ id: 'l1' }] },
      { id: 's2', logs: [] },
    ]);
    prisma.workout.findMany.mockResolvedValue([{ name: 'Walk', type: 'cardio', durationMinutes: 30 }]);
    prisma.nutritionProfile.findUnique.mockResolvedValue({ dailyCaloriesGoal: 2000, proteinGoalGrams: 140, waterGoalMl: 2400 });
    notificationsService.getUnreadCount.mockResolvedValue(2);

    const service = new DailyCommandCenterService(prisma as never, notificationsService as never);
    const result = await service.getToday('u1');

    expect(prisma.dailyLog.findUnique).toHaveBeenCalled();
    expect(result.greeting).toContain('Get healthier');
    expect(result.habits).toEqual({ total: 2, completed: 1 });
    expect(result.supplements).toEqual({ total: 2, taken: 1 });
    expect(result.reminders.pending).toBe(2);
    expect(result.notifications).toEqual({ unread: 2 });
    expect(result.workouts.countToday).toBe(1);
    expect(result.priorities[0]).toContain('2 unread assistant notifications');
    expect(result.priorities).toContain('Catch up on water');
  });

  it('handles a clean new-user state without inventing activity', async () => {
    prisma.userProfile.findUnique.mockResolvedValue({ primaryGoal: null });
    prisma.dailyLog.findUnique.mockResolvedValue(null);
    prisma.reminder.findFirst.mockResolvedValue(null);
    prisma.reminder.count.mockResolvedValue(0);
    prisma.habit.findMany.mockResolvedValue([]);
    prisma.supplement.findMany.mockResolvedValue([]);
    prisma.workout.findMany.mockResolvedValue([]);
    prisma.nutritionProfile.findUnique.mockResolvedValue(null);
    notificationsService.getUnreadCount.mockResolvedValue(0);

    const service = new DailyCommandCenterService(prisma as never, notificationsService as never);
    const result = await service.getToday('new-user');

    expect(result.greeting).toBe('Let’s make today a good one.');
    expect(result.primaryGoal).toBeNull();
    expect(result.priorities[0]).toBe('Start your daily log');
    expect(result.habits).toEqual({ total: 0, completed: 0 });
    expect(result.supplements).toEqual({ total: 0, taken: 0 });
    expect(result.notifications).toEqual({ unread: 0 });
  });
});
