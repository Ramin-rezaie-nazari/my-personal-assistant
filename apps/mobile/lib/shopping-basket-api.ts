import { request } from './api';

export type BasketItem = {
  id: string;
  foodId: string;
  name: string;
  quantity: number;
  unit: string;
  source: string;
  sourceRecipeId: string | null;
  priority: string;
  completed: boolean;
};

export function getBasket() {
  return request<BasketItem[]>('/shopping/basket');
}

export function completeBasketItem(id: string) {
  return request(`/shopping/basket/${id}/complete`, { method: 'POST' });
}
