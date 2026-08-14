import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const ACCESS_TOKEN_KEY = 'mpa.accessToken';
const REFRESH_TOKEN_KEY = 'mpa.refreshToken';

type AuthResponse = { accessToken: string; refreshToken: string };

type ExecutionReceipt = {
  userId: string;
  decisionId: string;
  action: string;
  domain: string;
  status: 'completed' | 'blocked' | 'unsupported' | 'failed' | 'dry_run' | 'pending_confirmation' | 'confirmation_invalid';
  reason: string;
  result?: unknown;
  confirmationToken?: string;
  durationMs: number;
  attempts: number;
};

async function rawRequest(path: string, init: RequestInit = {}, token?: string) {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${API_URL}${path}`, { ...init, headers });
}

async function refreshAccessToken() {
  const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;
  const response = await rawRequest('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) });
  if (!response.ok) {
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
    return null;
  }
  const auth = await response.json() as AuthResponse;
  await AsyncStorage.multiSet([[ACCESS_TOKEN_KEY, auth.accessToken], [REFRESH_TOKEN_KEY, auth.refreshToken]]);
  return auth.accessToken;
}

async function request<T>(path: string, init: RequestInit = {}) {
  let token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  let response = await rawRequest(path, init, token ?? undefined);
  if (response.status === 401 && token) {
    token = await refreshAccessToken();
    if (token) response = await rawRequest(path, init, token);
  }
  if (!response.ok) throw new Error((await response.text()) || `Request failed with ${response.status}`);
  return response.json() as Promise<T>;
}

export function executeNextBestAction() {
  return request<ExecutionReceipt>('/personal-brain/decision/execute-next', { method: 'POST' });
}

export function confirmNextBestAction(token: string) {
  return request<ExecutionReceipt>('/personal-brain/decision/confirm', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export function recordBrainFeedback(data: {
  candidate: { id: string; domain: 'schedule'; action: 'complete_life_task'; score?: number; confidence?: number; priority?: number; source?: string; durationMinutes?: number };
  outcome: 'accepted' | 'completed' | 'dismissed' | 'failed' | 'skipped';
  note?: string;
}) {
  return request('/personal-brain/decision/feedback', { method: 'POST', body: JSON.stringify(data) });
}
