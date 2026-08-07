import { Injectable } from '@nestjs/common';

import { ConversationStyleService } from '../../conversation-engine/services/conversation-style.service';

import { ResponsePlan } from '../types';

@Injectable()
export class ResponsePlanningService {
  constructor(
    private readonly conversationStyleService: ConversationStyleService,
  ) {}
  createPlan(): ResponsePlan {
    const style = this.conversationStyleService.getDefaultStyle();

    return {
      tone: style.tone,
      language: style.language,
      message: 'Response plan created',
      metadata: {
        formality: style.formality,
        source: 'personal-brain',
      },
    };
  }
}
