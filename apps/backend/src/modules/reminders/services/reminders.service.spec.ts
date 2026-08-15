import { BadRequestException, NotFoundException } from '@nestjs/common';
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

  it('trims titles and defaults blank types to general', async () => {
    const prisma = makePrisma();
    prisma.reminder.create.mockResolvedValue({ id: 'r1', title: 'Water', type: 'general', scheduledAt: new Date(), completed: false });
    const service = new RemindersService(prisma as never);

    await service.createReminder('u1', { title: '  Water  ', type: '   ', time: '09:30' });

    expect(prisma.reminder.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: 'u1', title: 'Water', type: 'general' }),
    });
  });

  it('rejects an empty title before touching the database', async () => {
    const prisma = makePrisma();
    const service = new RemindersService(prisma as never);

    await expect(service.createReminder('u1', { title: '   ', type: 'general', time: '09:30' })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.reminder.create).not.toHaveBeenCalled();
  });

  it('rejects malformed times', async () => {
    const prisma = makePrisma();
    const service = new RemindersService(prisma as never);

    await expect(service.createReminder('user-1', { title: 'Test', type: 'general', time: '9:30' })).rejects.toThrow('time must use HH:MM format');
    await expect(service.createReminder('user-1', { title: 'Test', type: 'general', time: '25:00' })).rejects.toThrow('time must be a valid time');
    await expect(service.createReminder('user-1', { title: 'Test', type: 'general', time: '12:60' })).rejects.toThrow('time must be a valid time');
  });

  it('rejects an invalid user timezone', async () => {
    const prisma = makePrisma();
    prisma.userSettings.findUnique.mockResolvedValue({ timezone: 'Not/A-Timezone' });
    const service = new RemindersService(prisma as never);

    await expect(service.createReminder('u1', { title: 'Test', type: 'general', time: '09:30' })).rejects.toThrow('invalid user timezone');
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

  it('rejects completing or reopening another user reminder', async () => {
    const prisma = makePrisma();
    prisma.reminder.updateMany.mockResolvedValue({ count: 0 });
    prisma.reminder.findFirst.mockResolvedValue(null);
    const service = new RemindersService(prisma as never);

    await expect(service.completeReminder('u1', 'other')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.reopenReminder('u1', 'other')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates title and time only for the authenticated owner', async () => {
    const prisma = makePrisma();
    prisma.reminder.updateMany.mockResolvedValue({ count: 1 });
    prisma.reminder.findFirstOrThrow.mockResolvedValue({ id: 'r1', title: 'Updated', type: 'health', scheduledAt: new Date(), completed: false });
    const service = new RemindersService(prisma as never);

    await expect(service.updateReminder('u1', 'r1', { title: '  Updated  ', time: '18:30' })).resolves.toMatchObject({ id: 'r1', title: 'Updated' });
    expect(prisma.reminder.updateMany).toHaveBeenCalledWith({
      where: { id: 'r1', userId: 'u1' },
      data: { title: 'Updated', scheduledAt: expect.any(Date) },
    });
  });

  it('rejects empty update patches and empty titles', async () => {
    const prisma = makePrisma();
    const service = new RemindersService(prisma as never);

    await expect(service.updateReminder('u1', 'r1', {})).rejects.toThrow('at least one field is required');
    await expect(service.updateReminder('u1', 'r1', { title: '   ' })).rejects.toThrow('title cannot be empty');
    expect(prisma.reminder.updateMany).not.toHaveBeenCalled();
  });

  it('returns not found when updating or deleting another user reminder', async () => {
    const prisma = makePrisma();
    prisma.reminder.updateMany.mockResolvedValue({ count: 0 });
    prisma.reminder.deleteMany.mockResolvedValue({ count: 0 });
    const service = new RemindersService(prisma as never);

    await expect(service.updateReminder('u1', 'other', { title: 'Updated' })).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.deleteReminder('u1', 'other')).rejects.toBeInstanceOf(NotFoundException);
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
    expect(prisma.reminder.findFirst).toHaveBeenCalledWith({
      where: { userId: 'u1', completed: false, scheduledAt: { gte: expect.any(Date) } },
      orderBy: { scheduledAt: 'asc' },
    });
  });
});
