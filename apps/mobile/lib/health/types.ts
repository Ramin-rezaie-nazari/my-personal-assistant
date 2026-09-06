export type HealthProvider = 'apple_healthkit' | 'android_health_connect';

export type HealthMetricKind =
  | 'steps'
  | 'active_energy_burned'
  | 'basal_energy_burned'
  | 'distance'
  | 'heart_rate'
  | 'sleep'
  | 'workout'
  | 'body_weight'
  | 'body_fat'
  | 'blood_pressure'
  | 'blood_glucose'
  | 'oxygen_saturation';

export type HealthSample = {
  id: string;
  metric: HealthMetricKind;
  value: number;
  unit: string;
  startAt: string;
  endAt: string;
  sourceId: string;
  sourceName?: string;
  sourceProvider: HealthProvider;
  metadata?: Record<string, string | number | boolean | null>;
};

export type HealthIntegrationStatus = {
  integration: 'device_health';
  status: 'not_configured' | 'partially_configured' | 'ready';
  providers: {
    iosHealthKit: 'not_configured' | 'available' | 'error';
    androidHealthConnect: 'not_configured' | 'available' | 'error';
  };
  supportedSources: HealthProvider[];
  dataContract: {
    normalizedMetrics: HealthMetricKind[];
    incrementalSync: boolean;
    dedupeRequired: boolean;
  };
  notes: string[];
};
