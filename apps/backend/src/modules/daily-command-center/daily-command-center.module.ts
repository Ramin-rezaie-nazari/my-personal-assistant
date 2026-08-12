import { Module } from '@nestjs/common';
import { DailyCommandCenterController } from './daily-command-center.controller';
import { DailyCommandCenterService } from './daily-command-center.service';

@Module({
  controllers: [DailyCommandCenterController],
  providers: [DailyCommandCenterService],
})
export class DailyCommandCenterModule {}
