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
        },
      },
    };

    const receipt = execution?.receipt;
    const executionId = receipt && typeof receipt === 'object' && receipt !== null && 'result' in receipt
      ? this.extractExecutionEntityId((receipt as { result?: unknown }).result) ?? this.extractDecisionId(receipt)
      : this.extractDecisionId(receipt);

    await this.conversationContextService.append({
      userId,
      role: 'assistant',
      text: finalResponse.message,
      intent: finalResponse.intent,
      action: execution?.action ?? finalResponse.nextAction,
      executionId,
    });

    return finalResponse;
  }

  private resolveContextualExecution(response: BrainResponse, command: { referencesPrevious: boolean; operation: string; targetAction?: string; targetExecutionId?: string }, input: string): BrainResponse {
    if (!command.referencesPrevious || !command.targetExecutionId) return response;
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
}
