import { Injectable } from '@nestjs/common';
import { NotificationDeliveryQueueService, DeliveryJob } from './notification-delivery-queue.service';
import { NotificationDeliveryProviderRegistry, NotificationChannel, ProviderResult } from './notification-delivery-provider.service';

@Injectable()
export class NotificationDeliveryDispatcherService {
  constructor(private readonly queue: NotificationDeliveryQueueService, private readonly providers: NotificationDeliveryProviderRegistry) {}

  async dispatch(jobId: string, channel: NotificationChannel, destination: string, now = new Date()): Promise<{ job: DeliveryJob | null; result: ProviderResult }> {
    const job = this.queue.get(jobId);
    if (!job) return { job: null, result: { accepted: false, provider: 'none', retryable: false, error: 'Delivery job not found.' } };
    if (job.status !== 'queued') return { job, result: { accepted: false, provider: 'none', retryable: false, error: `Job is ${job.status}.` } };
    if (now >= new Date(job.expiresAt)) { this.queue.expire(now); return { job: this.queue.get(jobId) ?? job, result: { accepted: false, provider: 'none', retryable: false, error: 'Delivery job expired.' } }; }
    const provider = this.providers.get(channel);
    if (!provider) { const failed = this.queue.markFailed(jobId, `No provider configured for channel: ${channel}`, now); return { job: failed, result: { accepted: false, provider: 'none', retryable: false, error: `No provider configured for channel: ${channel}` } }; }
    try {
      const result = await provider.deliver(job, destination);
      if (result.accepted) this.queue.markDelivered(jobId, now);
      else if (result.retryable === false) this.queue.markFailed(jobId, result.error ?? 'Permanent delivery failure.', now);
      else this.queue.markFailed(jobId, result.error ?? 'Temporary delivery failure.', now);
      return { job: this.queue.get(jobId) ?? job, result };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown provider error.';
      const failed = this.queue.markFailed(jobId, message, now);
      return { job: failed, result: { accepted: false, provider: provider.name, retryable: true, error: message } };
    }
  }
}
