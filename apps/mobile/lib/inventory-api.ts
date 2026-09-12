import { getStoredAccessToken, getStoredRefreshToken, setAuthSession, clearAuthSession, AuthResponse } from './api';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export type InventoryItem = {
  id: string; foodId: string; quantity: number; unit: string; dailyConsumption: number; safetyStock: number; essential: boolean;
  expiresAt: string | null; daysRemaining: number | null; reorderPoint: number; recommendedQuantity: number;
  urgency: 'critical' | 'soon' | 'normal' | 'none'; reason: string; food: { id: string; name: string; category: string };
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let token = await getStoredAccessToken();
  const send = async (current: string | null) => {
    const headers = new Headers(init.headers); headers.set('Content-Type', 'application/json'); if (current) headers.set('Authorization', `Bearer ${current}`);
    return fetch(`${API_URL}${path}`, { ...init, headers });
  };
  let response = await send(token);
  if (response.status === 401 && token) {
    const refresh = await getStoredRefreshToken();
    if (refresh) {
      const r = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: refresh }) });
      if (r.ok) { const auth = await r.json() as AuthResponse; await setAuthSession(auth); token = auth.accessToken; response = await send(token); }
      else await clearAuthSession();
    }
  }
  if (!response.ok) throw new Error((await response.text()) || `Request failed with ${response.status}`);
  return response.json() as Promise<T>;
}
export function getInventory() { return request<InventoryItem[]>('/inventory'); }
export function setInventoryQuantity(id: string, quantity: number) { return request<InventoryItem>(`/inventory/${id}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }); }
export function addInventory(data: { foodId: string; quantity: number; unit?: string; dailyConsumption?: number; safetyStock?: number; essential?: boolean; expiresAt?: string }) { return request<InventoryItem>('/inventory', { method: 'POST', body: JSON.stringify(data) }); }
export function removeInventory(id: string) { return request<{ deleted: true }>(`/inventory/${id}`, { method: 'DELETE' }); }
