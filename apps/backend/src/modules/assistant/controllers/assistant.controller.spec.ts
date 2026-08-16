import { AssistantController } from './assistant.controller';

describe('AssistantController history', () => {
  it('passes the authenticated owner and normalized limit to the service', async () => {
    const service = { getHistory: jest.fn().mockResolvedValue([]) };
    const controller = new AssistantController(service as never);

    await controller.getHistory({ user: { id: 'u1' } } as never, '40');

    expect(service.getHistory).toHaveBeenCalledWith('u1', 40);
  });

  it('falls back to the default history size for invalid limits', async () => {
    const service = { getHistory: jest.fn().mockResolvedValue([]) };
    const controller = new AssistantController(service as never);

    await controller.getHistory(
      { user: { id: 'u1' } } as never,
      'not-a-number',
    );

    expect(service.getHistory).toHaveBeenCalledWith('u1', 24);
  });
});
