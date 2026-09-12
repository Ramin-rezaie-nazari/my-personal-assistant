import { Injectable } from '@nestjs/common';

@Injectable()
export class GoalProgressService {
  async trackProgress() {
    await Promise.resolve();

    return {
      progressTracked: true,
    };
  }
}
