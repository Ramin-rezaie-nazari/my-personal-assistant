import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from '../dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  async createNotification(dto: CreateNotificationDto) {
    await Promise.resolve();

    return {
      message: 'Notification created',
      data: dto,
    };
  }

  async getNotifications() {
    await Promise.resolve();

    return [];
  }
}
