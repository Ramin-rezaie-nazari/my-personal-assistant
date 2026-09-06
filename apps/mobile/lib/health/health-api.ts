import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOBILE_API_URL } from '../api-base';
import type { HealthIntegrationStatus } from './types';

const ACCESS_TOKEN_KEY = 'mpa.accessToken';
const REFRESH_TOKEN_KEY = 'mpa.refreshToken';

async function request<T>(path: string): Promise<T> {
  const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  const response = await fetch(`${MOBILE_API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error((await response.text()) || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getHealthIntegrationStatus() {
  return request<HealthIntegrationStatus>('/device-intelligence');
}
