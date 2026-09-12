import { getStoredAccessToken, getStoredRefreshToken, setAuthSession, clearAuthSession, AuthResponse } from './api';
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
export type SmartShoppingItem = { foodId:string; name:string; category:string; quantity:number; unit:string; recommendedQuantity:number; urgency:'critical'|'soon'|'normal'|'none'; reason:string; essential:boolean };
async function request<T>(path:string,options:RequestInit={}):Promise<T>{
  let token=await getStoredAccessToken();
  const send=async(current:string|null)=>fetch(`${API_URL}${path}`,{...options,headers:{'Content-Type':'application/json',...(current?{Authorization:`Bearer ${current}`}:{})}});
  let response=await send(token);
  if(response.status===401&&token){
    const refresh=await getStoredRefreshToken();
    if(refresh){const r=await fetch(`${API_URL}/auth/refresh`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refreshToken:refresh})});if(r.ok){const auth=await r.json() as AuthResponse;await setAuthSession(auth);token=auth.accessToken;response=await send(token)}else await clearAuthSession()}
  }
  if(!response.ok)throw new Error((await response.text())||`Request failed with ${response.status}`);
  return response.json() as Promise<T>;
}
export function getSmartShoppingList(){return request<SmartShoppingItem[]>('/shopping/smart');}
export function addSuggestionToBasket(item:SmartShoppingItem){return request('/shopping/basket',{method:'POST',body:JSON.stringify({foodId:item.foodId,name:item.name,quantity:item.recommendedQuantity>0?item.recommendedQuantity:1,unit:item.unit,source:'smart',priority:item.urgency==='critical'?'critical':'normal'})});}
