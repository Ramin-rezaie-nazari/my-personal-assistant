import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CalendarService } from './calendar.service';

const makePrisma = () => ({
  reminder: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    updateMany: jest.fn(),
  },
});

describe('CalendarService', () => {
  it('creates a user-scoped event through the reminder store', async () => {
    const prisma = makePrisma();
    prisma.reminder.create.mockResolvedValue({ id: 'e1', title: 'Gym', type: 'workout', scheduledAt: new Date('2026-08-12T18:00:00Z'), completed: false });
    const service = new CalendarService(prisma as never);
    const result = await service.createEvent('u1', { title: 'Gym', type: 'workout', startsAt: '2026-08-12T18:00:00Z' });
    expect(prisma.reminder.create).toHaveBeenCalledWith({ data: { userId: 'u1', title: 'Gym', type: 'workout', scheduledAt: new Date('2026-08-12T18:00:00Z') } });
    expect(result.id).toBe('e1');
  });

  it('rejects invalid ranges', async () => {
    const service = new CalendarService(makePrisma() as never);
    await expect(service.getEvents('u1', '2026-08-13T00:00:00Z', '2026-08-12T00:00:00Z')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('changes only the time while preserving the event date', async () => {
    const prisma = makePrisma();
    const existing = new Date('2026-08-14T17:00:00Z');
    const updated = new Date('2026-08-14T18:00:00Z');
    prisma.reminder.findFirst
      .mockResolvedValueOnce({ id: 'e1', userId: 'u1', title: 'Meeting', type: 'work', scheduledAt: existing, completed: false })
      .mockResolvedValueOnce({ id: 'e1', userId: 'u1', title: 'Meeting', type: 'work', scheduledAt: updated, completed: false });
    prisma.reminder.updateMany.mockResolvedValue({ count: 1 });
    const service = new CalendarService(prisma as never);

    const result = await service.updateEventTime('u1', 'e1', '18:00');

    const scheduledAt = prisma.reminder.updateMany.mock.calls[0][0].data.scheduledAt as Date;
    expect(scheduledAt.toISOString()).toBe(updated.toISOString());
    expect(result.startsAt).toBe(updated.toISOString());
  });

  it('does not update another user event', async () => {
    const prisma = makePrisma();
    prisma.reminder.findFirst.mockResolvedValue(null);
    const service = new CalendarService(prisma as never);

    await expect(service.updateEventTime('u1', 'e2', '18:00')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.reminder.updateMany).not.toHaveBeenCalled();
  });

  it('does not complete another users event', async () => {
    const prisma = makePrisma();
    prisma.reminder.updateMany.mockResolvedValue({ count: 0 });
    const service = new CalendarService(prisma as never);
    await expect(service.completeEvent('u1', 'other')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.reminder.updateMany).toHaveBeenCalledWith({ where: { id: 'other', userId: 'u1' }, data: { completed: true } });
  });
});
