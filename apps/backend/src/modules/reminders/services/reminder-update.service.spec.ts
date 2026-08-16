import { RemindersService } from './reminders.service';

describe('RemindersService.updateReminder', () => {
  it('updates only the owning reminder', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const findFirstOrThrow = jest.fn().mockResolvedValue({
      id: 'r1',
      title: 'Workout',
      type: 'assistant',
      scheduledAt: new Date(),
      completed: false,
    });
    const prisma = {
      userSettings: {
        findUnique: jest.fn().mockResolvedValue({ timezone: 'UTC' }),
      },
      reminder: { updateMany, findFirstOrThrow },
    } as never;
    const service = new RemindersService(prisma);

    await expect(
      service.updateReminder('u1', 'r1', { time: '08:30' }),
    ).resolves.toMatchObject({ id: 'r1' });
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'r1', userId: 'u1' },
      data: { scheduledAt: expect.any(Date) },
    });
  });

  it('updates title and time together', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const findFirstOrThrow = jest.fn().mockResolvedValue({
      id: 'r1',
      title: 'Stretch',
      type: 'assistant',
      scheduledAt: new Date(),
      completed: false,
    });
    const prisma = {
      userSettings: {
        findUnique: jest.fn().mockResolvedValue({ timezone: 'Asia/Tehran' }),
      },
      reminder: { updateMany, findFirstOrThrow },
    } as never;
    const service = new RemindersService(prisma);

    await service.updateReminder('u1', 'r1', {
      title: ' Stretch ',
      time: '08:30',
    });
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'r1', userId: 'u1' },
      data: { title: 'Stretch', scheduledAt: expect.any(Date) },
    });
  });

  it('rejects an empty patch', async () => {
    const prisma = {
      userSettings: { findUnique: jest.fn() },
      reminder: { updateMany: jest.fn() },
    } as never;
    const service = new RemindersService(prisma);
    await expect(service.updateReminder('u1', 'r1', {})).rejects.toThrow(
      'at least one field is required',
    );
  });

  it('rejects missing reminders instead of updating another user record', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 0 });
    const prisma = {
      userSettings: {
        findUnique: jest.fn().mockResolvedValue({ timezone: 'UTC' }),
      },
      reminder: { updateMany },
    } as never;
    const service = new RemindersService(prisma);

    await expect(
      service.updateReminder('u1', 'missing', { time: '08:30' }),
    ).rejects.toThrow('Reminder not found');
  });
});
