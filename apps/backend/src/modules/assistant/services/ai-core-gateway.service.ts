import { Injectable } from '@nestjs/common';

import {
  AiProviderResponse,
  AiTask,
} from './ai-provider.types';
import { AiProviderRouterService } from './ai-provider-router.service';

export type AiCoreRequest = {
  input: string;
  task: AiTask;
  context?: Record<string, unknown>;
};

export type AiCoreResponse = AiProviderResponse & {
  task: AiTask;
};

@Injectable()
export class AiCoreGatewayService {
  constructor(private readonly router: AiProviderRouterService) {}

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
}
