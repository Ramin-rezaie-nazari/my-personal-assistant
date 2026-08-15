import { NotFoundException } from '@nestjs/common';
import { RemindersService } from './reminders.service';

const makePrisma = () => ({
  userSettings: { findUnique: jest.fn().mockResolvedValue({ timezone: 'UTC' }) },
  reminder: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findFirstOrThrow: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
});

describe('RemindersService', () => {
  it('creates a user-scoped reminder from a valid time', async () => {
    const prisma = makePrisma();
    prisma.reminder.create.mockResolvedValue({ id: 'r1', title: 'Drink water', type: 'health', scheduledAt: new Date(), completed: false });
    const service = new RemindersService(prisma as never);

    await expect(service.createReminder('user-1', { title: 'Drink water', type: 'health', time: '09:30' })).resolves.toMatchObject({ id: 'r1' });
    expect(prisma.reminder.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: 'user-1', title: 'Drink water', type: 'health', scheduledAt: expect.any(Date) }),
    });
  });

  it('rejects malformed times', async () => {
    const prisma = makePrisma();
    const service = new RemindersService(prisma as never);

    await expect(service.createReminder('user-1', { title: 'Test', type: 'general', time: '9:30' })).rejects.toThrow('time must use HH:MM format');
    await expect(service.createReminder('user-1', { title: 'Test', type: 'general', time: '25:00' })).rejects.toThrow('time must be a valid time');
  });

  it('returns pending reminders by default and all reminders on request', async () => {
    const prisma = makePrisma();
    prisma.reminder.findMany.mockResolvedValue([]);
    const service = new RemindersService(prisma as never);

    await service.getReminders('u1');
    await service.getReminders('u1', true);

    expect(prisma.reminder.findMany).toHaveBeenNthCalledWith(1, {
      where: { userId: 'u1', completed: false },
      orderBy: [{ completed: 'asc' }, { scheduledAt: 'asc' }],
    });
    expect(prisma.reminder.findMany).toHaveBeenNthCalledWith(2, {
      where: { userId: 'u1' },
      orderBy: [{ completed: 'asc' }, { scheduledAt: 'asc' }],
    });
  });

  it('completes and reopens only owned reminders', async () => {
    const prisma = makePrisma();
    prisma.reminder.updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 1 });
    const service = new RemindersService(prisma as never);

    await expect(service.completeReminder('u1', 'r1')).resolves.toEqual({ id: 'r1', completed: true });
    await expect(service.reopenReminder('u1', 'r1')).resolves.toEqual({ id: 'r1', completed: false });
    expect(prisma.reminder.updateMany).toHaveBeenNthCalledWith(1, { where: { id: 'r1', userId: 'u1', completed: false }, data: { completed: true } });
    expect(prisma.reminder.updateMany).toHaveBeenNthCalledWith(2, { where: { id: 'r1', userId: 'u1', completed: true }, data: { completed: false } });
  });

  it('throws when completing another user reminder', async () => {
    const prisma = makePrisma();
    prisma.reminder.updateMany.mockResolvedValue({ count: 0 });
    prisma.reminder.findFirst.mockResolvedValue(null);
    const service = new RemindersService(prisma as never);

    await expect(service.completeReminder('u1', 'other')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes only an owned reminder', async () => {
    const prisma = makePrisma();
    prisma.reminder.deleteMany.mockResolvedValue({ count: 1 });
    const service = new RemindersService(prisma as never);

    await expect(service.deleteReminder('u1', 'r1')).resolves.toEqual({ id: 'r1', deleted: true });
    expect(prisma.reminder.deleteMany).toHaveBeenCalledWith({ where: { id: 'r1', userId: 'u1' } });
  });

  it('returns the next pending reminder', async () => {
    const prisma = makePrisma();
    prisma.reminder.findFirst.mockResolvedValue({ id: 'r2', title: 'Workout', type: 'fitness', scheduledAt: new Date('2030-01-01T10:00:00.000Z'), completed: false });
    const service = new RemindersService(prisma as never);

    await expect(service.getNextReminder('u1')).resolves.toMatchObject({ id: 'r2', completed: false });
  });
});
