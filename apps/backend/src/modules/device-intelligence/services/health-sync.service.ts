import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthSyncService {
  async syncHealthData() {
    await Promise.resolve();

    return {
      synced: false,
      status: 'native_provider_required' as const,
      message:
        'Health data was not synced because the native HealthKit / Health Connect provider is not configured.',
    };
  }
}
