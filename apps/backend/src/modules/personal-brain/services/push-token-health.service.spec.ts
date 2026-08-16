import { PushTokenHealthService } from './push-token-health.service';
import { NotificationDeviceRegistryService } from './notification-device-registry.service';

describe('PushTokenHealthService', () => {
  it('disables a device for a permanent token error', () => {
    const devices = new NotificationDeviceRegistryService();
    const device = devices.register({
      userId: 'u1',
      platform: 'android',
      pushToken: 't1',
    });
    const service = new PushTokenHealthService(devices);
    const result = service.handleProviderError(
      device.id,
      'DeviceNotRegistered',
    );
    expect(result.action).toBe('disable_device');
    expect(devices.listEnabled('u1')).toHaveLength(0);
  });

  it('keeps the device enabled for a temporary error', () => {
    const devices = new NotificationDeviceRegistryService();
    const device = devices.register({
      userId: 'u1',
      platform: 'ios',
      pushToken: 't2',
    });
    const service = new PushTokenHealthService(devices);
    const result = service.handleProviderError(device.id, 'Timeout');
    expect(result.action).toBe('retry');
    expect(devices.listEnabled('u1')).toHaveLength(1);
  });
});
