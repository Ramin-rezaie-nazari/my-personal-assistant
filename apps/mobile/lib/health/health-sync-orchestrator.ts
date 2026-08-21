import AsyncStorage from '@react-native-async-storage/async-storage';
import { getNativeHealthProvider } from './health-provider-factory';
import { syncProviderSince } from './health-sync-client';

const LAST_SYNC_KEY = 'mpa.health.lastSyncAt';
const DEFAULT_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000;

export type HealthSyncRun = {
  provider: string;
  deviceId: string;
  received: number;
  written: number;
  since: string;
  completedAt: string;
};

export async function syncHealthNow(options?: { lookbackMs?: number }): Promise<HealthSyncRun | null> {
  const provider = await getNativeHealthProvider();
  if (!provider) return null;

  const stored = await AsyncStorage.getItem(LAST_SYNC_KEY);
  const fallbackSince = new Date(Date.now() - DEFAULT_LOOKBACK_MS);
  const lastSync = stored ? new Date(stored) : fallbackSince;
  const since = Number.isFinite(lastSync.getTime()) ? lastSync : fallbackSince;
  const boundedSince = options?.lookbackMs
    ? new Date(Math.min(since.getTime(), Date.now() - Math.max(60_000, options.lookbackMs)))
    : since;

  const result = await syncProviderSince(provider, boundedSince);
  const completedAt = new Date().toISOString();
  await AsyncStorage.setItem(LAST_SYNC_KEY, completedAt);

  return {
    ...result,
    since: boundedSince.toISOString(),
    completedAt,
  };
}

export async function getLastHealthSyncAt(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_SYNC_KEY);
}
