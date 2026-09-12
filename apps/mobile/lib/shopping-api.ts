import { apiRequest } from './api';
export type SmartShoppingItem = { foodId:string; name:string; category:string; quantity:number; unit:string; recommendedQuantity:number; urgency:'critical'|'soon'|'normal'|'none'; reason:string; essential:boolean };
export function getSmartShoppingList():Promise<SmartShoppingItem[]> { return apiRequest<SmartShoppingItem[]>('/shopping/smart'); }
export function addSuggestionToBasket(item:SmartShoppingItem){ return apiRequest('/shopping/basket',{method:'POST',body:JSON.stringify({foodId:item.foodId,name:item.name,quantity:item.recommendedQuantity>0?item.recommendedQuantity:1,unit:item.unit,source:'smart',priority:item.urgency==='critical'?'critical':'normal'})}); }
