import Constants from 'expo-constants';

export function validateMobileApiUrl(url: string, environment = process.env.NODE_ENV): string {
  const normalized = url.trim().replace(/\/$/, '');
  if (!normalized) throw new Error('EXPO_PUBLIC_API_URL must not be empty.');

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error('EXPO_PUBLIC_API_URL must be a valid absolute URL.');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('EXPO_PUBLIC_API_URL must use HTTP or HTTPS.');
  }

  if (environment === 'production' && parsed.protocol !== 'https:') {
    throw new Error('EXPO_PUBLIC_API_URL must use HTTPS for production mobile builds.');
  }

  return normalized;
}

export function resolveMobileApiUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) return validateMobileApiUrl(configured);
  if (process.env.NODE_ENV === 'production') {
    throw new Error('EXPO_PUBLIC_API_URL is required for production mobile builds.');
  }
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return host && host !== 'localhost' && host !== '127.0.0.1'
    ? `http://${host}:3000`
    : 'http://localhost:3000';
}

export const MOBILE_API_URL = resolveMobileApiUrl();
