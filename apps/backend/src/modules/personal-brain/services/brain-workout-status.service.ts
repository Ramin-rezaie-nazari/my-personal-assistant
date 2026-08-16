import { Injectable } from '@nestjs/common';

import { WorkoutService } from '../../workout/services/workout.service';
import { BrainWorkoutStatus } from '../types';

@Injectable()
export class BrainWorkoutStatusService {
  constructor(private readonly workoutService: WorkoutService) {}

  async getThisWeek(userId: string): Promise<BrainWorkoutStatus> {
    return this.workoutService.getWeeklySummary(userId);
  }
}
