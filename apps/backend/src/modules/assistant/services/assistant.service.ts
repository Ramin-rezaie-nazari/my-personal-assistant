import { Injectable, Optional } from '@nestjs/common';

import { BrainOrchestratorService } from '../../personal-brain/services/brain-orchestrator.service';
import { NaturalActionExecutionService } from './natural-action-execution.service';
import { ContextualCommandService } from './contextual-command.service';
import { ConversationContextService } from './conversation-context.service';
import { LocalLanguageUnderstandingService } from './local-language-understanding.service';
import { PlanningService } from './planning.service';
import { BrainResponse } from '../../personal-brain/types';

@Injectable()
export class AssistantService {
  constructor(
    private readonly brainOrchestratorService: BrainOrchestratorService,
    private readonly naturalActionExecutionService: NaturalActionExecutionService,
    private readonly contextualCommandService: ContextualCommandService,
    private readonly conversationContextService: ConversationContextService,
    @Optional()
    private readonly localLanguageUnderstandingService?: LocalLanguageUnderstandingService,
    @Optional() private readonly planningService?: PlanningService,
  ) {}

  async getStatus() {
    return { name: 'My Personal Assistant', status: 'brain foundation active' };
  }

  async getHistory(userId: string, limit = 24) {
    const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
    return (await this.conversationContextService.get(userId)).turns.slice(
      -safeLimit,
    );
  }

  async confirm(userId: string, token: string) {
    const receipt = await this.naturalActionExecutionService.confirm(
      userId,
      token,
    );
    await this.conversationContextService.append({
      userId,
      role: 'assistant',
      text:
        receipt.status === 'completed'
          ? 'تأیید شد و انجام شد.'
          : receipt.reason,
      action: receipt.action,
      executionId: receipt.decisionId,
      resourceType: this.resourceTypeFor(receipt.action),
    });
    return receipt;
  }

  async process(input: string, userId: string) {
    await this.conversationContextService.append({
      userId,
      role: 'user',
      text: input,
    });
    const contextualCommand = await this.contextualCommandService.resolve(
      userId,
      input,
    );
    const local = this.localLanguageUnderstandingService?.understand(input);
    const plan = this.planningService
      ? await this.planningService.createPlan({
          clauses: contextualCommand.clauses,
          intents: contextualCommand.intents,
          contradictions: contextualCommand.contradictions,
          confidence: contextualCommand.confidence,
        })
      : ({ requiresClarification: false, reason: 'not_available' } as any);
    const response = plan.requiresClarification
      ? ({
          intent: 'assistant',
          nextAction: undefined,
          message:
            plan.reason === 'conflicting_request'
              ? 'یه بخش از درخواستت با بخش دیگه تناقض داره؛ قبل از انجامش باید مشخص کنی دقیقاً کدوم رو می‌خوای.'
              : 'برای اینکه درست انجامش بدم، یه بخش از درخواستت نیاز به توضیح بیشتر داره.',
          confidence: contextualCommand.confidence,
          metadata: { local: true, clarification: true },
        } as BrainResponse)
      : ((local ? this.responseForLocalIntent(local) : undefined) ??
        (await this.brainOrchestratorService.processRequest(input, userId)));
    const executionResponse = this.resolveContextualExecution(
      response,
      contextualCommand,
      input,
    );
    const execution = executionResponse.nextAction
      ? await this.naturalActionExecutionService.execute(
          input,
          userId,
          executionResponse,
          {
            userId,
            referencesPrevious: contextualCommand.referencesPrevious,
            previousAction: contextualCommand.targetAction,
            previousExecutionId: contextualCommand.targetExecutionId,
            targetResourceType: contextualCommand.targetResourceType,
            targetResourceId: contextualCommand.targetResourceId,
            operation: contextualCommand.operation,
            localUnderstanding: local,
            localPlan: plan,
          },
        )
      : undefined;

    const finalResponse = {
      ...executionResponse,
      message: execution?.executed
        ? execution.message
        : (execution?.message ?? executionResponse.message),
      ...(execution ? { execution } : {}),
      metadata: {
        ...(executionResponse.metadata ?? {}),
        localUnderstanding: local,
        contextualCommand,
        localPlan: plan,
      },
    };
    const receipt = execution?.receipt;
    const resourceId =
      receipt &&
      typeof receipt === 'object' &&
      receipt !== null &&
      'result' in receipt
        ? this.extractExecutionEntityId(
            (receipt as { result?: unknown }).result,
          )
        : undefined;
    const executionId = this.extractDecisionId(receipt);
    const resourceType = this.resourceTypeFor(
      execution?.action ?? finalResponse.nextAction,
    );
    await this.conversationContextService.append({
      userId,
      role: 'assistant',
      text: finalResponse.message,
      intent: finalResponse.intent,
      action: execution?.action ?? finalResponse.nextAction,
      executionId,
      resourceType,
      resourceId,
    });
    return finalResponse;
  }

