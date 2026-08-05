import { Injectable } from '@nestjs/common';

@Injectable()
export class HabitsService {
  async createHabit() {
    await Promise.resolve();

    return {
      message: 'Habit created',
    };
  }

  async getHabits() {
    await Promise.resolve();

    return [];
  }
}
