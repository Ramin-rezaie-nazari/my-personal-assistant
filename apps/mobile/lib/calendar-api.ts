import {
  clearAuthSession,
  getStoredAccessToken,
  getStoredRefreshToken,
  setAuthSession,
  type AuthResponse,
} from './api';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export type CalendarEvent = {
  id: string;
  title: string;
  type: string;
  startsAt: string;
  endsAt: string | null;
  completed: boolean;
};

type CalendarPatch = Partial<Pick<CalendarEvent, 'title' | 'type' | 'startsAt'>> & { endsAt?: string | null };

async function rawRequest(path: string, init: RequestInit = {}, token?: string) {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${API_URL}${path}`, { ...init, headers });
}

async function refresh() {
  const refreshToken = await getStoredRefreshToken();
  if (!refreshToken) return null;
  const response = await rawRequest('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) });
  if (!response.ok) {
    await clearAuthSession();
    return null;
  }
  const auth = (await response.json()) as AuthResponse;
  await setAuthSession(auth);
  return auth.accessToken;
}

async function request<T>(path: string, init: RequestInit = {}) {
  let token = await getStoredAccessToken();
  let response = await rawRequest(path, init, token ?? undefined);
  if (response.status === 401 && token) {
    token = await refresh();
    if (token) response = await rawRequest(path, init, token);
  }
  if (!response.ok) throw new Error((await response.text()) || `Request failed with ${response.status}`);
  return (await response.json()) as T;
}

export function getCalendarEvents(from: string, to: string) {
  return request<CalendarEvent[]>(`/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
}

export function createCalendarEvent(data: { title: string; type: string; startsAt: string; endsAt?: string }) {
  return request<CalendarEvent>('/calendar', { method: 'POST', body: JSON.stringify(data) });
}

export function updateCalendarEvent(id: string, data: CalendarPatch) {
  return request<CalendarEvent>(`/calendar/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function completeCalendarEvent(id: string) {
  return request<{ id: string; completed: true }>(`/calendar/${id}/complete`, { method: 'POST' });
}

export function reopenCalendarEvent(id: string) {
  return request<{ id: string; completed: false }>(`/calendar/${id}/reopen`, { method: 'POST' });
}

export function deleteCalendarEvent(id: string) {
  return request<{ id: string; deleted: true }>(`/calendar/${id}`, { method: 'DELETE' });
}
