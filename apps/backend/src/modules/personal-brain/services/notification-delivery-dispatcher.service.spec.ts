import { NotificationDeliveryDispatcherService } from './notification-delivery-dispatcher.service';
import { NotificationDeliveryProviderRegistry, InAppNotificationDeliveryProvider } from './notification-delivery-provider.service';
import { NotificationDeliveryQueueService } from './notification-delivery-queue.service';

describe('NotificationDeliveryDispatcherService', () => {
  const event: any = { type: 'next_action', priority: 'normal', title: 'Task', message: 'Start', scheduledFor: '2026-08-12T10:00:00.000Z', dedupeKey: 'task:t1' };
  const decision: any = { send: true, event, reason: 'allowed', deliverAt: event.scheduledFor };

  it('dispatches a queued job through the selected provider', async () => {
    const queue = new NotificationDeliveryQueueService();
    const registry = new NotificationDeliveryProviderRegistry(new InAppNotificationDeliveryProvider());
    const dispatcher = new NotificationDeliveryDispatcherService(queue, registry);
    const job = queue.enqueue(event, decision)!;
    const result = await dispatcher.dispatch(job.id, 'in_app', 'user:u1');
    expect(result.result.accepted).toBe(true);
    expect(result.job?.status).toBe('delivered');
  });

  it('fails safely when a channel has no provider', async () => {
    const queue = new NotificationDeliveryQueueService();
    const registry = new NotificationDeliveryProviderRegistry(new InAppNotificationDeliveryProvider());
    const dispatcher = new NotificationDeliveryDispatcherService(queue, registry);
    const job = queue.enqueue(event, decision)!;
    const result = await dispatcher.dispatch(job.id, 'push', 'token');
    expect(result.result.accepted).toBe(false);
    expect(result.job?.attempts).toBe(1);
  });
});
