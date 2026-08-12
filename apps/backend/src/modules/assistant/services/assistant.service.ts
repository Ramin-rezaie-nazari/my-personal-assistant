import { Injectable } from '@nestjs/common';

import { BrainOrchestratorService } from '../../personal-brain/services/brain-orchestrator.service';
import { NaturalActionExecutionService } from './natural-action-execution.service';
import { ContextualCommandService } from './contextual-command.service';
import { ConversationContextService } from './conversation-context.service';
import { BrainResponse } from '../../personal-brain/types';

@Injectable()
export class AssistantService {
  constructor(
    private readonly brainOrchestratorService: BrainOrchestratorService,
    private readonly naturalActionExecutionService: NaturalActionExecutionService,
    private readonly contextualCommandService: ContextualCommandService,
    private readonly conversationContextService: ConversationContextService,
  ) {}

  async getStatus() {
    return {
      name: 'My Personal Assistant',
      status: 'brain foundation active',
    };
  }

  async getHistory(userId: string, limit = 24) {
    const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
    return (await this.conversationContextService.get(userId)).turns.slice(-safeLimit);
  }

  async process(input: string, userId: string) {
    await this.conversationContextService.append({ userId, role: 'user', text: input });
    const contextualCommand = await this.contextualCommandService.resolve(userId, input);

    const response = await this.brainOrchestratorService.processRequest(input, userId);
    const executionResponse = this.resolveContextualExecution(response, contextualCommand, input);
    const execution = executionResponse.nextAction
      ? await this.naturalActionExecutionService.execute(input, userId, executionResponse, {
          referencesPrevious: contextualCommand.referencesPrevious,
          previousAction: contextualCommand.targetAction,
          previousExecutionId: contextualCommand.targetExecutionId,
          targetResourceType: contextualCommand.targetResourceType,
          targetResourceId: contextualCommand.targetResourceId,
          operation: contextualCommand.operation,
        })
      : undefined;

    const finalResponse = {
      ...executionResponse,
      message: execution?.executed ? execution.message : executionResponse.message,
      ...(execution ? { execution } : {}),
      metadata: {
        ...(executionResponse.metadata ?? {}),
        contextualCommand: {
          referencesPrevious: contextualCommand.referencesPrevious,
          operation: contextualCommand.operation,
          targetAction: contextualCommand.targetAction,
          targetExecutionId: contextualCommand.targetExecutionId,
          targetResourceType: contextualCommand.targetResourceType,
          targetResourceId: contextualCommand.targetResourceId,
        },
      },
    };

    const receipt = execution?.receipt;
    const resourceId = receipt && typeof receipt === 'object' && receipt !== null && 'result' in receipt
      ? this.extractExecutionEntityId((receipt as { result?: unknown }).result)
      : undefined;
    const executionId = this.extractDecisionId(receipt);
    const resourceType = this.resourceTypeFor(execution?.action ?? finalResponse.nextAction, finalResponse.intent);

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

  private resolveContextualExecution(
    response: BrainResponse,
    command: {
      referencesPrevious: boolean;
      operation: string;
      targetAction?: string;
      targetExecutionId?: string;
      targetResourceType?: string;
      targetResourceId?: string;
    },
    input: string,
  ): BrainResponse {
    if (!command.referencesPrevious || !(command.targetResourceId || command.targetExecutionId)) return response;
    const previousAction = (command.targetAction ?? '').toLowerCase();
    const hasTime = /\b(?:[01]?\d|2[0-3]):[0-5]\d\b/.test(input);
    if (command.operation === 'update' && previousAction.includes('reminder') && hasTime) {
      return { ...response, intent: 'reminder', nextAction: 'update_reminder' };
    }
    if (command.operation === 'cancel' && previousAction.includes('reminder')) {
      return { ...response, intent: 'reminder', nextAction: 'cancel_reminder' };
    }
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

  private resourceTypeFor(action?: string, intent?: string): string | undefined {
    const value = `${action ?? ''} ${intent ?? ''}`.toLowerCase();
    if (value.includes('reminder')) return 'reminder';
    if (value.includes('calendar') || value.includes('schedule')) return 'calendar';
    if (value.includes('workout') || value.includes('exercise') || value.includes('training')) return 'workout';
    if (value.includes('habit')) return 'habit';
    if (value.includes('supplement') || value.includes('vitamin')) return 'supplement';
    if (value.includes('notification')) return 'notification';
    if (value.includes('meal') || value.includes('food') || value.includes('nutrition')) return 'nutrition';
    return undefined;
  }
}
