import { Injectable } from '@nestjs/common';
import { DeliveryJob } from './notification-delivery-queue.service';

export type NotificationChannel = 'in_app' | 'push';
export type ProviderResult = {
  accepted: boolean;
  provider: string;
  providerMessageId?: string;
  retryable?: boolean;
  error?: string;
};

export interface NotificationDeliveryProvider {
  readonly name: string;
  readonly channel: NotificationChannel;
  deliver(job: DeliveryJob, destination: string): Promise<ProviderResult>;
}

@Injectable()
export class InAppNotificationDeliveryProvider implements NotificationDeliveryProvider {
  readonly name = 'in-app';
  readonly channel = 'in_app' as const;
  deliver(job: DeliveryJob, destination: string): Promise<ProviderResult> {
    if (!destination)
      return Promise.resolve({
        accepted: false,
        provider: this.name,
        retryable: false,
        error: 'Missing in-app destination.',
      });
    return Promise.resolve({
      accepted: true,
      provider: this.name,
      providerMessageId: `${job.id}:${destination}`,
    });
  }
}

@Injectable()
export class NotificationDeliveryProviderRegistry {
  constructor(
    private readonly inAppProvider: InAppNotificationDeliveryProvider,
  ) {}
  get(channel: NotificationChannel): NotificationDeliveryProvider | null {
    if (channel === 'in_app') return this.inAppProvider;
    return null;
  }
}
