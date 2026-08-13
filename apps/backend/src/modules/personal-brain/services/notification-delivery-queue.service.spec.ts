import { NotificationDeliveryQueueService } from './notification-delivery-queue.service';

describe('NotificationDeliveryQueueService', () => {
  const event: any = { type: 'next_action', priority: 'normal', title: 'Task', message: 'Start', scheduledFor: '2026-08-12T10:00:00.000Z', dedupeKey: 'task:t1' };
  const decision: any = { send: true, event, reason: 'inside window', deliverAt: event.scheduledFor };

  it('queues and retries a failed delivery', () => {
    const service = new NotificationDeliveryQueueService(); const now = new Date('2026-08-12T10:00:00Z'); const job = service.enqueue(event, decision, now)!;
    expect(job.status).toBe('queued'); service.markFailed(job.id, 'temporary', now); expect(service.get(job.id)?.status).toBe('queued'); expect(service.get(job.id)?.attempts).toBe(1);
  });
  it('fails permanently after max attempts', () => { const service = new NotificationDeliveryQueueService(); const job = service.enqueue(event, decision)!; service.markFailed(job.id, 'x'); service.markFailed(job.id, 'x'); service.markFailed(job.id, 'x'); expect(service.get(job.id)?.status).toBe('failed'); });
  it('expires jobs after their TTL', () => { const service = new NotificationDeliveryQueueService(); const job = service.enqueue(event, decision, new Date('2026-08-12T10:00:00Z'), 1)!; service.expire(new Date('2026-08-12T10:02:00Z')); expect(service.get(job.id)?.status).toBe('expired'); });
});
