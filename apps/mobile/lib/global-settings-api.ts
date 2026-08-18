import {
  getStoredAccessToken,
  getStoredRefreshToken,
  setAuthSession,
} from './api';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export type MeasurementSystem = 'metric' | 'us-customary' | 'uk-imperial';

export type VoiceProfile = {
  id: string;
  label: string;
  languageTag: string;
  countryCode: string;
  accent: string;
  direction: 'ltr' | 'rtl';
  fallbackLanguageTag: string;
  offlineCapable: boolean;
};

export type GlobalUserSettings = {
  languageTag: string;
  countryCode: string | null;
  currencyCode: string | null;
  measurementSystem: MeasurementSystem;
  timezone: string;
  voiceProfile: VoiceProfile;
  globalization: {
    languageTag: string;
    languageCode: string;
    countryCode: string | null;
    currencyCode: string | null;
    measurementSystem: MeasurementSystem;
    timezone: string;
    direction: 'ltr' | 'rtl';
  };
};

export type UpdateGlobalUserSettings = Partial<{
  languageTag: string;
  countryCode: string | null;
  currencyCode: string | null;
  measurementSystem: MeasurementSystem;
  timezone: string;
  voiceProfile: string | null;
}>;

async function request(path: string, init: RequestInit = {}, token?: string): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${API_URL}${path}`, { ...init, headers });
}

async function requestAuthorized<T>(path: string, init: RequestInit = {}): Promise<T> {
  let token = await getStoredAccessToken();
  let response = await request(path, init, token ?? undefined);

  if (response.status === 401 && token) {
    const refreshToken = await getStoredRefreshToken();
    if (refreshToken) {
      const refreshResponse = await request('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
      if (refreshResponse.ok) {
        const auth: unknown = await refreshResponse.json();
        const accessToken = typeof auth === 'object' && auth !== null && 'accessToken' in auth && typeof auth.accessToken === 'string'
          ? auth.accessToken
          : null;
        if (accessToken) {
          await setAuthSession(auth as Parameters<typeof setAuthSession>[0]);
          token = accessToken;
          response = await request(path, init, token);
        }
      }
    }
  }

  if (!response.ok) {
    throw new Error((await response.text()) || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getGlobalUserSettings() {
  return requestAuthorized<GlobalUserSettings>('/assistant/settings/global');
}

export function updateGlobalUserSettings(patch: UpdateGlobalUserSettings) {
  return requestAuthorized<GlobalUserSettings>('/assistant/settings/global', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}
