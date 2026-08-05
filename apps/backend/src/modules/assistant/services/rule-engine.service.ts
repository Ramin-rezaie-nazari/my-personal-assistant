import { Injectable } from '@nestjs/common';

@Injectable()
export class RuleEngineService {
  evaluate() {
    return {
      success: true,
      engine: 'Rule Engine',
    };
  }
}
