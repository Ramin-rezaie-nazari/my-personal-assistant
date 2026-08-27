import { getStoredAccessToken } from './api';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
export type BasketItem = { id:string; foodId:string; name:string; quantity:number; unit:string; source:string; sourceRecipeId:string|null; priority:string; sortOrder:number; completed:boolean };

async function request<T>(path:string, options:RequestInit={}) : Promise<T> {
  const token=await getStoredAccessToken();
  const headers=new Headers(options.headers);
  headers.set('Content-Type','application/json');
  if(token) headers.set('Authorization',`Bearer ${token}`);
  const response=await fetch(`${API_URL}${path}`,{...options,headers});
  if(!response.ok) throw new Error((await response.text())||`Request failed with ${response.status}`);
  return response.json() as Promise<T>;
}

export async function getBasket():Promise<BasketItem[]> { return request('/shopping/basket'); }
export async function completeBasketItem(id:string){ return request(`/shopping/basket/${id}/complete`,{method:'POST'}); }
export async function reopenBasketItem(id:string){ return request(`/shopping/basket/${id}/reopen`,{method:'POST'}); }
export async function removeBasketItem(id:string){ return request(`/shopping/basket/${id}`,{method:'DELETE'}); }
export async function reorderBasket(ids:string[]){ return request<BasketItem[]>('/shopping/basket/reorder',{method:'POST',body:JSON.stringify({ids})}); }
export async function addBasketItem(data:{foodId:string;quantity:number;unit:string;source?:string;priority?:string;sourceRecipeId?:string}){ return request<BasketItem>('/shopping/basket',{method:'POST',body:JSON.stringify(data)}); }
