import { Injectable } from '@nestjs/common';

import { ConversationStyleService } from '../../conversation-engine/services/conversation-style.service';

import { BrainDecisionResult, ResponsePlan } from '../types';

@Injectable()
export class ResponsePlanningService {
  constructor(
    private readonly conversationStyleService: ConversationStyleService,
  ) {}

  createPlan(decision: BrainDecisionResult): ResponsePlan {
    const style = this.conversationStyleService.getDefaultStyle();

    return {
      tone: style.tone,

      language: style.language,

      message:
        decision.recommendation ?? 'I need more information to help you better',

      intent: decision.intent ?? 'general',

      confidence: decision.confidence,

      nextAction: decision.nextAction,

      decision,

      metadata: {
        formality: style.formality,
        source: 'personal-brain',
      },
    };
  }
}
