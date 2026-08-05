import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthSyncService {
  async syncHealthData() {
    await Promise.resolve();

    return {
      message: 'Health data synced',
    };
  }
}
