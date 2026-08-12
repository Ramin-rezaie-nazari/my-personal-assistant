import { InAppNotificationDeliveryProvider, NotificationDeliveryProviderRegistry } from './notification-delivery-provider.service';

describe('NotificationDeliveryProviderRegistry', () => {
  it('resolves the in-app provider without coupling callers to an implementation', () => {
    const provider = new InAppNotificationDeliveryProvider();
    const registry = new NotificationDeliveryProviderRegistry(provider);
    expect(registry.get('in_app')).toBe(provider);
    expect(registry.get('push')).toBeNull();
  });

  it('delivers through the in-app contract', async () => {
    const provider = new InAppNotificationDeliveryProvider();
    const result = await provider.deliver({ id: 'n1' } as any, 'user:u1');
    expect(result.accepted).toBe(true);
    expect(result.provider).toBe('in-app');
  });
});
