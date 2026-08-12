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
    await this.conversationContextService.append({ userId, role: 'user', text: input });
    const contextualCommand = await this.contextualCommandService.resolve(userId, input);

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
          targetExecutionId: contextualCommand.targetExecutionId,
        },
      },
    };

    const receipt = execution?.receipt;
    const executionId = receipt && typeof receipt === 'object' && receipt !== null && 'decisionId' in receipt
      ? String((receipt as { decisionId?: unknown }).decisionId ?? '') || undefined
      : undefined;

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
}
