import { Injectable } from '@nestjs/common';

import { ConversationStyleService } from '../../conversation-engine/services/conversation-style.service';

import { ResponsePlan, ResponsePlanningInput } from '../types';

const EXECUTABLE_ACTIONS = new Set([
  'create_reminder',
  'update_reminder',
  'cancel_reminder',
  'update_calendar_event',
  'cancel_calendar_event',
  'update_workout',
  'delete_workout',
  'complete_habit',
  'update_habit',
  'delete_habit',
  'take_supplement',
  'update_supplement',
  'delete_supplement',
]);

@Injectable()
export class ResponsePlanningService {
  constructor(
    private readonly conversationStyleService: ConversationStyleService,
  ) {}

  createPlan(input: ResponsePlanningInput): ResponsePlan {
    const style = this.conversationStyleService.getDefaultStyle();
    const userInput = input.reasoningContext.input.trim();
    const persian = /[\u0600-\u06ff]/u.test(userInput);
    const normalized = userInput
      .toLowerCase()
      .replace(/[؟?!،,.]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const greeting = /^(سلام|درود|سلام خوبی|سلام حالت خوبه|خسته نباشی|صبح بخیر|ظهر بخیر|عصر بخیر|شب بخیر)$/u.test(normalized);

    if (greeting) {
      return {
        tone: style.tone,
        language: 'fa',
        message: 'سلام 🌷 خوش اومدی. من کنارتم؛ بگو امروز دوست داری توی چی کمکت کنم؟',
        intent: 'conversation',
        confidence: Math.max(input.decision.confidence, 0.95),
        nextAction: undefined,
        decision: input.decision,
        metadata: {
          formality: style.formality,
          source: 'personal-brain',
          canDecide: true,
          blockers: [],
          responseLanguage: 'fa',
        },
      };
    }

    const rawMessage = input.decision.canDecide
      ? (input.decision.recommendation ?? 'I can provide goal-specific guidance')
      : (input.decision.nextAction ?? 'I need more information to help you better');

    const message = persian
      ? this.toPersianMessage(rawMessage, input.decision.intent)
      : rawMessage;

    const nextAction = this.isExecutableAction(input.decision.nextAction)
      ? input.decision.nextAction
      : undefined;

    return {
      tone: style.tone,
      language: persian ? 'fa' : style.language,
      message:
        !input.decision.canDecide && persian
          ? 'حتماً. برای اینکه دقیق‌تر کمکت کنم، بگو الان دقیقاً می‌خوای چه کاری برات انجام بدم؟'
          : message,
      intent: input.decision.intent ?? 'general',
      confidence: input.decision.confidence,
      nextAction,
      decision: input.decision,
      metadata: {
        formality: style.formality,
        source: 'personal-brain',
        canDecide: input.decision.canDecide,
        blockers: input.decision.blockers,
        responseLanguage: persian ? 'fa' : style.language,
      },
    };
  }

  private isExecutableAction(action?: string): boolean {
    return Boolean(action && EXECUTABLE_ACTIONS.has(action));
  }

  private toPersianMessage(message: string, intent?: string): string {
    if (/^Your current primary goal is:\s*/i.test(message)) {
      return message.replace(/^Your current primary goal is:\s*/i, 'هدف اصلی فعلی‌ات اینه: ');
    }
    if (/^Today:\s*/i.test(message)) {
      return message.replace(/^Today:\s*/i, 'امروز: ').replace(/\. Remaining:\s*/i, '. باقی‌مانده: ');
    }
    if (intent === 'habit-status' && /^Habits:/i.test(message)) {
      return message
        .replace(/^Habits:/i, 'عادت‌ها:')
        .replace(/ active,/i, ' فعال،')
        .replace(/ completions this week,/i, ' تکمیل این هفته،')
        .replace(/ completion,/i, ' درصد تکمیل،')
        .replace(/ best current streak /i, ' بهترین رکورد فعلی ')
        .replace(/ days\./i, ' روز.');
    }
    if (intent === 'workout-status' && /^This week:/i.test(message)) {
      return message
        .replace(/^This week:/i, 'این هفته:')
        .replace(/ workouts across /i, ' تمرین در ')
        .replace(/ active days,/i, ' روز فعال،')
        .replace(/ minutes,/i, ' دقیقه،')
        .replace(/ kcal burned,/i, ' کیلوکالری مصرف‌شده،')
        .replace(/ consistency,/i, ' درصد استمرار،')
        .replace(/ current streak /i, ' رکورد فعلی ')
        .replace(/ days\./i, ' روز.');
    }
    return message;
  }
}
