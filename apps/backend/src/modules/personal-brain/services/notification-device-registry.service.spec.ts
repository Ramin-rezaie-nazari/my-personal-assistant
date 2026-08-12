import { NotificationDeviceRegistryService } from './notification-device-registry.service';

describe('NotificationDeviceRegistryService', () => {
  it('registers a device and refreshes an existing token instead of duplicating it', () => {
    const service = new NotificationDeviceRegistryService();
    const first = service.register({ userId: 'u1', platform: 'android', pushToken: 'token-1', locale: 'fa' });
    const second = service.register({ userId: 'u1', platform: 'android', pushToken: 'token-1', locale: 'en' });
    expect(second.id).toBe(first.id);
    expect(service.listEnabled('u1')).toHaveLength(1);
    expect(second.locale).toBe('en');
  });

  it('supports disabling and re-enabling a device', () => {
    const service = new NotificationDeviceRegistryService();
    const device = service.register({ userId: 'u1', platform: 'ios', pushToken: 'token-2' });
    service.disable(device.id);
    expect(service.listEnabled('u1')).toHaveLength(0);
    service.enable(device.id);
    expect(service.listEnabled('u1')).toHaveLength(1);
  });
});
