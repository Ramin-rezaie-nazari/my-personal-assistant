import { Injectable } from '@nestjs/common';

export type HealthProviderStatus = 'not_configured' | 'available' | 'error';

export interface DeviceHealthIntegrationStatus {
  integration: 'device_health';
  status: 'not_configured' | 'partially_configured' | 'ready';
  providers: {
    iosHealthKit: HealthProviderStatus;
    androidHealthConnect: HealthProviderStatus;
  };
  supportedSources: Array<'apple_healthkit' | 'android_health_connect'>;
  dataContract: {
    normalizedMetrics: string[];
    incrementalSync: boolean;
    dedupeRequired: boolean;
  };
  notes: string[];
}

@Injectable()
export class DeviceIntelligenceService {
  async getHealthData(): Promise<DeviceHealthIntegrationStatus> {
    await Promise.resolve();

    return {
      integration: 'device_health',
      status: 'not_configured',
      providers: {
        iosHealthKit: 'not_configured',
        androidHealthConnect: 'not_configured',
      },
      supportedSources: ['apple_healthkit', 'android_health_connect'],
      dataContract: {
        normalizedMetrics: [
          'steps',
          'active_energy_burned',
          'basal_energy_burned',
          'distance',
          'heart_rate',
          'sleep',
          'workout',
          'body_weight',
          'body_fat',
          'blood_pressure',
          'blood_glucose',
          'oxygen_saturation',
        ],
        incrementalSync: true,
        dedupeRequired: true,
      },
      notes: [
        'Native HealthKit / Health Connect bridges are not configured in this build.',
        'No synthetic health values are returned while the provider layer is unavailable.',
        'Direct support for every wearable brand depends on the data exposed through the platform health hub.',
      ],
    };
  }
}
