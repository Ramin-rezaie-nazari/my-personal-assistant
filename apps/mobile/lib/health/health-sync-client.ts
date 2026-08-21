import { getStoredAccessToken } from '../api';
import type { NormalizedHealthPoint } from './health-provider';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export type HealthSyncResult = {
  provider: string;
  deviceId: string;
  received: number;
  written: number;
};

export async function syncHealthPoints(
  provider: string,
  deviceId: string,
  points: NormalizedHealthPoint[],
): Promise<HealthSyncResult> {
  const token = await getStoredAccessToken();
  if (!token) throw new Error('Health sync requires an authenticated user');
  if (points.length === 0) return { provider, deviceId, received: 0, written: 0 };

  const response = await fetch(`${API_URL}/device-intelligence/health-sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ provider, deviceId, points }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Health sync failed with ${response.status}`);
  }

  return (await response.json()) as HealthSyncResult;
}

export async function syncProviderSince(provider: {
  provider: string;
  deviceId: string;
  isAvailable(): Promise<boolean>;
  requestPermissions(): Promise<boolean>;
  readSince(since: Date): Promise<NormalizedHealthPoint[]>;
}, since: Date): Promise<HealthSyncResult> {
  if (!(await provider.isAvailable())) {
    throw new Error(`${provider.provider} is not available on this device`);
  }
  if (!(await provider.requestPermissions())) {
    throw new Error(`${provider.provider} health permissions were not granted`);
  }

  const points = await provider.readSince(since);
  return syncHealthPoints(provider.provider, provider.deviceId, points);
}
