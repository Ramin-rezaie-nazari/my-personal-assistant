import { AssistantController } from './assistant.controller';

describe('AssistantController history', () => {
  const householdCommands = { tryExecute: jest.fn() };

  it('passes the authenticated owner and normalized limit to the service', async () => {
    const service = { getHistory: jest.fn().mockResolvedValue([]) };
    const controller = new AssistantController(service as never, householdCommands as never);

    await controller.getHistory({ user: { id: 'u1' } } as never, '40');

    expect(service.getHistory).toHaveBeenCalledWith('u1', 40);
  });

  it('falls back to the default history size for invalid limits', async () => {
    const service = { getHistory: jest.fn().mockResolvedValue([]) };
    const controller = new AssistantController(service as never, householdCommands as never);

    await controller.getHistory(
      { user: { id: 'u1' } } as never,
      'not-a-number',
    );

    expect(service.getHistory).toHaveBeenCalledWith('u1', 24);
  });
});

describe('AssistantController locale propagation', () => {
  it('passes the validated preferred locale to the assistant service', async () => {
    const service = { process: jest.fn().mockResolvedValue({ message: 'ok' }) };
    const controller = new AssistantController(service as never, householdCommands as never);
    householdCommands.tryExecute.mockResolvedValue({ handled: false, executed: false });

    await controller.process(
      { message: 'امشب چی بخورم؟', locale: 'fa-IR' },
      { user: { id: 'u1' } } as never,
    );

    expect(service.process).toHaveBeenCalledWith('امشب چی بخورم؟', 'u1', 'fa-IR');
  });
});
