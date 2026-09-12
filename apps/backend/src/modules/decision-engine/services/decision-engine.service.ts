import { Injectable } from '@nestjs/common';

@Injectable()
export class DecisionEngineService {
  async makeDecision() {
    await Promise.resolve();

    return {
      message: 'Decision generated',
      actions: [],
    };
  }
}
