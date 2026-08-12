import { BrainLifeContextService } from './brain-life-context.service';

describe('BrainLifeContextService', () => {
  const prisma = {
    habit: { findMany: jest.fn() },
    reminder: { count: jest.fn(), findFirst: jest.fn() },
    supplement: { findMany: jest.fn() },
  };

  let service: BrainLifeContextService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BrainLifeContextService(prisma as never);
  });

  it('aggregates habits, reminders and supplements for one user', async () => {
    prisma.habit.findMany.mockResolvedValue([
      {
        id: 'h1',
        name: 'Walk',
        targetPerWeek: 7,
        logs: [{ dateKey: '2026-08-12' }, { dateKey: '2026-08-11' }],
      },
    ]);
    prisma.reminder.count.mockResolvedValue(2);
    prisma.reminder.findFirst.mockResolvedValue({
      id: 'r1',
      title: 'Water',
      type: 'health',
      scheduledAt: new Date('2026-08-13T09:00:00Z'),
    });
    prisma.supplement.findMany.mockResolvedValue([
      {
        id: 's1',
        name: 'Vitamin D',
        dosage: '1000 IU',
        scheduledTime: '09:00',
        logs: [{ id: 'l1' }],
      },
      {
        id: 's2',
        name: 'Magnesium',
        dosage: '200 mg',
        scheduledTime: '21:00',
        logs: [],
      },
    ]);

    const result = await service.getToday('u1', '2026-08-12');

    expect(prisma.habit.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'u1', active: true } }));
    expect(prisma.reminder.count).toHaveBeenCalledWith({ where: { userId: 'u1', completed: false } });
    expect(prisma.supplement.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'u1', active: true } }));
    expect(result.habits.active).toBe(1);
    expect(result.habits.completedThisWeek).toBe(2);
    expect(result.reminders.pending).toBe(2);
    expect(result.reminders.next?.title).toBe('Water');
    expect(result.supplements.taken).toBe(1);
    expect(result.supplements.remaining).toBe(1);
    expect(result.supplements.next?.name).toBe('Magnesium');
  });

  it('returns a calm zero-state for a new user', async () => {
    prisma.habit.findMany.mockResolvedValue([]);
    prisma.reminder.count.mockResolvedValue(0);
    prisma.reminder.findFirst.mockResolvedValue(null);
    prisma.supplement.findMany.mockResolvedValue([]);

    const result = await service.getToday('new-user', '2026-08-12');

    expect(result.habits.completionPercent).toBe(0);
    expect(result.habits.currentStreak).toBe(0);
    expect(result.reminders.next).toBeNull();
    expect(result.supplements.completionPercent).toBe(0);
    expect(result.supplements.next).toBeNull();
  });
});
