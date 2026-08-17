import { Injectable } from '@nestjs/common';

import {
  AiProviderResponse,
  AiTask,
} from './ai-provider.types';
import { AiProviderRouterService } from './ai-provider-router.service';
import {
  PersonalContext,
  PersonalContextService,
} from './personal-context.service';

export type AiCoreRequest = {
  input: string;
  task: AiTask;
  context?: Record<string, unknown>;
};

export type AiCoreUserRequest = {
  userId: string;
  input: string;
  task: AiTask;
  dateKey?: string;
};

export type AiCoreResponse = AiProviderResponse & {
  task: AiTask;
};

@Injectable()
export class AiCoreGatewayService {
  constructor(
    private readonly router: AiProviderRouterService,
    private readonly personalContext: PersonalContextService,
  ) {}

  async run(request: AiCoreRequest): Promise<AiCoreResponse> {
    const response = await this.router.generate({
      input: request.input,
      task: request.task,
      context: request.context,
    });

    return {
      ...response,
      task: request.task,
    };
  }

  async runForUser(
    request: AiCoreUserRequest,
  ): Promise<AiCoreResponse & { context: PersonalContext }> {
    const context = await this.personalContext.build({
      userId: request.userId,
      input: request.input,
      dateKey: request.dateKey,
    });
    const response = await this.run({
      input: request.input,
      task: request.task,
      context: this.toProviderContext(context),
    });

    return { ...response, context };
  }

  async understand(input: string, context?: Record<string, unknown>) {
    return this.run({ input, task: 'intent-understanding', context });
  }

  async generateText(input: string, context?: Record<string, unknown>) {
    return this.run({ input, task: 'text-generation', context });
  }

  async plan(input: string, context?: Record<string, unknown>) {
    return this.run({ input, task: 'planning', context });
  }

  async transcribe(input: string, context?: Record<string, unknown>) {
    return this.run({ input, task: 'voice-transcription', context });
  }

  async synthesize(input: string, context?: Record<string, unknown>) {
    return this.run({ input, task: 'voice-synthesis', context });
  }

  async analyzeVision(input: string, context?: Record<string, unknown>) {
    return this.run({ input, task: 'vision', context });
  }

  private toProviderContext(context: PersonalContext): Record<string, unknown> {
    return {
      dateKey: context.dateKey,
      request: context.request,
      user: context.user,
      conversation: context.conversation,
      nutrition: context.nutrition,
      life: context.life,
    };
  }
}
