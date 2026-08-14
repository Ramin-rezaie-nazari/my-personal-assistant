export type AiProviderId = string;

export type AiProviderRequest = {
  input: string;
  context?: Record<string, unknown>;
};

export type AiProviderResponse = {
  text: string;
  providerId: AiProviderId;
};

export type AiProviderFailure = {
  providerId: AiProviderId;
  retryAfterMs?: number;
  reason: 'rate_limit' | 'unavailable' | 'timeout' | 'error';
};

export interface AiProvider {
  readonly id: AiProviderId;
  isAvailable(): Promise<boolean>;
  generate(request: AiProviderRequest): Promise<AiProviderResponse>;
}
