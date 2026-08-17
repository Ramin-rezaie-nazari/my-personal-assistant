import { LocalIntelligenceProvider } from '../providers/local-intelligence.provider';
import { AiProviderRouterService } from './ai-provider-router.service';
import { AiProvider } from './ai-provider.types';

describe('AiProviderRouterService', () => {
  const local = () =>
    new LocalIntelligenceProvider({
      generate: jest.fn().mockResolvedValue({
        providerId: 'local-core',
        text: 'local response',
      }),
    } as any);

  const provider = (
    overrides: Partial<AiProvider> & Pick<AiProvider, 'id'>,
  ): AiProvider => ({
    id: overrides.id,
    metadata: overrides.metadata ?? {
      priority: 50,
      capabilities: new Set(['text-generation']),
      local: false,
    },
    isAvailable: overrides.isAvailable ?? (async () => true),
    generate:
      overrides.generate ??
      (async () => ({
        providerId: overrides.id,
        text: overrides.id,
      })),
  });

  it('prefers the local provider for supported local work', async () => {
    const router = new AiProviderRouterService(local());
    router.register(
      provider({
        id: 'remote-a',
        metadata: {
          priority: 50,
          capabilities: new Set(['intent-understanding']),
          local: false,
        },
      }),
    );

    const result = await router.generate({
      input: 'کالری امروزمو بگو',
      task: 'intent-understanding',
    });

    expect(result.providerId).toBe('local-core');
  });

  it('skips providers that do not support the requested task', async () => {
    const router = new AiProviderRouterService(local());
    const remote = provider({
      id: 'voice-only',
      metadata: {
        priority: 200,
        capabilities: new Set(['voice-transcription']),
        local: false,
      },
    });
    router.register(remote);

    await expect(
      router.generate({ input: 'hello', task: 'vision' }),
    ).rejects.toThrow('No AI provider is available for task: vision');
  });

  it('skips an exhausted provider and uses the next available remote provider', async () => {
    const router = new AiProviderRouterService(local());
    router.register(
      provider({
        id: 'remote-a',
        metadata: {
          priority: 200,
          capabilities: new Set(['text-generation']),
          local: false,
        },
      }),
    );
    router.register(
      provider({
        id: 'remote-b',
        metadata: {
          priority: 100,
          capabilities: new Set(['text-generation']),
          local: false,
        },
      }),
    );

    router.setQuota('local-core', { remaining: 0 });
    router.setQuota('remote-a', { remaining: 0 });

    const result = await router.generate({
      input: 'hello',
      task: 'text-generation',
    });

    expect(result.providerId).toBe('remote-b');
  });

  it('fails over after a provider error and cools the failed provider down', async () => {
    const router = new AiProviderRouterService(local());
    router.register(
      provider({
        id: 'remote-a',
        metadata: {
          priority: 200,
          capabilities: new Set(['intent-understanding']),
          local: false,
        },
        generate: async () => {
          throw Object.assign(new Error('rate limited'), { status: 429 });
        },
      }),
    );

    const result = await router.generate({
      input: 'کالری امروزمو بگو',
      task: 'intent-understanding',
    });

    expect(result.providerId).toBe('local-core');
    expect(router.getProviderState('remote-a').cooldownUntil).toBeGreaterThan(
      Date.now(),
    );
  });

  it('consumes tracked quota after a successful call', async () => {
    const router = new AiProviderRouterService(local());
    router.register(
      provider({
        id: 'remote-a',
        metadata: {
          priority: 200,
          capabilities: new Set(['text-generation']),
          local: false,
        },
      }),
    );
    router.setQuota('remote-a', { remaining: 2 });

    await router.generate({ input: 'hello', task: 'text-generation' });

    expect(router.getProviderState('remote-a').quota?.remaining).toBe(1);
  });
});
