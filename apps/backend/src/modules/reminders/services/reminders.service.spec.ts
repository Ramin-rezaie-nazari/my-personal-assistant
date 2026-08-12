import { RemindersService } from './reminders.service';

describe('RemindersService', () => {
  it('creates a user-scoped reminder from a valid time', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'r1' });
    const prisma = { reminder: { create } } as never;
    const service = new RemindersService(prisma);

    await service.createReminder('user-1', { title: 'Drink water', type: 'health', time: '09:30' });

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        title: 'Drink water',
        type: 'health',
        scheduledAt: expect.any(Date),
      }),
    });
  });

  it('rejects malformed times', async () => {
    const prisma = { reminder: { create: jest.fn() } } as never;
    const service = new RemindersService(prisma);

    await expect(service.createReminder('user-1', { title: 'Test', type: 'general', time: '9:30' })).rejects.toThrow('time must use HH:MM format');
    await expect(service.createReminder('user-1', { title: 'Test', type: 'general', time: '25:00' })).rejects.toThrow('time must be a valid time');
  });

  it('keeps completion and deletion scoped to the owner', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const deleteMany = jest.fn().mockResolvedValue({ count: 1 });
    const prisma = { reminder: { updateMany, deleteMany } } as never;
    const service = new RemindersService(prisma);

    await service.completeReminder('user-1', 'r1');
    await service.deleteReminder('user-1', 'r1');

    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'r1', userId: 'user-1' },
      data: { completed: true },
    });
    expect(deleteMany).toHaveBeenCalledWith({ where: { id: 'r1', userId: 'user-1' } });
  });
});
