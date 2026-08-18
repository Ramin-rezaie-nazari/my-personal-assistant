import { AssistantController } from './assistant.controller';

describe('AssistantController history and global settings', () => {
  it('passes the authenticated owner and normalized limit to the service', async () => {
    const service = { getHistory: jest.fn().mockResolvedValue([]) };
    const settings = { get: jest.fn(), update: jest.fn() };
    const controller = new AssistantController(service as never, settings as never);

    await controller.getHistory({ user: { id: 'u1' } } as never, '40');

    expect(service.getHistory).toHaveBeenCalledWith('u1', 40);
  });

  it('falls back to the default history size for invalid limits', async () => {
    const service = { getHistory: jest.fn().mockResolvedValue([]) };
    const settings = { get: jest.fn(), update: jest.fn() };
    const controller = new AssistantController(service as never, settings as never);

    await controller.getHistory(
      { user: { id: 'u1' } } as never,
      'not-a-number',
    );

    expect(service.getHistory).toHaveBeenCalledWith('u1', 24);
  });

  it('reads global settings for the authenticated user', async () => {
    const service = { getHistory: jest.fn() };
    const settings = { get: jest.fn().mockResolvedValue({ countryCode: 'ES' }), update: jest.fn() };
    const controller = new AssistantController(service as never, settings as never);

    await expect(controller.getGlobalSettings({ user: { id: 'u1' } } as never)).resolves.toEqual({ countryCode: 'ES' });
    expect(settings.get).toHaveBeenCalledWith('u1');
  });

  it('updates global settings for the authenticated user', async () => {
    const service = { getHistory: jest.fn() };
    const settings = { get: jest.fn(), update: jest.fn().mockResolvedValue({ countryCode: 'ES' }) };
    const controller = new AssistantController(service as never, settings as never);
    const body = { languageTag: 'es-ES', countryCode: 'ES', currencyCode: 'EUR' };

    await expect(controller.updateGlobalSettings(body, { user: { id: 'u1' } } as never)).resolves.toEqual({ countryCode: 'ES' });
    expect(settings.update).toHaveBeenCalledWith('u1', body);
  });
});
