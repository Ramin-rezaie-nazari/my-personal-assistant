import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/database/prisma.module';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationsService } from './services/notifications.service';
import { SmartNotificationService } from './services/smart-notification.service';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, SmartNotificationService],
  exports: [NotificationsService, SmartNotificationService],
})
export class NotificationsModule {}
