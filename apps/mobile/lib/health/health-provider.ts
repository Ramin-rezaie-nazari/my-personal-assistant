export type HealthDataType =
  | 'steps'
  | 'distance_walking_running'
  | 'active_calories'
  | 'total_calories'
  | 'sleep_duration'
  | 'workout_duration'
  | 'workout_calories'
  | 'heart_rate'
  | 'resting_heart_rate'
  | 'weight';

export type NormalizedHealthPoint = {
  dataType: HealthDataType;
  value: number;
  unit: string;
  startAt: string;
  endAt: string;
  sourceRecordId?: string;
  metadata?: Record<string, unknown>;
};

export type HealthProvider = {
  provider: 'healthkit' | 'healthconnect' | 'other';
  deviceId: string;
  isAvailable(): Promise<boolean>;
  requestPermissions(): Promise<boolean>;
  readSince(since: Date): Promise<NormalizedHealthPoint[]>;
};
