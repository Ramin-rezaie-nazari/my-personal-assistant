import { Injectable } from '@nestjs/common';

@Injectable()
export class WorkoutService {
  async createWorkout() {
    await Promise.resolve();

    return {
      message: 'Workout created',
    };
  }

  async getWorkouts() {
    await Promise.resolve();

    return [];
  }
}
