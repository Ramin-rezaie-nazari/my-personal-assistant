import { LocalIntelligenceProvider } from './local-intelligence.provider';

describe('LocalIntelligenceProvider', () => {
  it('keeps provider responsibilities thin and delegates to the local core', async () => {
    const core = {
      generate: jest.fn().mockResolvedValue({
        providerId: 'local-core',
        task: 'text-generation',
        text: 'ok',
        confidence: 0.8,
        source: 'deterministic',
      }),
    } as any;
    const provider = new LocalIntelligenceProvider(core);

    await expect(
      provider.generate({ input: 'سلام', task: 'text-generation' }),
    ).resolves.toMatchObject({
      providerId: 'local-core',
      text: 'ok',
    });
    expect(core.generate).toHaveBeenCalledWith({
      input: 'سلام',
      task: 'text-generation',
    });
    expect(provider.metadata.priority).toBe(100);
    expect(provider.metadata.local).toBe(true);
  });
});
