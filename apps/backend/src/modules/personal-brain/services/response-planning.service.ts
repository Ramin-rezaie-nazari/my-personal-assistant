import { Injectable } from '@nestjs/common';

import { ResponsePlan } from '../types';

@Injectable()
export class ResponsePlanningService {
  createPlan(): ResponsePlan {
    return {
      tone: 'friendly',

      language: 'fa',

      message: 'Response plan created',

      metadata: {
        source: 'personal-brain',
      },
    };
  }
}
