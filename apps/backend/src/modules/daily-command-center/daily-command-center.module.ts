import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { DailyCommandCenterController } from './daily-command-center.controller';
import { DailyCommandCenterService } from './daily-command-center.service';

@Module({
  imports: [NotificationsModule],
  controllers: [DailyCommandCenterController],
  providers: [DailyCommandCenterService],
})
export class DailyCommandCenterModule {}
