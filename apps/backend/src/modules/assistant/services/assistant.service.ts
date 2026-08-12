import { Injectable } from '@nestjs/common';

import { BrainOrchestratorService } from '../../personal-brain/services/brain-orchestrator.service';
import { NaturalActionExecutionService } from './natural-action-execution.service';
import { ContextualCommandService } from './contextual-command.service';
import { ConversationContextService } from './conversation-context.service';

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
    const contextualCommand = this.contextualCommandService.resolve(userId, input);
    this.conversationContextService.append({ userId, role: 'user', text: input });

    const response = await this.brainOrchestratorService.processRequest(input, userId);
    let execution;
    if (response.nextAction) {
      execution = await this.naturalActionExecutionService.execute(input, userId, response, {
        referencesPrevious: contextualCommand.referencesPrevious,
        previousAction: contextualCommand.targetAction,
        previousExecutionId: contextualCommand.targetExecutionId,
        operation: contextualCommand.operation,
      });
    }

    const finalResponse = {
      ...response,
      message: execution?.executed ? execution.message : response.message,
      ...(execution ? { execution } : {}),
      metadata: {
        ...(response.metadata ?? {}),
        contextualCommand: {
          referencesPrevious: contextualCommand.referencesPrevious,
          operation: contextualCommand.operation,
          targetAction: contextualCommand.targetAction,
        },
      },
    };

    this.conversationContextService.append({
      userId,
      role: 'assistant',
      text: finalResponse.message,
      intent: finalResponse.intent,
      action: execution?.action ?? finalResponse.nextAction,
      executionId: execution?.receipt && typeof execution.receipt === 'object' && execution.receipt !== null && 'decisionId' in execution.receipt
        ? String((execution.receipt as { decisionId?: unknown }).decisionId ?? '') || undefined
        : undefined,
    });

    return finalResponse;
  }
}
