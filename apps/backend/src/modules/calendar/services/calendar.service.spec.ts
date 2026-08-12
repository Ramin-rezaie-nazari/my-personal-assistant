import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CalendarService } from './calendar.service';

const makePrisma = () => ({
  reminder: {
    create: jest.fn(),
    findMany: jest.fn(),
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

  it('does not complete another users event', async () => {
    const prisma = makePrisma();
    prisma.reminder.updateMany.mockResolvedValue({ count: 0 });
    const service = new CalendarService(prisma as never);
    await expect(service.completeEvent('u1', 'other')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.reminder.updateMany).toHaveBeenCalledWith({ where: { id: 'other', userId: 'u1' }, data: { completed: true } });
  });
});
