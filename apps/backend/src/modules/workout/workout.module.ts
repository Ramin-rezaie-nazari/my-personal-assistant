import { Module } from '@nestjs/common';
import { WorkoutController } from './controllers/workout.controller';
import { WorkoutService } from './services/workout.service';

@Module({
  controllers: [WorkoutController],
  providers: [WorkoutService],
  exports: [WorkoutService],
})
export class WorkoutModule {}
