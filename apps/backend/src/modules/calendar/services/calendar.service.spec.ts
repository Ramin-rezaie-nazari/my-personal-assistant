import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CalendarService } from './calendar.service';

const makePrisma = () => ({
  reminder: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
});

const event = (overrides: Record<string, unknown> = {}) => ({
  id: 'e1',
  userId: 'u1',
  title: 'Gym',
  type: 'workout',
  scheduledAt: new Date('2026-08-14T18:00:00Z'),
  endsAt: null,
  completed: false,
  ...overrides,
});

describe('CalendarService', () => {
  it('creates a user-scoped event and persists its end time', async () => {
    const prisma = makePrisma();
    prisma.reminder.create.mockResolvedValue(
      event({ endsAt: new Date('2026-08-14T19:00:00Z') }),
    );
    const service = new CalendarService(prisma as never);

    const result = await service.createEvent('u1', {
      title: 'Gym',
      type: 'workout',
      startsAt: '2026-08-14T18:00:00Z',
      endsAt: '2026-08-14T19:00:00Z',
    });

    expect(prisma.reminder.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'u1',
        title: 'Gym',
        type: 'workout',
        scheduledAt: new Date('2026-08-14T18:00:00Z'),
        endsAt: new Date('2026-08-14T19:00:00Z'),
      }),
    });
    expect(result).toMatchObject({
      id: 'e1',
      startsAt: '2026-08-14T18:00:00.000Z',
      endsAt: '2026-08-14T19:00:00.000Z',
    });
  });

  it('normalizes title and defaults missing or blank type to general', async () => {
    const prisma = makePrisma();
    prisma.reminder.create.mockResolvedValue(
      event({ title: 'Gym', type: 'general' }),
    );
    const service = new CalendarService(prisma as never);

    await service.createEvent('u1', {
      title: '  Gym  ',
      type: '   ',
      startsAt: '2026-08-14T18:00:00Z',
    });
    expect(prisma.reminder.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ title: 'Gym', type: 'general' }),
    });
  });

  it('rejects missing or blank titles and invalid dates', async () => {
    const service = new CalendarService(makePrisma() as never);
    await expect(
      service.createEvent('u1', {
        title: '',
        type: 'general',
        startsAt: '2026-08-14T18:00:00Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.createEvent('u1', {
        title: '   ',
        type: 'general',
        startsAt: '2026-08-14T18:00:00Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.createEvent('u1', {
        title: 'Test',
        type: 'general',
        startsAt: '',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.createEvent('u1', {
        title: 'Test',
        type: 'general',
        startsAt: 'nope',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid event ranges, including equal start and end', async () => {
    const service = new CalendarService(makePrisma() as never);
    await expect(
      service.createEvent('u1', {
        title: 'Test',
        type: 'general',
        startsAt: '2026-08-14T19:00:00Z',
        endsAt: '2026-08-14T18:00:00Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.createEvent('u1', {
        title: 'Test',
        type: 'general',
        startsAt: '2026-08-14T19:00:00Z',
        endsAt: '2026-08-14T19:00:00Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.getEvents('u1', '2026-08-15T00:00:00Z', '2026-08-14T00:00:00Z'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns events sorted by scheduled time and scoped to the user', async () => {
    const prisma = makePrisma();
    prisma.reminder.findMany.mockResolvedValue([
      event({ id: 'e2', scheduledAt: new Date('2026-08-15T09:00:00Z') }),
      event({ id: 'e1', scheduledAt: new Date('2026-08-14T18:00:00Z') }),
    ]);
    const service = new CalendarService(prisma as never);
    const result = await service.getEvents(
      'u1',
      '2026-08-14T00:00:00Z',
      '2026-08-17T00:00:00Z',
    );
    expect(prisma.reminder.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'u1',
        scheduledAt: {
          gte: new Date('2026-08-14T00:00:00Z'),
          lt: new Date('2026-08-17T00:00:00Z'),
        },
      },
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'asc' }],
    });
    expect(result[0].id).toBe('e2');
  });

  it('uses a seven-day window when no range is provided', async () => {
    const prisma = makePrisma();
    prisma.reminder.findMany.mockResolvedValue([]);
    const service = new CalendarService(prisma as never);
    const before = Date.now();
    await service.getEvents('u1');
    const call = prisma.reminder.findMany.mock.calls[0][0];
    const from = call.where.scheduledAt.gte as Date;
    const to = call.where.scheduledAt.lt as Date;
    expect(from.getTime()).toBeGreaterThanOrEqual(before - 1000);
    expect(to.getTime() - from.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('updates title, type, start and end times for the owner', async () => {
    const prisma = makePrisma();
    prisma.reminder.findFirst
      .mockResolvedValueOnce(event())
      .mockResolvedValueOnce(
        event({
          title: 'Dinner',
          type: 'personal',
          scheduledAt: new Date('2026-08-14T20:00:00Z'),
          endsAt: new Date('2026-08-14T21:00:00Z'),
        }),
      );
    prisma.reminder.updateMany.mockResolvedValue({ count: 1 });
    const service = new CalendarService(prisma as never);

    const result = await service.updateEvent('u1', 'e1', {
      title: 'Dinner',
      type: 'personal',
      startsAt: '2026-08-14T20:00:00Z',
      endsAt: '2026-08-14T21:00:00Z',
    });

    expect(prisma.reminder.updateMany).toHaveBeenCalledWith({
      where: { id: 'e1', userId: 'u1' },
      data: {
        title: 'Dinner',
        type: 'personal',
        scheduledAt: new Date('2026-08-14T20:00:00Z'),
        endsAt: new Date('2026-08-14T21:00:00Z'),
      },
    });
    expect(result.title).toBe('Dinner');
  });

  it('normalizes update fields and clears an end time explicitly', async () => {
    const prisma = makePrisma();
    prisma.reminder.findFirst
      .mockResolvedValueOnce(
        event({ endsAt: new Date('2026-08-14T19:00:00Z') }),
      )
      .mockResolvedValueOnce(
        event({ title: 'Dinner', type: 'general', endsAt: null }),
      );
    prisma.reminder.updateMany.mockResolvedValue({ count: 1 });
    const service = new CalendarService(prisma as never);
    await service.updateEvent('u1', 'e1', {
      title: '  Dinner  ',
      type: '   ',
      endsAt: null,
    });
    expect(prisma.reminder.updateMany).toHaveBeenCalledWith({
      where: { id: 'e1', userId: 'u1' },
      data: { title: 'Dinner', type: 'general', endsAt: null },
    });
  });

  it('rejects empty updates, empty titles, invalid dates, and invalid ranges', async () => {
    const prisma = makePrisma();
    prisma.reminder.findFirst.mockResolvedValue(event());
    const service = new CalendarService(prisma as never);
    await expect(service.updateEvent('u1', 'e1', {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      service.updateEvent('u1', 'e1', { title: '   ' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.updateEvent('u1', 'e1', { startsAt: 'nope' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.updateEvent('u1', 'e1', { endsAt: '2026-08-14T17:00:00Z' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects update of an event that is not owned by the user', async () => {
    const prisma = makePrisma();
    prisma.reminder.findFirst.mockResolvedValue(null);
    const service = new CalendarService(prisma as never);
    await expect(
      service.updateEvent('u1', 'other', { title: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.reminder.updateMany).not.toHaveBeenCalled();
  });

  it('updates time safely and rejects malformed or out-of-range times', async () => {
    const prisma = makePrisma();
    prisma.reminder.updateMany.mockResolvedValue({ count: 1 });
    prisma.reminder.findFirst
      .mockResolvedValueOnce(event())
      .mockResolvedValueOnce(
        event({ scheduledAt: new Date('2026-08-14T19:00:00Z') }),
      );
    const service = new CalendarService(prisma as never);

    expect(await service.updateEventTime('u1', 'e1', '19:00')).toMatchObject({
      startsAt: '2026-08-14T19:00:00.000Z',
    });
    expect(prisma.reminder.updateMany).toHaveBeenCalledWith({
      where: { id: 'e1', userId: 'u1' },
      data: { scheduledAt: new Date('2026-08-14T19:00:00Z') },
    });
    await expect(
      service.updateEventTime('u1', 'e1', '9:00'),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.updateEventTime('u1', 'e1', '24:00'),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.updateEventTime('u1', 'e1', '12:60'),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.updateEventTime('u1', 'e1', 'abc'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a time change that would move the start after the existing end', async () => {
    const prisma = makePrisma();
    prisma.reminder.findFirst.mockResolvedValue(
      event({ endsAt: new Date('2026-08-14T18:30:00Z') }),
    );
    const service = new CalendarService(prisma as never);
    await expect(
      service.updateEventTime('u1', 'e1', '19:00'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.reminder.updateMany).not.toHaveBeenCalled();
  });

  it('rejects time changes for another user event', async () => {
    const prisma = makePrisma();
    prisma.reminder.findFirst.mockResolvedValue(null);
    const service = new CalendarService(prisma as never);
    await expect(
      service.updateEventTime('u1', 'other', '19:00'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.reminder.updateMany).not.toHaveBeenCalled();
  });

  it('completes, reopens, and deletes owned events', async () => {
    const prisma = makePrisma();
    prisma.reminder.updateMany.mockResolvedValue({ count: 1 });
    prisma.reminder.deleteMany.mockResolvedValue({ count: 1 });
    const service = new CalendarService(prisma as never);

    expect(await service.completeEvent('u1', 'e1')).toEqual({
      id: 'e1',
      completed: true,
    });
    expect(await service.reopenEvent('u1', 'e1')).toEqual({
      id: 'e1',
      completed: false,
    });
    expect(await service.deleteEvent('u1', 'e1')).toEqual({
      id: 'e1',
      deleted: true,
    });
    expect(prisma.reminder.updateMany).toHaveBeenNthCalledWith(1, {
      where: { id: 'e1', userId: 'u1', completed: false },
      data: { completed: true },
    });
    expect(prisma.reminder.updateMany).toHaveBeenNthCalledWith(2, {
      where: { id: 'e1', userId: 'u1', completed: true },
      data: { completed: false },
    });
    expect(prisma.reminder.deleteMany).toHaveBeenCalledWith({
      where: { id: 'e1', userId: 'u1' },
    });
  });

  it('is idempotent for complete and reopen when the event is already in the requested state', async () => {
    const prisma = makePrisma();
    prisma.reminder.updateMany.mockResolvedValue({ count: 0 });
    prisma.reminder.findFirst.mockResolvedValue(event({ completed: true }));
    const service = new CalendarService(prisma as never);
    expect(await service.completeEvent('u1', 'e1')).toEqual({
      id: 'e1',
      completed: true,
    });
    expect(await service.reopenEvent('u1', 'e1')).toEqual({
      id: 'e1',
      completed: false,
    });
  });

  it('does not update, complete, reopen, or delete another user event', async () => {
    const prisma = makePrisma();
    prisma.reminder.findFirst.mockResolvedValue(null);
    prisma.reminder.updateMany.mockResolvedValue({ count: 0 });
    prisma.reminder.deleteMany.mockResolvedValue({ count: 0 });
    const service = new CalendarService(prisma as never);

    await expect(
      service.updateEvent('u1', 'other', { title: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.completeEvent('u1', 'other')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.reopenEvent('u1', 'other')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.deleteEvent('u1', 'other')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.reminder.deleteMany).toHaveBeenCalledWith({
      where: { id: 'other', userId: 'u1' },
    });
  });
});
