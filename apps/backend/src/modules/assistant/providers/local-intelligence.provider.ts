import { Injectable } from '@nestjs/common';
import {
  AiProvider,
  AiProviderRequest,
  AiProviderResponse,
} from '../services/ai-provider.types';
import { LocalIntelligenceCoreService } from '../services/local-intelligence-core.service';

@Injectable()
export class LocalIntelligenceProvider implements AiProvider {
  readonly id = 'local-core';
  readonly name = 'Local Assistant Core';
  readonly metadata = {
    priority: 100,
    capabilities: new Set([
      'intent-understanding',
      'text-generation',
      'planning',
    ] as const),
    local: true,
  };

  constructor(private readonly core: LocalIntelligenceCoreService) {}

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async generate(request: AiProviderRequest): Promise<AiProviderResponse> {
    return this.core.generate(request);
  }
}
