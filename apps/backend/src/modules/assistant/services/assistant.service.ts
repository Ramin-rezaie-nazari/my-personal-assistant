import { Injectable, Optional } from '@nestjs/common';

import { BrainOrchestratorService } from '../../personal-brain/services/brain-orchestrator.service';
import { BrainResponse } from '../../personal-brain/types';
import { ContextualCommandService } from './contextual-command.service';
import { ConversationContextService } from './conversation-context.service';
import { LocalLanguageUnderstandingService } from './local-language-understanding.service';
import { NaturalActionExecutionService } from './natural-action-execution.service';
import { PlanningService } from './planning.service';
import { SemanticMultilingualUnderstandingService } from './semantic-multilingual-understanding.service';

type LocalIntentResponse = {
  intent: string;
  nextAction: string;
  messages: Record<string, string>;
};

const LOCAL_INTENT_RESPONSES: Record<string, LocalIntentResponse> = {
  ADD_TO_BASKET: {
    intent: 'shopping',
    nextAction: 'add_to_basket',
    messages: {
      'fa-IR': 'باشه، به سبد خرید اضافه‌اش می‌کنم.',
      'en-US': 'Sure, I’ll add it to your basket.',
      'en-GB': 'Sure, I’ll add it to your basket.',
      'es-ES': 'Claro, lo añadiré a tu cesta.',
      'es-MX': 'Claro, lo agrego a tu carrito.',
      'fr-FR': 'Bien sûr, je l’ajoute à ton panier.',
      'de-DE': 'Klar, ich füge es deinem Warenkorb hinzu.',
      'it-IT': 'Certo, lo aggiungo al carrello.',
      'pt-BR': 'Claro, vou adicionar ao seu carrinho.',
      'ru-RU': 'Хорошо, добавлю это в корзину.',
      'tr-TR': 'Tabii, bunu sepete ekleyeceğim.',
      'ja-JP': 'わかりました。カートに追加します。',
      'zh-CN': '好的，我会把它加入购物车。',
      'ar-SA': 'بالتأكيد، سأضيفه إلى السلة.',
    },
  },
  REMOVE_FROM_BASKET: {
    intent: 'shopping',
    nextAction: 'remove_from_basket',
    messages: {
      'fa-IR': 'باشه، از سبد خرید حذفش می‌کنم.',
      'en-US': 'Sure, I’ll remove it from your basket.',
      'en-GB': 'Sure, I’ll remove it from your basket.',
      'es-ES': 'Claro, lo quitaré de tu cesta.',
      'es-MX': 'Claro, lo quitaré de tu carrito.',
      'fr-FR': 'Bien sûr, je le retire de ton panier.',
      'de-DE': 'Klar, ich entferne es aus deinem Warenkorb.',
      'it-IT': 'Certo, lo rimuovo dal carrello.',
      'pt-BR': 'Claro, vou remover do seu carrinho.',
      'ru-RU': 'Хорошо, уберу это из корзины.',
      'tr-TR': 'Tabii, bunu sepetten çıkaracağım.',
      'ja-JP': 'わかりました。カートから削除します。',
      'zh-CN': '好的，我会把它从购物车移除。',
      'ar-SA': 'بالتأكيد، سأزيله من السلة.',
    },
  },
  RECOMMEND_MEAL: {
    intent: 'nutrition',
    nextAction: 'recommend_meal',
    messages: {
      'fa-IR': 'حتماً، بر اساس اطلاعات خودت یک گزینه مناسب پیدا می‌کنم.',
      'en-US': 'Absolutely. I’ll find a good option based on your profile.',
      'en-GB': 'Absolutely. I’ll find a good option based on your profile.',
      'es-ES': 'Claro. Buscaré una opción adecuada según tu perfil.',
      'es-MX': 'Claro. Buscaré una opción adecuada según tu perfil.',
      'fr-FR': 'Bien sûr. Je vais chercher une option adaptée à ton profil.',
      'de-DE': 'Klar. Ich suche eine passende Option auf Basis deines Profils.',
      'it-IT': 'Certo. Cercherò un’opzione adatta al tuo profilo.',
      'pt-BR': 'Claro. Vou encontrar uma opção adequada ao seu perfil.',
      'ru-RU': 'Конечно. Подберу подходящий вариант по твоему профилю.',
      'tr-TR': 'Tabii. Profiline göre uygun bir seçenek bulacağım.',
      'ja-JP': 'もちろんです。あなたのプロフィールに合うものを探します。',
      'zh-CN': '当然可以。我会根据你的个人情况找一个合适的选择。',
      'ar-SA': 'بالتأكيد، سأبحث عن خيار مناسب وفقًا لملفك.',
    },
  },
  GET_NUTRITION_SUMMARY: {
    intent: 'nutrition',
    nextAction: 'get_nutrition_summary',
    messages: {
      'fa-IR': 'حتماً، خلاصه تغذیه امروزت رو بررسی می‌کنم.',
      'en-US': 'Sure, I’ll check your nutrition summary for today.',
      'en-GB': 'Sure, I’ll check your nutrition summary for today.',
      'es-ES': 'Claro, revisaré tu resumen de nutrición de hoy.',
      'es-MX': 'Claro, revisaré tu resumen de nutrición de hoy.',
      'fr-FR': 'Bien sûr, je vais vérifier ton résumé nutritionnel du jour.',
      'de-DE': 'Klar, ich prüfe deine heutige Ernährungsübersicht.',
      'it-IT': 'Certo, controllo il riepilogo nutrizionale di oggi.',
      'pt-BR': 'Claro, vou conferir seu resumo nutricional de hoje.',
      'ru-RU': 'Конечно, проверю твою сводку питания за сегодня.',
      'tr-TR': 'Tabii, bugünkü beslenme özetini kontrol edeceğim.',
      'ja-JP': 'もちろんです。今日の栄養の概要を確認します。',
      'zh-CN': '好的，我会查看你今天的营养摘要。',
      'ar-SA': 'بالتأكيد، سأراجع ملخص تغذيتك اليوم.',
    },
  },
  CREATE_REMINDER: {
    intent: 'reminder',
    nextAction: 'create_reminder',
    messages: {
      'fa-IR': 'حتماً، یادآوری رو برایت آماده می‌کنم.',
      'en-US': 'Absolutely, I’ll set that reminder up for you.',
      'en-GB': 'Absolutely, I’ll set that reminder up for you.',
      'es-ES': 'Claro, prepararé ese recordatorio para ti.',
      'es-MX': 'Claro, prepararé ese recordatorio para ti.',
      'fr-FR': 'Bien sûr, je vais préparer ce rappel pour toi.',
      'de-DE': 'Klar, ich richte die Erinnerung für dich ein.',
      'it-IT': 'Certo, preparo il promemoria per te.',
      'pt-BR': 'Claro, vou preparar esse lembrete para você.',
      'ru-RU': 'Конечно, подготовлю это напоминание для тебя.',
      'tr-TR': 'Tabii, hatırlatıcıyı senin için hazırlayacağım.',
      'ja-JP': 'もちろんです。リマインダーを設定します。',
      'zh-CN': '当然可以，我会帮你设置这个提醒。',
      'ar-SA': 'بالتأكيد، سأجهز هذا التذكير لك.',
    },
  },
  UPDATE_REQUEST: {
    intent: 'assistant',
    nextAction: 'update_contextual_request',
    messages: {
      'fa-IR': 'باشه، درخواست قبلی رو با تغییر جدیدت به‌روزرسانی می‌کنم.',
      'en-US': 'Sure, I’ll update the previous request with that change.',
      'en-GB': 'Sure, I’ll update the previous request with that change.',
      'es-ES': 'Claro, actualizaré la solicitud anterior con ese cambio.',
      'fr-FR': 'Bien sûr, je vais mettre à jour la demande précédente.',
      'de-DE': 'Klar, ich aktualisiere die vorherige Anfrage entsprechend.',
      'it-IT': 'Certo, aggiornerò la richiesta precedente con questa modifica.',
      'pt-BR': 'Claro, vou atualizar o pedido anterior com essa alteração.',
      'ru-RU': 'Хорошо, обновлю предыдущий запрос с этим изменением.',
      'tr-TR': 'Tabii, önceki isteği bu değişiklikle güncelleyeceğim.',
      'ja-JP': 'わかりました。前のリクエストをその変更で更新します。',
      'zh-CN': '好的，我会按这个变化更新之前的请求。',
      'ar-SA': 'بالتأكيد، سأحدّث الطلب السابق بهذا التغيير.',
    },
  },
  CANCEL_REQUEST: {
    intent: 'assistant',
    nextAction: 'cancel_contextual_request',
    messages: {
      'fa-IR': 'باشه، درخواست قبلی رو لغو می‌کنم.',
      'en-US': 'Okay, I’ll cancel the previous request.',
      'en-GB': 'Okay, I’ll cancel the previous request.',
      'es-ES': 'De acuerdo, cancelaré la solicitud anterior.',
      'fr-FR': 'D’accord, j’annule la demande précédente.',
      'de-DE': 'Okay, ich storniere die vorherige Anfrage.',
      'it-IT': 'Va bene, annullo la richiesta precedente.',
      'pt-BR': 'Tudo bem, vou cancelar o pedido anterior.',
      'ru-RU': 'Хорошо, отменю предыдущий запрос.',
      'tr-TR': 'Tamam, önceki isteği iptal edeceğim.',
      'ja-JP': 'わかりました。前のリクエストをキャンセルします。',
      'zh-CN': '好的，我会取消之前的请求。',
      'ar-SA': 'حسنًا، سأُلغي الطلب السابق.',
    },
  },
};

