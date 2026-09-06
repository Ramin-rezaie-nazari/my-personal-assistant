import Constants from 'expo-constants';

export function resolveMobileApiUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('EXPO_PUBLIC_API_URL is required for production mobile builds.');
  }
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return host && host !== 'localhost' && host !== '127.0.0.1'
    ? `http://${host}:3000`
    : 'http://localhost:3000';
}

export const MOBILE_API_URL = resolveMobileApiUrl();
