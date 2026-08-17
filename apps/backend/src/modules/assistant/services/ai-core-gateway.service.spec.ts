import { AiProviderRouterService } from './ai-provider-router.service';
import { AiCoreGatewayService } from './ai-core-gateway.service';
import { PersonalContext } from './personal-context.service';

describe('AiCoreGatewayService', () => {
  const makeGateway = (
    generate = jest.fn(),
    build = jest.fn(),
  ) =>
    new AiCoreGatewayService(
      { generate } as unknown as AiProviderRouterService,
      { build } as any,
    );

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

  it('assembles personal context before routing a user-aware AI request', async () => {
    const generate = jest.fn().mockResolvedValue({
      providerId: 'local-core',
      text: 'با توجه به وضعیت امروزت...',
    });
    const context = {
      user: {
        id: 'u1',
        name: 'Ramin',
        timezone: 'Asia/Tehran',
        language: 'fa',
      },
      dateKey: '2026-08-17',
      request: { input: 'امروز چی بخورم؟' },
      conversation: { turns: [] },
      nutrition: {} as PersonalContext['nutrition'],
      life: {} as PersonalContext['life'],
    } as PersonalContext;
    const build = jest.fn().mockResolvedValue(context);
    const gateway = makeGateway(generate, build);

    await expect(
      gateway.runForUser({
        userId: 'u1',
        input: 'امروز چی بخورم؟',
        task: 'text-generation',
        dateKey: '2026-08-17',
      }),
    ).resolves.toEqual({
      providerId: 'local-core',
      text: 'با توجه به وضعیت امروزت...',
      task: 'text-generation',
      context,
    });

    expect(build).toHaveBeenCalledWith({
      userId: 'u1',
      input: 'امروز چی بخورم؟',
      dateKey: '2026-08-17',
    });
    expect(generate).toHaveBeenCalledWith({
      input: 'امروز چی بخورم؟',
      task: 'text-generation',
      context: {
        dateKey: '2026-08-17',
        request: { input: 'امروز چی بخورم؟' },
        user: context.user,
        conversation: context.conversation,
        nutrition: context.nutrition,
        life: context.life,
      },
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
