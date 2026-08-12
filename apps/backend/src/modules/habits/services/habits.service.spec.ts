import { HabitsService } from './habits.service';

describe('HabitsService', () => {
  const prisma = {
    habit: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn(), delete: jest.fn() },
    habitLog: { upsert: jest.fn() },
  };
  let service: HabitsService;

  beforeEach(() => { jest.clearAllMocks(); service = new HabitsService(prisma as never); });

  it('creates a user-scoped daily habit', async () => {
    prisma.habit.create.mockResolvedValue({ id: 'h1', userId: 'u1', name: 'Walk', frequency: 'daily', targetPerWeek: 7 });
    const result = await service.createHabit('u1', { name: 'Walk', frequency: 'daily' });
    expect(result.userId).toBe('u1');
    expect(prisma.habit.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId: 'u1', targetPerWeek: 7 }) }));
  });

  it('enforces ownership on completion and deletes', async () => {
    prisma.habit.findFirst.mockResolvedValueOnce(null);
    await expect(service.completeToday('u1', 'foreign', '2026-08-12')).rejects.toThrow('Habit not found');
    prisma.habit.findFirst.mockResolvedValueOnce(null);
    await expect(service.deleteHabit('u1', 'foreign')).rejects.toThrow('Habit not found');
  });

  it('creates an idempotent completion log', async () => {
    prisma.habit.findFirst.mockResolvedValue({ id: 'h1', userId: 'u1', active: true });
    prisma.habitLog.upsert.mockResolvedValue({ id: 'l1', habitId: 'h1', userId: 'u1', dateKey: '2026-08-12' });
    const result = await service.completeToday('u1', 'h1', '2026-08-12');
    expect(result.habitId).toBe('h1');
    expect(prisma.habitLog.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { habitId_dateKey: { habitId: 'h1', dateKey: '2026-08-12' } } }));
  });

  it('returns a seven-day completion summary', async () => {
    prisma.habit.findMany.mockResolvedValue([
      { id: 'h1', name: 'Walk', targetPerWeek: 7, logs: [{ dateKey: '2026-08-12' }, { dateKey: '2026-08-11' }] },
      { id: 'h2', name: 'Read', targetPerWeek: 5, logs: [{ dateKey: '2026-08-10' }] },
    ]);
    const result = await service.getWeeklySummary('u1', '2026-08-12');
    expect(result.activeHabits).toBe(2);
    expect(result.completedCount).toBe(3);
    expect(result.completionPercent).toBe(25);
  });
});
