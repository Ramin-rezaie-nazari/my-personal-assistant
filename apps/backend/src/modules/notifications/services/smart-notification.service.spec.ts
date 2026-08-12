import { SmartNotificationService } from './smart-notification.service';

describe('SmartNotificationService', () => {
  const makePrisma = () => ({
    userPreference: { findUnique: jest.fn() },
    dailyLog: { findUnique: jest.fn() },
    nutritionProfile: { findUnique: jest.fn() },
    habit: { findMany: jest.fn() },
    supplement: { findMany: jest.fn() },
    workout: { findMany: jest.fn() },
    notification: { createMany: jest.fn() },
  });

  it('creates actionable notifications and dedupes by user/date/rule', async () => {
    const prisma = makePrisma();
    prisma.userPreference.findUnique.mockResolvedValue({ notificationsEnabled: true });
    prisma.dailyLog.findUnique.mockResolvedValue({ waterMl: 400, protein: 20 });
    prisma.nutritionProfile.findUnique.mockResolvedValue({ waterGoalMl: 2400, proteinGoalGrams: 140 });
    prisma.habit.findMany.mockResolvedValue([{ name: 'Walk', logs: [] }, { name: 'Read', logs: [{ id: 'l1' }] }]);
    prisma.supplement.findMany.mockResolvedValue([{ name: 'Vitamin D', logs: [] }]);
    prisma.workout.findMany.mockResolvedValue([]);
    prisma.notification.createMany.mockResolvedValue({ count: 4 });

    const service = new SmartNotificationService(prisma as never);
    const result = await service.generateForUser('u1', '2026-08-12');

    expect(result).toEqual({
      enabled: true,
      created: 4,
      rules: ['hydration-low', 'protein-low', 'habits-pending', 'supplements-pending', 'movement-missing'],
    });
    expect(prisma.notification.createMany).toHaveBeenCalledWith(
      expect.objectContaining({ skipDuplicates: true }),
    );
  });

  it('does nothing when notifications are disabled', async () => {
    const prisma = makePrisma();
    prisma.userPreference.findUnique.mockResolvedValue({ notificationsEnabled: false });

    const service = new SmartNotificationService(prisma as never);
    await expect(service.generateForUser('u1', '2026-08-12')).resolves.toEqual({
      enabled: false,
      created: 0,
      rules: [],
    });
    expect(prisma.notification.createMany).not.toHaveBeenCalled();
  });

  it('stays quiet when the user is on track', async () => {
    const prisma = makePrisma();
    prisma.userPreference.findUnique.mockResolvedValue({ notificationsEnabled: true });
    prisma.dailyLog.findUnique.mockResolvedValue({ waterMl: 2200, protein: 130 });
    prisma.nutritionProfile.findUnique.mockResolvedValue({ waterGoalMl: 2400, proteinGoalGrams: 140 });
    prisma.habit.findMany.mockResolvedValue([{ name: 'Walk', logs: [{ id: 'l1' }] }]);
    prisma.supplement.findMany.mockResolvedValue([{ name: 'Vitamin D', logs: [{ id: 'l1' }] }]);
    prisma.workout.findMany.mockResolvedValue([{ id: 'w1' }]);

    const service = new SmartNotificationService(prisma as never);
    await expect(service.generateForUser('u1', '2026-08-12')).resolves.toEqual({
      enabled: true,
      created: 0,
      rules: [],
    });
    expect(prisma.notification.createMany).not.toHaveBeenCalled();
  });
});