  private responseForLocalIntent(
    local: ReturnType<LocalLanguageUnderstandingService['understand']>,
  ): BrainResponse | undefined {
    if (local.intent === 'UNKNOWN' || local.confidence < 0.7) return undefined;
    const map: Record<
      string,
      { intent: string; nextAction: string; message: string }
    > = {
      ADD_TO_BASKET: {
        intent: 'shopping',
        nextAction: 'add_to_basket',
        message: 'باشه، به سبد خرید اضافه‌اش می‌کنم.',
      },
      REMOVE_FROM_BASKET: {
        intent: 'shopping',
        nextAction: 'remove_from_basket',
        message: 'باشه، از سبد خرید حذفش می‌کنم.',
      },
      RECOMMEND_MEAL: {
        intent: 'nutrition',
        nextAction: 'recommend_meal',
        message: 'حتماً، بر اساس اطلاعات خودت یک گزینه مناسب پیدا می‌کنم.',
      },
      GET_NUTRITION_SUMMARY: {
        intent: 'nutrition',
        nextAction: 'get_nutrition_summary',
        message: 'حتماً، خلاصه تغذیه امروزت رو بررسی می‌کنم.',
      },
      ADD_WATER: {
        intent: 'hydration',
        nextAction: 'add_water',
        message: 'حتماً، مقدار آب مصرفی‌ات رو ثبت می‌کنم.',
      },
      CREATE_REMINDER: {
        intent: 'reminder',
        nextAction: 'create_reminder',
        message: 'حتماً، یادآوری رو برایت آماده می‌کنم.',
      },
      UPDATE_REQUEST: {
        intent: 'assistant',
        nextAction: 'update_contextual_request',
        message: 'باشه، درخواست قبلی رو با تغییر جدیدت به‌روزرسانی می‌کنم.',
      },
      CANCEL_REQUEST: {
        intent: 'assistant',
        nextAction: 'cancel_contextual_request',
        message: 'باشه، درخواست قبلی رو لغو می‌کنم.',
      },
    };
    const selected = map[local.intent];
    return selected
      ? {
          ...selected,
          confidence: local.confidence,
          metadata: { local: true, entities: local.entities },
        }
      : undefined;
  }

