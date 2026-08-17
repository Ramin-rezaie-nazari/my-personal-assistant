export type AiProviderId = string;

export type AiTask =
  | 'intent-understanding'
  | 'text-generation'
  | 'voice-transcription'
  | 'voice-synthesis'
  | 'vision'
  | 'planning';

export type AiProviderRequest = {
  input: string;
  context?: Record<string, unknown>;
  task?: AiTask;
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

export type AiProviderCapabilities = ReadonlySet<AiTask>;

export type AiProviderMetadata = {
  priority: number;
  capabilities: AiProviderCapabilities;
  local: boolean;
};

export interface AiProvider {
  readonly id: AiProviderId;
  readonly metadata?: AiProviderMetadata;
  isAvailable(): Promise<boolean>;
  generate(request: AiProviderRequest): Promise<AiProviderResponse>;
}
