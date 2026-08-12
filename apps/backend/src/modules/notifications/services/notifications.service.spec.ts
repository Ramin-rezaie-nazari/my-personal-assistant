import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

const makePrisma = () => ({
  notification: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    updateMany: jest.fn(),
  },
});

describe('NotificationsService', () => {
  it('creates a notification for the authenticated owner', async () => {
    const prisma = makePrisma();
    prisma.notification.create.mockResolvedValue({ id: 'n1', userId: 'u1' });
    const service = new NotificationsService(prisma as never);

    await service.createNotification('u1', {
      title: 'Drink water',
      body: 'You are behind on hydration.',
      type: 'hydration',
      scheduledAt: new Date('2026-08-12T10:00:00.000Z'),
      priority: 1,
    });

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 'u1',
        title: 'Drink water',
        body: 'You are behind on hydration.',
        type: 'hydration',
        scheduledAt: new Date('2026-08-12T10:00:00.000Z'),
        dedupeKey: expect.stringMatching(/^manual:/),
        priority: 1,
      },
    });
  });

  it('returns unread notifications only by default and scopes by user', async () => {
    const prisma = makePrisma();
    prisma.notification.findMany.mockResolvedValue([]);
    const service = new NotificationsService(prisma as never);

    await service.getNotifications('u1');

    expect(prisma.notification.findMany).toHaveBeenCalledWith({
      where: { userId: 'u1', readAt: null },
      orderBy: [{ priority: 'asc' }, { readAt: 'asc' }, { createdAt: 'desc' }],
      take: 50,
    });
  });

  it('returns an exact unread count for the authenticated owner', async () => {
    const prisma = makePrisma();
    prisma.notification.count.mockResolvedValue(3);
    const service = new NotificationsService(prisma as never);

    await expect(service.getUnreadCount('u1')).resolves.toBe(3);
    expect(prisma.notification.count).toHaveBeenCalledWith({
      where: { userId: 'u1', readAt: null },
    });
  });

  it('marks only an owned unread notification as read', async () => {
    const prisma = makePrisma();
    prisma.notification.updateMany.mockResolvedValue({ count: 1 });
    const service = new NotificationsService(prisma as never);

    await expect(service.markRead('u1', 'n1')).resolves.toEqual({
      id: 'n1',
      read: true,
    });

    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { id: 'n1', userId: 'u1', readAt: null },
      data: { readAt: expect.any(Date) },
    });
  });

  it('marks all unread notifications for only the authenticated owner', async () => {
    const prisma = makePrisma();
    prisma.notification.updateMany.mockResolvedValue({ count: 4 });
    const service = new NotificationsService(prisma as never);

    await expect(service.markAllRead('u1')).resolves.toEqual({ updated: 4 });

    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u1', readAt: null },
      data: { readAt: expect.any(Date) },
    });
  });

  it('does not leak another user notification ids', async () => {
    const prisma = makePrisma();
    prisma.notification.updateMany.mockResolvedValue({ count: 0 });
    prisma.notification.findFirst.mockResolvedValue(null);
    const service = new NotificationsService(prisma as never);

    await expect(service.markRead('u1', 'other-user-notification')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(prisma.notification.findFirst).toHaveBeenCalledWith({
      where: { id: 'other-user-notification', userId: 'u1' },
      select: { id: true },
    });
  });
});