  private resolveContextualExecution(
    response: BrainResponse,
    command: Awaited<ReturnType<ContextualCommandService['resolve']>>,
    input: string,
  ): BrainResponse {
    if (
      !command.referencesPrevious ||
      !(command.targetResourceId || command.targetExecutionId)
    )
      return response;
    const entities = command.entities ?? {};
    const previousAction = (command.targetAction ?? '').toLowerCase();
    const previousResource = (command.targetResourceType ?? '').toLowerCase();
    const normalizedInput = input
      .trim()
      .toLowerCase()
      .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)));
    const hasTime = /(?:^|\s)(?:[01]?\d|2[0-3]):[0-5]\d(?:\s|$)/.test(normalizedInput);
    const hasDuration = /(?:^|\s)\d{1,3}\s*(?:min|mins|minute|minutes|دقیقه)(?:\s|$)/iu.test(normalizedInput);
    const hasCalories = /(?:^|\s)\d{2,5}\s*(?:cal|calories|کالری)(?:\s|$)/iu.test(normalizedInput);
    const hasWeekTarget = /(?:^|\s)[1-7]\s*(?:times?|x|بار|مرتبه)(?:(?:\s+(?:per|a)?\s*week)|(?:\s*در\s*هفته))?(?:\s|$)/iu.test(normalizedInput);
    if (command.operation === 'update' && previousResource === 'calendar' && hasTime) return { ...response, intent: 'calendar', nextAction: 'update_calendar_event' };
    if (command.operation === 'cancel' && previousResource === 'calendar') return { ...response, intent: 'calendar', nextAction: 'cancel_calendar_event' };
    if (command.operation === 'update' && previousAction.includes('reminder') && hasTime) return { ...response, intent: 'reminder', nextAction: 'update_reminder' };
    if (command.operation === 'cancel' && previousAction.includes('reminder')) return { ...response, intent: 'reminder', nextAction: 'cancel_reminder' };
    if (command.operation === 'update' && previousAction.includes('habit') && hasWeekTarget) return { ...response, intent: 'habit', nextAction: 'update_habit' };
    if (command.operation === 'cancel' && previousAction.includes('habit')) return { ...response, intent: 'habit', nextAction: 'delete_habit' };
    if (command.operation === 'update' && previousAction.includes('workout') && (hasDuration || hasCalories || hasTime)) return { ...response, intent: 'workout', nextAction: 'update_workout' };
    if (command.operation === 'cancel' && previousAction.includes('workout')) return { ...response, intent: 'workout', nextAction: 'delete_workout' };
    if (command.operation === 'cancel' && previousAction.includes('meal')) return { ...response, intent: 'nutrition', nextAction: 'delete_meal' };
    if (command.operation === 'cancel' && previousAction.includes('water')) return { ...response, intent: 'hydration', nextAction: 'delete_water_log' };
    if (command.operation === 'cancel' && previousResource === 'food') return { ...response, intent: 'nutrition', nextAction: 'delete_food' };
    if (command.operation === 'cancel' && previousResource === 'basket') return { ...response, intent: 'shopping', nextAction: 'remove_from_basket' };
    if (command.operation === 'cancel' && previousResource === 'supplement') return { ...response, intent: 'supplement', nextAction: 'delete_supplement' };
    if (command.operation === 'update' && previousResource === 'calendar') return { ...response, intent: 'calendar', nextAction: 'update_calendar_event' };
    if (command.operation === 'update' && previousResource === 'supplement') return { ...response, intent: 'supplement', nextAction: 'update_supplement' };
    return response;
  }

  private resourceTypeFor(action?: string): string | undefined {
    if (!action) return undefined;
    if (action.includes('basket')) return 'basket';
    if (action.includes('habit')) return 'habit';
    if (action.includes('workout')) return 'workout';
    if (action.includes('meal')) return 'meal';
    if (action.includes('water')) return 'water';
    if (action.includes('supplement')) return 'supplement';
    if (action.includes('calendar')) return 'calendar';
    if (action.includes('reminder')) return 'reminder';
    if (action.includes('food')) return 'food';
    return undefined;
  }

  private extractExecutionEntityId(result: unknown): string | undefined {
    if (!result || typeof result !== 'object') return undefined;
    const record = result as Record<string, unknown>;
    for (const key of ['id', 'resourceId', 'waterLogId', 'mealId', 'foodId']) {
      if (typeof record[key] === 'string') return record[key];
    }
    return undefined;
  }

  private extractDecisionId(receipt: unknown): string | undefined {
    if (!receipt || typeof receipt !== 'object') return undefined;
    const record = receipt as Record<string, unknown>;
    return typeof record.decisionId === 'string' ? record.decisionId : undefined;
  }
}
