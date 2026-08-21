import { HealthDataType, HealthProvider, NormalizedHealthPoint } from './lib/health/health-provider';

const READ_TYPES = [
  'HKQuantityTypeIdentifierStepCount',
  'HKQuantityTypeIdentifierDistanceWalkingRunning',
  'HKQuantityTypeIdentifierActiveEnergyBurned',
  'HKQuantityTypeIdentifierBasalEnergyBurned',
  'HKQuantityTypeIdentifierHeartRate',
  'HKQuantityTypeIdentifierRestingHeartRate',
  'HKQuantityTypeIdentifierBodyMass',
  'HKCategoryTypeIdentifierSleepAnalysis',
  'HKWorkoutTypeIdentifier',
] as const;

function mapQuantityType(identifier: string): { dataType: HealthDataType; unit: string } | null {
  switch (identifier) {
    case 'HKQuantityTypeIdentifierStepCount':
      return { dataType: 'steps', unit: 'count' };
    case 'HKQuantityTypeIdentifierDistanceWalkingRunning':
      return { dataType: 'distance_walking_running', unit: 'm' };
    case 'HKQuantityTypeIdentifierActiveEnergyBurned':
      return { dataType: 'active_calories', unit: 'kcal' };
    case 'HKQuantityTypeIdentifierBasalEnergyBurned':
      return { dataType: 'total_calories', unit: 'kcal' };
    case 'HKQuantityTypeIdentifierHeartRate':
      return { dataType: 'heart_rate', unit: 'count/min' };
    case 'HKQuantityTypeIdentifierRestingHeartRate':
      return { dataType: 'resting_heart_rate', unit: 'count/min' };
    case 'HKQuantityTypeIdentifierBodyMass':
      return { dataType: 'weight', unit: 'kg' };
    default:
      return null;
  }
}

export const healthKitProvider: HealthProvider = {
  provider: 'healthkit',
  deviceId: 'ios-healthkit',
  async isAvailable() {
    const HealthKit = await import('@kingstinct/react-native-healthkit');
    return Boolean(await HealthKit.isHealthDataAvailable());
  },
  async requestPermissions() {
    const HealthKit = await import('@kingstinct/react-native-healthkit');
    await HealthKit.requestAuthorization({ toRead: READ_TYPES as never });
    return true;
  },
  async readSince(since: Date) {
    const HealthKit = await import('@kingstinct/react-native-healthkit');
    const now = new Date();
    const points: NormalizedHealthPoint[] = [];

    for (const identifier of READ_TYPES) {
      if (identifier === 'HKCategoryTypeIdentifierSleepAnalysis' || identifier === 'HKWorkoutTypeIdentifier') continue;
      const mapped = mapQuantityType(identifier);
      if (!mapped) continue;
      try {
        const result = await HealthKit.queryQuantitySamples(identifier as never, {
          limit: -1,
          filter: { date: { startDate: since, endDate: now } },
          unit: mapped.unit,
        } as never);
        const samples = Array.isArray(result) ? result : result?.samples ?? [];
        for (const sample of samples as Array<Record<string, any>>) {
          const startAt = new Date(sample.startDate ?? sample.startAt);
          const endAt = new Date(sample.endDate ?? sample.endAt);
          const value = Number(sample.quantity);
          if (!Number.isFinite(value) || !Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime())) continue;
          points.push({
            dataType: mapped.dataType,
            value,
            unit: mapped.unit,
            startAt: startAt.toISOString(),
            endAt: endAt.toISOString(),
            sourceRecordId: String(sample.uuid ?? sample.metadata?.HKExternalUUID ?? `${identifier}:${startAt.toISOString()}:${endAt.toISOString()}:${value}`),
            metadata: { source: 'HealthKit', identifier },
          });
        }
      } catch {
        // A denied/unsupported type must not block all other health data.
      }
    }

    try {
      const sleepSamples = await HealthKit.queryCategorySamples('HKCategoryTypeIdentifierSleepAnalysis' as never, {
        limit: -1,
        filter: { date: { startDate: since, endDate: now } },
      } as never);
      const samples = Array.isArray(sleepSamples) ? sleepSamples : sleepSamples?.samples ?? [];
      for (const sample of samples as Array<Record<string, any>>) {
        const startAt = new Date(sample.startDate ?? sample.startAt);
        const endAt = new Date(sample.endDate ?? sample.endAt);
        if (!Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime())) continue;
        points.push({
          dataType: 'sleep_duration',
          value: Math.max(0, (endAt.getTime() - startAt.getTime()) / 3_600_000),
          unit: 'h',
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          sourceRecordId: String(sample.uuid ?? `sleep:${startAt.toISOString()}:${endAt.toISOString()}`),
          metadata: { source: 'HealthKit', identifier: 'HKCategoryTypeIdentifierSleepAnalysis', value: sample.value },
        });
      }
    } catch {
      // Sleep permissions/support can vary; keep the rest of the sync usable.
    }

    try {
      const workouts = await HealthKit.queryWorkouts({
        ascending: false,
        limit: -1,
      } as never);
      for (const workout of (workouts ?? []) as Array<Record<string, any>>) {
        const startAt = new Date(workout.startDate);
        const endAt = new Date(workout.endDate);
        if (!Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime()) || endAt < since) continue;
        points.push({
          dataType: 'workout_duration',
          value: Math.max(0, (endAt.getTime() - startAt.getTime()) / 60_000),
          unit: 'min',
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          sourceRecordId: String(workout.uuid ?? `workout:${startAt.toISOString()}:${endAt.toISOString()}`),
          metadata: {
            source: 'HealthKit',
            identifier: 'HKWorkoutTypeIdentifier',
            workoutActivityType: workout.workoutActivityType,
          },
        });
        const energy = Number(workout.totalEnergyBurned?.quantity ?? workout.totalEnergyBurned ?? NaN);
        if (Number.isFinite(energy) && energy >= 0) {
          points.push({
            dataType: 'workout_calories',
            value: energy,
            unit: 'kcal',
            startAt: startAt.toISOString(),
            endAt: endAt.toISOString(),
            sourceRecordId: `${String(workout.uuid ?? `workout:${startAt.toISOString()}:${endAt.toISOString()}`)}:energy`,
            metadata: { source: 'HealthKit', identifier: 'HKWorkoutTypeIdentifier' },
          });
        }
      }
    } catch {
      // Workout querying is best-effort per provider/runtime version.
    }

    return points;
  },
};
