import { Controller, Get, Post } from '@nestjs/common';
import { WorkoutService } from '../services/workout.service';

@Controller('workout')
export class WorkoutController {
  constructor(private readonly workoutService: WorkoutService) {}

  @Post()
  createWorkout() {
    return this.workoutService.createWorkout();
  }

  @Get()
  getWorkouts() {
    return this.workoutService.getWorkouts();
  }
}
