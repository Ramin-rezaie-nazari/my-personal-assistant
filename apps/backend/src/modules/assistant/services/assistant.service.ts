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
    const local = this.localLanguageUnderstandingService?.understand(input);
    const plan = this.planningService
      ? await this.planningService.createPlan({
          clauses: contextualCommand.clauses,
          intents: contextualCommand.intents,
          contradictions: contextualCommand.contradictions,
          confidence: contextualCommand.confidence,
        })
      : { steps: [], requiresClarification: false, reason: 'not_available' };
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
    await this.conversationContextService.append({
      userId,
      role: 'assistant',
      text: finalResponse.message ?? '',
      action: finalResponse.nextAction?.action,
      resourceType: contextualCommand.targetResourceType,
      resourceId: contextualCommand.targetResourceId,
      executionId: execution?.decisionId,
    });
    return finalResponse;
  }

  private resourceTypeFor(action?: string) {
    if (!action) return undefined;
    if (action.includes('reminder')) return 'reminder';
    if (action.includes('habit')) return 'habit';
    if (action.includes('calendar')) return 'calendar';
    if (action.includes('meal')) return 'meal';
    if (action.includes('supplement')) return 'supplement';
    if (action.includes('shopping')) return 'shopping';
    return undefined;
  }

  private responseForLocalIntent(local: { intent?: string; message?: string }): BrainResponse | undefined {
    if (!local.intent) return undefined;
    return {
      intent: local.intent,
      nextAction: undefined,
      message: local.message ?? '',
      confidence: 0.8,
      metadata: { local: true },
    } as BrainResponse;
  }

  private resolveContextualExecution(response: BrainResponse, contextualCommand: any, input: string) {
    return response;
  }
}
