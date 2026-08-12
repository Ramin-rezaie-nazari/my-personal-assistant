import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';

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
      },
    });
  }

  async getNotifications(userId: string, includeRead = false) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(includeRead ? {} : { readAt: null }),
      },
      orderBy: [{ readAt: 'asc' }, { createdAt: 'desc' }],
      take: 50,
    });
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
}
