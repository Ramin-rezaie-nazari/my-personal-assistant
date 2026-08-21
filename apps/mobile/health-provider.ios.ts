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
    await HealthKit.requestAuthorization({
      toRead: READ_TYPES as never,
    });
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
        // HealthKit permissions and availability differ by OS version/device; one failed type should not block the entire sync.
      }
    }

    return points;
  },
};
