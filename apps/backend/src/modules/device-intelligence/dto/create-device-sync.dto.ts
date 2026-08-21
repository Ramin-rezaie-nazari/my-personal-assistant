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

export class HealthDataPointInput {
  dataType!: HealthDataType;
  value!: number;
  unit!: string;
  startAt!: string;
  endAt!: string;
  sourceRecordId?: string;
  metadata?: Record<string, unknown>;
}

export class CreateDeviceSyncDto {
  provider!: string;
  deviceId!: string;
  points!: HealthDataPointInput[];
}
