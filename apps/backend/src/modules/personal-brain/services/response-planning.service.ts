import { Injectable } from '@nestjs/common';

import { ConversationStyleService } from '../../conversation-engine/services/conversation-style.service';

import { ResponsePlan, ResponsePlanningInput } from '../types';

@Injectable()
export class ResponsePlanningService {
  constructor(
    private readonly conversationStyleService: ConversationStyleService,
  ) {}

  createPlan(input: ResponsePlanningInput): ResponsePlan {
    const style = this.conversationStyleService.getDefaultStyle();

    const message = input.decision.canDecide
      ? (input.decision.recommendation ??
        'I can provide goal-specific guidance')
      : (input.decision.nextAction ??
        'I need more information to help you better');

    return {
      tone: style.tone,
      language: style.language,
      message,
      metadata: {
        formality: style.formality,
        source: 'personal-brain',
        canDecide: input.decision.canDecide,
        confidence: input.decision.confidence,
        blockers: input.decision.blockers,
        intent: input.decision.intent ?? 'general',
      },
    };
  }
}
