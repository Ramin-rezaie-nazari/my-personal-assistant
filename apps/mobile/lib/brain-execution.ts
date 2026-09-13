import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const ACCESS_TOKEN_KEY = 'mpa.accessToken';
const REFRESH_TOKEN_KEY = 'mpa.refreshToken';

type AuthResponse = { accessToken: string; refreshToken: string; user?: { id: string; email: string; firstName: string | null; lastName: string | null; avatarUrl: string | null } };

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

async function secureGet(key: string) {
  try { return await SecureStore.getItemAsync(key); } catch { return null; }
}

async function secureSet(key: string, value: string) {
  await SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

async function clearAuthSession() {
  await Promise.all(
    [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY].map(async (key) => {
      try { await SecureStore.deleteItemAsync(key); } catch { /* best effort */ }
    }),
  );
}

async function refreshAccessToken() {
  const refreshToken = await secureGet(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;
  const response = await rawRequest('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) {
    await clearAuthSession();
    return null;
  }
  const auth = await response.json() as AuthResponse;
  await secureSet(ACCESS_TOKEN_KEY, auth.accessToken);
  await secureSet(REFRESH_TOKEN_KEY, auth.refreshToken);
  return auth.accessToken;
}

async function request<T>(path: string, init: RequestInit = {}) {
  let token = await secureGet(ACCESS_TOKEN_KEY);
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
