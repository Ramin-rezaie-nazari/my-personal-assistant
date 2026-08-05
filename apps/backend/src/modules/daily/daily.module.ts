import { Module } from '@nestjs/common';
import { DailyController } from './controllers/daily.controller';
import { DailyService } from './services/daily.service';

@Module({
  controllers: [DailyController],
  providers: [DailyService],
  exports: [DailyService],
})
export class DailyModule {}
