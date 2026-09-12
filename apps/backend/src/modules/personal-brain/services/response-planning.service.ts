import { Injectable } from '@nestjs/common';

import { ConversationStyleService } from '../../conversation-engine/services/conversation-style.service';

import { ResponsePlan, ResponsePlanningInput } from '../types';
import { ConversationLanguage } from '../../conversation-engine/types';

@Injectable()
export class ResponsePlanningService {
  constructor(
    private readonly conversationStyleService: ConversationStyleService,
  ) {}

  createPlan(input: ResponsePlanningInput): ResponsePlan {
    const requestedLanguage = input.reasoningContext.userContext.preferences?.language;
    const language: ConversationLanguage = requestedLanguage === 'fa' || requestedLanguage === 'en' ? requestedLanguage : 'en';
    const style = this.conversationStyleService.getDefaultStyle(language);

    const message = input.decision.canDecide
      ? (input.decision.recommendation ?? (language === 'fa' ? 'می‌توانم بر اساس هدف تو راهنمایی بدهم.' : 'I can provide goal-specific guidance.'))
      : (input.decision.nextAction ?? (language === 'fa' ? 'برای کمک دقیق‌تر به اطلاعات بیشتری نیاز دارم.' : 'I need more information to help you better.'));

    return {
      tone: style.tone,
      language: style.language,
      message,
      intent: input.decision.intent ?? 'general',
      confidence: input.decision.confidence,
      nextAction: input.decision.nextAction,
      decision: input.decision,
      metadata: {
        formality: style.formality,
        source: 'personal-brain',
        canDecide: input.decision.canDecide,
        blockers: input.decision.blockers,
      },
    };
  }
}
