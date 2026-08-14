import { Injectable } from '@nestjs/common';
import { AiProvider, AiProviderRequest, AiProviderResponse } from './ai-provider.types';

@Injectable()
export class AiProviderRouterService {
  private readonly providers: AiProvider[] = [];
  private readonly cooldownUntil = new Map<string, number>();

  register(provider: AiProvider): void {
    if (!this.providers.some((candidate) => candidate.id === provider.id)) this.providers.push(provider);
  }

  async generate(request: AiProviderRequest): Promise<AiProviderResponse> {
    let lastError: unknown;
    for (const provider of this.providers) {
      if ((this.cooldownUntil.get(provider.id) ?? 0) > Date.now()) continue;
      try {
        if (!(await provider.isAvailable())) continue;
        return await provider.generate(request);
      } catch (error) {
        lastError = error;
        this.cooldownUntil.set(provider.id, Date.now() + this.cooldownFor(error));
      }
    }
    if (lastError) throw lastError;
    throw new Error('No AI provider is currently available.');
  }

  private cooldownFor(error: unknown): number {
    const status = typeof error === 'object' && error !== null && 'status' in error ? Number((error as { status?: unknown }).status) : 0;
    return status === 429 ? 60_000 : 5_000;
  }
}
