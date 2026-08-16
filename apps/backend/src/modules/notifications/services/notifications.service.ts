import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../common/database/prisma.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { messages, normalizeLocale } from '../../../common/i18n/locale';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createNotification(userId: string, dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        userId,
        title: dto.title.trim(),
        body: dto.body?.trim() || null,
        type: dto.type.trim() || 'general',
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        dedupeKey: `manual:${randomUUID()}`,
        priority: dto.priority ?? 2,
      },
    });
  }

  async createSystemNotification(
    userId: string,
    type: keyof typeof messages.en.notifications,
    body?: string,
    scheduledAt?: Date,
  ) {
    const settings = await this.prisma.userSettings.findUnique({
      where: { userId },
      select: { language: true },
    });
    const locale = normalizeLocale(settings?.language);
    const title = messages[locale].notifications[type];
    return this.prisma.notification.create({
      data: {
        userId,
        title,
        body: body?.trim() || null,
        type,
        scheduledAt,
        dedupeKey: `system:${type}:${scheduledAt?.toISOString() ?? randomUUID()}`,
        priority: 2,
      },
    });
  }

  async getNotifications(userId: string, includeRead = false) {
    return this.prisma.notification.findMany({
      where: { userId, ...(includeRead ? {} : { readAt: null }) },
      orderBy: [{ priority: 'asc' }, { readAt: 'asc' }, { createdAt: 'desc' }],
      take: 50,
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }

  async markRead(userId: string, notificationId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { id: notificationId, userId, readAt: null },
      data: { readAt: new Date() },
    });
    if (result.count === 0) {
      const exists = await this.prisma.notification.findFirst({
        where: { id: notificationId, userId },
        select: { id: true },
      });
      if (!exists) throw new NotFoundException('Notification not found');
    }
    return { id: notificationId, read: true };
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  }
}
