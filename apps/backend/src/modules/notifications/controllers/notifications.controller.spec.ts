import { NotificationsController } from './notifications.controller';

describe('NotificationsController', () => {
  const notificationsService = {
    createNotification: jest.fn(),
    getNotifications: jest.fn(),
    markAllRead: jest.fn(),
    markRead: jest.fn(),
  };
  const smartNotificationService = {
    generateForUser: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('passes the authenticated owner to create', async () => {
    const controller = new NotificationsController(
      notificationsService as never,
      smartNotificationService as never,
    );
    const dto = { title: 'Water', type: 'hydration' };

    await controller.create({ user: { id: 'u1' } }, dto);

    expect(notificationsService.createNotification).toHaveBeenCalledWith(
      'u1',
      dto,
    );
  });

  it('passes the authenticated owner and optional date to smart generation', async () => {
    const controller = new NotificationsController(
      notificationsService as never,
      smartNotificationService as never,
    );

    await controller.generate({ user: { id: 'u1' } }, '2026-08-15');
    await controller.generate({ user: { id: 'u1' } });

    expect(smartNotificationService.generateForUser).toHaveBeenNthCalledWith(
      1,
      'u1',
      '2026-08-15',
    );
    expect(smartNotificationService.generateForUser).toHaveBeenNthCalledWith(
      2,
      'u1',
      undefined,
    );
  });

  it('parses includeRead explicitly', async () => {
    const controller = new NotificationsController(
      notificationsService as never,
      smartNotificationService as never,
    );

    await controller.findAll({ user: { id: 'u1' } }, 'true');
    await controller.findAll({ user: { id: 'u1' } }, 'false');
    await controller.findAll({ user: { id: 'u1' } });

    expect(notificationsService.getNotifications).toHaveBeenNthCalledWith(
      1,
      'u1',
      true,
    );
    expect(notificationsService.getNotifications).toHaveBeenNthCalledWith(
      2,
      'u1',
      false,
    );
    expect(notificationsService.getNotifications).toHaveBeenNthCalledWith(
      3,
      'u1',
      false,
    );
  });

  it('delegates mark-all-read and mark-read with the authenticated owner', async () => {
    const controller = new NotificationsController(
      notificationsService as never,
      smartNotificationService as never,
    );
    const req = { user: { id: 'u1' } };

    await controller.markAllRead(req);
    await controller.markRead(req, 'n1');

    expect(notificationsService.markAllRead).toHaveBeenCalledWith('u1');
    expect(notificationsService.markRead).toHaveBeenCalledWith('u1', 'n1');
  });
});
