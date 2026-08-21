import { HealthDataType, HealthProvider, NormalizedHealthPoint } from './lib/health/health-provider';

const PERMISSIONS = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'Distance' },
  { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
  { accessType: 'read', recordType: 'TotalCaloriesBurned' },
  { accessType: 'read', recordType: 'SleepSession' },
  { accessType: 'read', recordType: 'ExerciseSession' },
  { accessType: 'read', recordType: 'HeartRate' },
  { accessType: 'read', recordType: 'Weight' },
] as const;

const RANGES = {
  steps: 'Steps',
  distance: 'Distance',
  activeCalories: 'ActiveCaloriesBurned',
  totalCalories: 'TotalCaloriesBurned',
  sleep: 'SleepSession',
  exercise: 'ExerciseSession',
  heartRate: 'HeartRate',
  weight: 'Weight',
} as const;

export const healthConnectProvider: HealthProvider = {
  provider: 'healthconnect',
  deviceId: 'android-health-connect',
  async isAvailable() {
    const HealthConnect = await import('react-native-health-connect');
    const status = await HealthConnect.getSdkStatus();
    return String(status).toUpperCase().includes('AVAILABLE') || Number(status) > 0;
  },
  async requestPermissions() {
    const HealthConnect = await import('react-native-health-connect');
    const initialized = await HealthConnect.initialize();
    if (!initialized) return false;
    const granted = await HealthConnect.requestPermission(PERMISSIONS as never);
    return Array.isArray(granted) && granted.length > 0;
  },
  async readSince(since: Date) {
    const HealthConnect = await import('react-native-health-connect');
    if (!(await HealthConnect.initialize())) return [];
    const end = new Date();
    const range = { operator: 'between', startTime: since.toISOString(), endTime: end.toISOString() } as const;
    const points: NormalizedHealthPoint[] = [];

    const read = async (recordType: string, map: (record: any) => NormalizedHealthPoint | null) => {
      try {
        const result = await HealthConnect.readRecords(recordType as never, { timeRangeFilter: range });
        for (const record of result.records ?? []) {
          const point = map(record);
          if (point) points.push(point);
        }
      } catch {
        // Missing permissions/provider support for one record type must not block the rest of the sync.
      }
    };

    await read(RANGES.steps, (record) => ({
      dataType: 'steps',
      value: Number(record.count ?? 0),
      unit: 'count',
      startAt: new Date(record.startTime).toISOString(),
      endAt: new Date(record.endTime).toISOString(),
      sourceRecordId: record.metadata?.id,
      metadata: { source: 'HealthConnect', recordType: RANGES.steps },
    }));

    await read(RANGES.distance, (record) => ({
      dataType: 'distance_walking_running',
      value: Number(record.distance?.inMeters ?? record.distance?.value ?? 0),
      unit: 'm',
      startAt: new Date(record.startTime).toISOString(),
      endAt: new Date(record.endTime).toISOString(),
      sourceRecordId: record.metadata?.id,
      metadata: { source: 'HealthConnect', recordType: RANGES.distance },
    }));

    await read(RANGES.activeCalories, (record) => ({
      dataType: 'active_calories',
      value: Number(record.energy?.inKilocalories ?? record.energy?.inCalories ?? 0),
      unit: 'kcal',
      startAt: new Date(record.startTime).toISOString(),
      endAt: new Date(record.endTime).toISOString(),
      sourceRecordId: record.metadata?.id,
      metadata: { source: 'HealthConnect', recordType: RANGES.activeCalories },
    }));

    await read(RANGES.totalCalories, (record) => ({
      dataType: 'total_calories',
      value: Number(record.energy?.inKilocalories ?? record.energy?.inCalories ?? 0),
      unit: 'kcal',
      startAt: new Date(record.startTime).toISOString(),
      endAt: new Date(record.endTime).toISOString(),
      sourceRecordId: record.metadata?.id,
      metadata: { source: 'HealthConnect', recordType: RANGES.totalCalories },
    }));

    await read(RANGES.sleep, (record) => ({
      dataType: 'sleep_duration',
      value: Math.max(0, (new Date(record.endTime).getTime() - new Date(record.startTime).getTime()) / 3_600_000),
      unit: 'h',
      startAt: new Date(record.startTime).toISOString(),
      endAt: new Date(record.endTime).toISOString(),
      sourceRecordId: record.metadata?.id,
      metadata: { source: 'HealthConnect', recordType: RANGES.sleep, stage: record.stage?.name ?? record.stage },
    }));

    await read(RANGES.exercise, (record) => ({
      dataType: 'workout_duration',
      value: Math.max(0, (new Date(record.endTime).getTime() - new Date(record.startTime).getTime()) / 60_000),
      unit: 'min',
      startAt: new Date(record.startTime).toISOString(),
      endAt: new Date(record.endTime).toISOString(),
      sourceRecordId: record.metadata?.id,
      metadata: { source: 'HealthConnect', recordType: RANGES.exercise, exerciseType: record.exerciseType },
    }));

    await read(RANGES.heartRate, (record) => {
      const samples = record.samples ?? [];
      const bpm = samples.length ? samples.reduce((sum: number, item: any) => sum + Number(item.beatsPerMinute ?? 0), 0) / samples.length : 0;
      return {
        dataType: 'heart_rate' as HealthDataType,
        value: bpm,
        unit: 'count/min',
        startAt: new Date(record.startTime).toISOString(),
        endAt: new Date(record.endTime).toISOString(),
        sourceRecordId: record.metadata?.id,
        metadata: { source: 'HealthConnect', recordType: RANGES.heartRate, sampleCount: samples.length },
      };
    });

    await read(RANGES.weight, (record) => ({
      dataType: 'weight',
      value: Number(record.weight?.inKilograms ?? record.weight?.value ?? 0),
      unit: 'kg',
      startAt: new Date(record.time).toISOString(),
      endAt: new Date(record.time).toISOString(),
      sourceRecordId: record.metadata?.id,
      metadata: { source: 'HealthConnect', recordType: RANGES.weight },
    }));

    return points.filter((point) => Number.isFinite(point.value) && point.value >= 0);
  },
};
