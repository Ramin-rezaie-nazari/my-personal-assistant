import { AiProviderRouterService } from './ai-provider-router.service';
import { AiCoreGatewayService } from './ai-core-gateway.service';

describe('AiCoreGatewayService', () => {
  const makeGateway = (generate = jest.fn()) =>
    new AiCoreGatewayService({ generate } as unknown as AiProviderRouterService);

  it('routes generic runs through the provider router and preserves the task', async () => {
    const generate = jest.fn().mockResolvedValue({
      providerId: 'local-core',
      text: 'ok',
    });
    const gateway = makeGateway(generate);

    await expect(
      gateway.run({
        input: 'سلام',
        task: 'text-generation',
        context: { userId: 'u1' },
      }),
    ).resolves.toEqual({
      providerId: 'local-core',
      text: 'ok',
      task: 'text-generation',
    });

    expect(generate).toHaveBeenCalledWith({
      input: 'سلام',
      task: 'text-generation',
      context: { userId: 'u1' },
    });
  });

  it('exposes stable task-specific entry points without exposing providers', async () => {
    const generate = jest.fn().mockResolvedValue({
      providerId: 'provider-b',
      text: 'result',
    });
    const gateway = makeGateway(generate);

    await gateway.understand('این را بفهم');
    await gateway.generateText('جواب بده');
    await gateway.plan('برای امروز برنامه بده');
    await gateway.transcribe('audio-input');
    await gateway.synthesize('این را بخوان');
    await gateway.analyzeVision('frame-data');

    expect(generate.mock.calls.map(([request]) => request.task)).toEqual([
      'intent-understanding',
      'text-generation',
      'planning',
      'voice-transcription',
      'voice-synthesis',
      'vision',
    ]);
  });

  it('propagates router failures unchanged', async () => {
    const error = new Error('No AI provider is available');
    const generate = jest.fn().mockRejectedValue(error);
    const gateway = makeGateway(generate);

    await expect(gateway.generateText('hello')).rejects.toBe(error);
  });
});
