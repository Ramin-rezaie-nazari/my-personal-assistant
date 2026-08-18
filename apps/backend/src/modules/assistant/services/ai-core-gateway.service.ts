import { Injectable } from '@nestjs/common';

import {
  AiProviderResponse,
  AiTask,
} from './ai-provider.types';
import { AiProviderRouterService } from './ai-provider-router.service';
import {
  DeviceRuntimeSignals,
  DeviceAwareLocalRuntimeService,
} from './device-aware-local-runtime.service';
import {
  PersonalContext,
  PersonalContextService,
} from './personal-context.service';

export type AiCoreRequest = {
  input: string;
  task: AiTask;
  context?: Record<string, unknown>;
  device?: DeviceRuntimeSignals;
};

export type AiCoreUserRequest = {
  userId: string;
  input: string;
  task: AiTask;
  dateKey?: string;
  device?: DeviceRuntimeSignals;
};

export type AiCoreResponse = AiProviderResponse & {
  task: AiTask;
  runtime?: {
    tier: string;
    modelClass: string;
    maxContextTokens: number;
  };
};

@Injectable()
export class AiCoreGatewayService {
  constructor(
    private readonly router: AiProviderRouterService,
    private readonly personalContext: PersonalContextService,
    private readonly deviceRuntime: DeviceAwareLocalRuntimeService,
  ) {}

  async run(request: AiCoreRequest): Promise<AiCoreResponse> {
    const profile = this.deviceRuntime.profile(request.device);
    const response = await this.router.generate({
      input: request.input,
      task: request.task,
      context: this.withRuntimeBudget(request.context, profile.maxContextTokens, profile),
    });

    return {
      ...response,
      task: request.task,
      runtime: {
        tier: profile.tier,
        modelClass: profile.preferredModelClass,
        maxContextTokens: profile.maxContextTokens,
      },
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
      device: request.device,
      context: this.toProviderContext(context),
    });

    return { ...response, context };
  }

  async understand(input: string, context?: Record<string, unknown>, device?: DeviceRuntimeSignals) {
    return this.run({ input, task: 'intent-understanding', context, device });
  }

  async generateText(input: string, context?: Record<string, unknown>, device?: DeviceRuntimeSignals) {
    return this.run({ input, task: 'text-generation', context, device });
  }

  async plan(input: string, context?: Record<string, unknown>, device?: DeviceRuntimeSignals) {
    return this.run({ input, task: 'planning', context, device });
  }

  async transcribe(input: string, context?: Record<string, unknown>, device?: DeviceRuntimeSignals) {
    return this.run({ input, task: 'voice-transcription', context, device });
  }

  async synthesize(input: string, context?: Record<string, unknown>, device?: DeviceRuntimeSignals) {
    return this.run({ input, task: 'voice-synthesis', context, device });
  }

  async analyzeVision(input: string, context?: Record<string, unknown>, device?: DeviceRuntimeSignals) {
    return this.run({ input, task: 'vision', context, device });
  }

  private withRuntimeBudget(
    context: Record<string, unknown> | undefined,
    maxContextTokens: number,
    profile: ReturnType<DeviceAwareLocalRuntimeService['profile']>,
  ): Record<string, unknown> {
    return {
      ...(context ?? {}),
      runtime: {
        tier: profile.tier,
        modelClass: profile.preferredModelClass,
        maxContextTokens,
        allowVision: profile.allowVision,
        allowVoice: profile.allowVoice,
      },
    };
  }

  private toProviderContext(context: PersonalContext): Record<string, unknown> {
    return {
      dateKey: context.dateKey,
      request: context.request,
      user: context.user,
      globalization: context.globalization,
      voice: context.voice,
      globalSettings: context.globalSettings,
      conversation: context.conversation,
      nutrition: context.nutrition,
      life: context.life,
    };
  }
}
