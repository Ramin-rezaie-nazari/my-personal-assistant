import { getStoredAccessToken } from './api';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export type InventoryItem = {
  id: string;
  foodId: string;
  quantity: number;
  unit: string;
  dailyConsumption: number;
  safetyStock: number;
  essential: boolean;
  expiresAt: string | null;
  daysRemaining: number | null;
  reorderPoint: number;
  recommendedQuantity: number;
  urgency: 'critical' | 'soon' | 'normal' | 'none';
  reason: string;
  food: { id: string; name: string; category: string };
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getStoredAccessToken();
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!response.ok) throw new Error((await response.text()) || `Request failed with ${response.status}`);
  return response.json() as Promise<T>;
}

export function getInventory() { return request<InventoryItem[]>('/inventory'); }
export function setInventoryQuantity(id: string, quantity: number) { return request<InventoryItem>(`/inventory/${id}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }); }
export function addInventory(data: { foodId: string; quantity: number; unit?: string; dailyConsumption?: number; safetyStock?: number; essential?: boolean; expiresAt?: string }) { return request<InventoryItem>('/inventory', { method: 'POST', body: JSON.stringify(data) }); }
export function removeInventory(id: string) { return request<{ deleted: true }>(`/inventory/${id}`, { method: 'DELETE' }); }
