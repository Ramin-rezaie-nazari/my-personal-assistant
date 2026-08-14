import { getStoredAccessToken } from './api';
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
export type SmartShoppingItem = { foodId:string; name:string; category:string; quantity:number; unit:string; recommendedQuantity:number; urgency:'critical'|'soon'|'normal'|'none'; reason:string; essential:boolean };
async function request(path:string,options:RequestInit={}){const token=await getStoredAccessToken();const response=await fetch(`${API_URL}${path}`,{...options,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})}});if(!response.ok)throw new Error((await response.text())||`Request failed with ${response.status}`);return response.json();}
export async function getSmartShoppingList():Promise<SmartShoppingItem[]>{return request('/shopping/smart');}
export async function addSuggestionToBasket(item:SmartShoppingItem){return request('/shopping/basket',{method:'POST',body:JSON.stringify({foodId:item.foodId,name:item.name,quantity:item.recommendedQuantity>0?item.recommendedQuantity:1,unit:item.unit,source:'smart',priority:item.urgency==='critical'?'critical':'normal'})});}
