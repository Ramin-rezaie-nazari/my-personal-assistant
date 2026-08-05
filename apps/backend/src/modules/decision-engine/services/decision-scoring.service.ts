import { Injectable } from '@nestjs/common';

@Injectable()
export class DecisionScoringService {
  async scoreDecision() {
    await Promise.resolve();

    return {
      score: 0,
    };
  }
}