@Injectable()
export class AssistantService {
  constructor(
    private readonly brainOrchestratorService: BrainOrchestratorService,
    private readonly naturalActionExecutionService: NaturalActionExecutionService,
    private readonly contextualCommandService: ContextualCommandService,
    private readonly conversationContextService: ConversationContextService,
    @Optional()
    private readonly localLanguageUnderstandingService?: LocalLanguageUnderstandingService,
    @Optional()
    private readonly semanticMultilingualUnderstandingService?: SemanticMultilingualUnderstandingService,
    @Optional() private readonly planningService?: PlanningService,
  ) {}

  async getStatus() {
    return { name: 'My Personal Assistant', status: 'brain foundation active' };
  }

  async getHistory(userId: string, limit = 24) {
    const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
    return (await this.conversationContextService.get(userId)).turns.slice(-safeLimit);
  }

  async confirm(userId: string, token: string) {
    const receipt = await this.naturalActionExecutionService.confirm(userId, token);
    await this.conversationContextService.append({
      userId,
      role: 'assistant',
      text: receipt.status === 'completed' ? 'تأیید شد و انجام شد.' : receipt.reason,
      action: receipt.action,
      executionId: receipt.decisionId,
      resourceType: this.resourceTypeFor(receipt.action),
    });
    return receipt;
  }

