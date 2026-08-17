import { Injectable } from '@nestjs/common';
import { LocalIntelligenceProvider } from '../providers/local-intelligence.provider';
import {
  AiProvider,
  AiProviderId,
  AiProviderQuota,
  AiProviderRequest,
  AiProviderResponse,
  AiTask,
} from './ai-provider.types';

type ProviderState = {
  cooldownUntil: number;
  quota?: AiProviderQuota;
};

@Injectable()
export class AiProviderRouterService {
  private readonly providers: AiProvider[] = [];
  private readonly state = new Map<AiProviderId, ProviderState>();

  constructor(private readonly localProvider: LocalIntelligenceProvider) {
    this.register(localProvider);
  }

  register(provider: AiProvider): void {
    if (!this.providers.some((candidate) => candidate.id === provider.id)) {
      this.providers.push(provider);
      this.providers.sort(
        (a, b) =>
          (b.metadata?.priority ?? 0) - (a.metadata?.priority ?? 0),
      );
    }
  }

  setQuota(providerId: AiProviderId, quota: AiProviderQuota): void {
    const current = this.state.get(providerId) ?? { cooldownUntil: 0 };
    this.state.set(providerId, { ...current, quota });
  }

  getProviderState(providerId: AiProviderId): ProviderState {
    return { ...(this.state.get(providerId) ?? { cooldownUntil: 0 }) };
  }

  async generate(request: AiProviderRequest): Promise<AiProviderResponse> {
    const task = request.task ?? 'intent-understanding';
    let lastError: unknown;

    for (const provider of this.providers) {
      if (!this.supports(provider, task)) continue;
      if (!this.canAttempt(provider.id)) continue;

      try {
        if (!(await provider.isAvailable())) continue;
        const response = await provider.generate(request);
        this.consumeQuota(provider.id);
        return response;
      } catch (error) {
        lastError = error;
        this.cooldown(provider.id, error);
      }
    }

    if (lastError) throw lastError;
    throw new Error(`No AI provider is available for task: ${task}`);
  }

  private supports(provider: AiProvider, task: AiTask): boolean {
    return provider.metadata?.capabilities.has(task) ?? true;
  }

  private canAttempt(providerId: AiProviderId): boolean {
    const state = this.state.get(providerId);
    if (!state) return true;

    if (state.cooldownUntil > Date.now()) return false;

    if (state.quota?.resetAt && state.quota.resetAt <= Date.now()) {
      this.state.set(providerId, { ...state, quota: undefined });
      return true;
    }

    return state.quota?.remaining === undefined || state.quota.remaining > 0;
  }

  private consumeQuota(providerId: AiProviderId): void {
    const state = this.state.get(providerId);
    if (state?.quota?.remaining === undefined) return;

    this.state.set(providerId, {
      ...state,
      quota: {
        ...state.quota,
        remaining: Math.max(0, state.quota.remaining - 1),
      },
    });
  }

  private cooldown(providerId: AiProviderId, error: unknown): void {
    const status =
      typeof error === 'object' && error !== null && 'status' in error
        ? Number((error as { status?: unknown }).status)
        : 0;
    const retryAfterMs =
      typeof error === 'object' && error !== null && 'retryAfterMs' in error
        ? Number((error as { retryAfterMs?: unknown }).retryAfterMs)
        : undefined;

    const current = this.state.get(providerId) ?? { cooldownUntil: 0 };
    this.state.set(providerId, {
      ...current,
      cooldownUntil:
        Date.now() +
        (retryAfterMs && retryAfterMs > 0
          ? retryAfterMs
          : status === 429
            ? 60_000
            : 5_000),
    });
  }
}
