import { Injectable } from '@nestjs/common';

@Injectable()
export class MemoryScoringService {
  async scoreMemory() {
    await Promise.resolve();

    return {
      score: 0,
    };
  }
}
