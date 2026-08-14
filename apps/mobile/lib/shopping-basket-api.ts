import { getStoredAccessToken } from './api';
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
export type BasketItem = { id:string; foodId:string; name:string; quantity:number; unit:string; source:string; sourceRecipeId:string|null; priority:string; completed:boolean };
async function request(path:string, options:RequestInit={}) { const token=await getStoredAccessToken(); const response=await fetch(`${API_URL}${path}`,{...options,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})}}); if(!response.ok) throw new Error((await response.text())||`Request failed with ${response.status}`); return response.json(); }
export async function getBasket():Promise<BasketItem[]> { return request('/shopping/basket'); }
export async function completeBasketItem(id:string){ return request(`/shopping/basket/${id}/complete`,{method:'POST'}); }
