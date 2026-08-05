import { Injectable } from '@nestjs/common';

@Injectable()
export class RuleEvaluationService {
  async evaluateRules() {
    await Promise.resolve();

    return {
      message: 'Rules evaluated',
    };
  }
}
