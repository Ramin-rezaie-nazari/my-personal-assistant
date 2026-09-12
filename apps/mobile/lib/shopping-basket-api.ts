import { apiRequest } from './api';
export type BasketItem = { id:string; foodId:string; name:string; quantity:number; unit:string; source:string; sourceRecipeId:string|null; priority:string; completed:boolean };
export function getBasket():Promise<BasketItem[]> { return apiRequest<BasketItem[]>('/shopping/basket'); }
export function completeBasketItem(id:string){ return apiRequest(`/shopping/basket/${id}/complete`,{method:'POST'}); }
