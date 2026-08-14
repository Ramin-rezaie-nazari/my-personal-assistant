import { getStoredAccessToken } from './api';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export type SmartShoppingItem = {
  foodId: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  recommendedQuantity: number;
  urgency: 'critical' | 'soon' | 'normal' | 'none';
  reason: string;
  essential: boolean;
};

export async function getSmartShoppingList(): Promise<SmartShoppingItem[]> {
  const token = await getStoredAccessToken();
  const response = await fetch(`${API_URL}/shopping/smart`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!response.ok) throw new Error((await response.text()) || `Request failed with ${response.status}`);
  return response.json() as Promise<SmartShoppingItem[]>;
}
