import { apiRequest } from './api';

export type InventoryItem = {
  id: string; foodId: string; quantity: number; unit: string; dailyConsumption: number; safetyStock: number;
  essential: boolean; expiresAt: string | null; daysRemaining: number | null; reorderPoint: number; recommendedQuantity: number;
  urgency: 'critical'|'soon'|'normal'|'none'; reason: string; food: { id: string; name: string; category: string };
};

export function getInventory() { return apiRequest<InventoryItem[]>('/inventory'); }
export function setInventoryQuantity(id: string, quantity: number) { return apiRequest<InventoryItem>(`/inventory/${id}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }); }
export function addInventory(data: { foodId: string; quantity: number; unit?: string; dailyConsumption?: number; safetyStock?: number; essential?: boolean; expiresAt?: string }) { return apiRequest<InventoryItem>('/inventory', { method: 'POST', body: JSON.stringify(data) }); }
export function removeInventory(id: string) { return apiRequest<{ deleted: true }>(`/inventory/${id}`, { method: 'DELETE' }); }
