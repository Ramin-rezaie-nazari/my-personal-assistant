import type { HealthMetricKind, HealthSample } from './types';

export type HealthSyncWindow = {
  startAt: string;
  endAt: string;
  cursor?: string;
};

export interface HealthProviderAdapter {
  readonly provider: 'apple_healthkit' | 'android_health_connect';
  isAvailable(): Promise<boolean>;
  requestAuthorization(metrics: HealthMetricKind[]): Promise<boolean>;
  readSamples(window: HealthSyncWindow, metrics: HealthMetricKind[]): Promise<{ samples: HealthSample[]; nextCursor?: string }>;
}
