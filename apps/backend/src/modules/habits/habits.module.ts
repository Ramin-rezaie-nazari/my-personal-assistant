import { Module } from '@nestjs/common';
import { HabitsController } from './controllers/habits.controller';
import { HabitsService } from './services/habits.service';

@Module({
  controllers: [HabitsController],
  providers: [HabitsService],
  exports: [HabitsService],
})
export class HabitsModule {}