  async process(input: string, userId: string) {
    await this.conversationContextService.append({ userId, role: 'user', text: input });
    const contextualCommand = await this.contextualCommandService.resolve(userId, input);
    const local = this.semanticMultilingualUnderstandingService
      ? this.semanticMultilingualUnderstandingService.understand(input)
      : this.localLanguageUnderstandingService?.understand(input);
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
    const executionResponse = this.resolveContextualExecution(response, contextualCommand, input);
    const execution = executionResponse.nextAction
      ? await this.naturalActionExecutionService.execute(input, userId, executionResponse, {
          userId,
          referencesPrevious: contextualCommand.referencesPrevious,
          previousAction: contextualCommand.targetAction,
          previousExecutionId: contextualCommand.targetExecutionId,
          targetResourceType: contextualCommand.targetResourceType,
          targetResourceId: contextualCommand.targetResourceId,
          operation: contextualCommand.operation,
          localUnderstanding: local,
          localPlan: plan,
        })
      : undefined;

    const finalResponse = {
      ...executionResponse,
      message: execution?.executed ? execution.message : (execution?.message ?? executionResponse.message),
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
      receipt && typeof receipt === 'object' && receipt !== null && 'result' in receipt
        ? this.extractExecutionEntityId((receipt as { result?: unknown }).result)
        : undefined;
    const executionId = this.extractDecisionId(receipt);
    const resourceType = this.resourceTypeFor(execution?.action ?? finalResponse.nextAction);
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
    const selected = LOCAL_INTENT_RESPONSES[local.intent];
    if (!selected) return undefined;
    const message = selected.messages[local.language] ?? selected.messages['en-US'] ?? selected.messages['fa-IR'];
    return {
      intent: selected.intent,
      nextAction: selected.nextAction,
      message,
      confidence: local.confidence,
      metadata: { local: true, entities: local.entities, language: local.language },
    };
  }

  private resolveContextualExecution(
    response: BrainResponse,
    command: Awaited<ReturnType<ContextualCommandService['resolve']>>,
    input: string,
  ): BrainResponse {
    if (!command.referencesPrevious || !(command.targetResourceId || command.targetExecutionId)) return response;
    const entities = command.entities ?? {};
    const previousAction = (command.targetAction ?? '').toLowerCase();
    const previousResource = (command.targetResourceType ?? '').toLowerCase();
    const normalizedInput = input.trim().toLowerCase().replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)));
    const hasTime = Boolean(entities.time) || /\b(?:[01]?\d|2[0-3])\s*(?::|\.)\s*[0-5]\d\b/.test(normalizedInput);
    const hasDuration = Boolean(entities.durationMinutes) || /\b\d{1,3}\s*(?:min|mins|minute|minutes|دقیقه)(?=\s|$)/i.test(normalizedInput);
    const hasCalories = /\b\d{2,5}\s*(?:cal|calories|کالری)\b/i.test(normalizedInput);
    const hasWeekTarget = /\b[1-7]\s*(?:times?|x|بار|مرتبه)(?:\s*(?:per|a)?\s*week|\s*در\s*هفته)?\b/i.test(normalizedInput);
    if (command.operation === 'update' && previousResource === 'calendar' && hasTime) return { ...response, intent: 'calendar', nextAction: 'update_calendar_event' };
    if (command.operation === 'cancel' && previousResource === 'calendar') return { ...response, intent: 'calendar', nextAction: 'cancel_calendar_event' };
    if (command.operation === 'update' && previousAction.includes('reminder') && hasTime) return { ...response, intent: 'reminder', nextAction: 'update_reminder' };
    if (command.operation === 'cancel' && previousAction.includes('reminder')) return { ...response, intent: 'reminder', nextAction: 'cancel_reminder' };
    if (command.operation === 'update' && previousResource === 'workout' && (hasDuration || hasCalories || hasTime)) return { ...response, intent: 'workout', nextAction: 'update_workout' };
    if (command.operation === 'cancel' && previousResource === 'workout') return { ...response, intent: 'workout', nextAction: 'delete_workout' };
    if (command.operation === 'update' && previousResource === 'habit' && hasWeekTarget) return { ...response, intent: 'habit', nextAction: 'update_habit' };
    if (command.operation === 'cancel' && previousResource === 'habit') return { ...response, intent: 'habit', nextAction: 'delete_habit' };
    if (command.operation === 'cancel' && previousResource === 'supplement') return { ...response, intent: 'supplement', nextAction: 'delete_supplement' };
    if (command.operation === 'update' && previousResource === 'supplement' && hasTime) return { ...response, intent: 'supplement', nextAction: 'update_supplement' };
    return response;
  }

  private extractExecutionEntityId(result: unknown): string | undefined {
    if (!result || typeof result !== 'object') return undefined;
    const value = (result as { id?: unknown }).id;
    return typeof value === 'string' && value ? value : undefined;
  }

  private extractDecisionId(receipt: unknown): string | undefined {
    if (!receipt || typeof receipt !== 'object') return undefined;
    const value = (receipt as { decisionId?: unknown }).decisionId;
    return typeof value === 'string' && value ? value : undefined;
  }

  private resourceTypeFor(value?: string): string | undefined {
    const text = (value ?? '').toLowerCase();
    if (text.includes('reminder')) return 'reminder';
    if (text.includes('calendar') || text.includes('schedule')) return 'calendar';
    if (text.includes('workout') || text.includes('exercise') || text.includes('training')) return 'workout';
    if (text.includes('habit')) return 'habit';
    if (text.includes('supplement') || text.includes('vitamin')) return 'supplement';
    if (text.includes('notification')) return 'notification';
    if (text.includes('basket')) return 'shopping';
    return undefined;
  }
}
