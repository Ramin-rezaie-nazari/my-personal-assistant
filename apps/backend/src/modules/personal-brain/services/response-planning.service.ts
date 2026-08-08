import { Injectable } from '@nestjs/common';

import { BrainDecisionResult, ResponsePlan } from '../types';

import { ConversationStyleService } from '../../conversation-engine/services/conversation-style.service';

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
      nextAction: decision.nextAction,
      metadata: {
        formality: style.formality,
        source: 'personal-brain',
        blockers: decision.blockers,
      },
    };
  }
}
