import { Platform } from 'react-native';
import type { HealthProvider } from './health-provider';

let cachedProvider: HealthProvider | null | undefined;

export async function getNativeHealthProvider(): Promise<HealthProvider | null> {
  if (cachedProvider !== undefined) return cachedProvider;

  if (Platform.OS === 'ios') {
    const module = await import('../../health-provider.ios');
    cachedProvider = module.healthKitProvider;
    return cachedProvider;
  }

  if (Platform.OS === 'android') {
    const module = await import('../../health-provider.android');
    cachedProvider = module.healthConnectProvider;
    return cachedProvider;
  }

  cachedProvider = null;
  return null;
}
