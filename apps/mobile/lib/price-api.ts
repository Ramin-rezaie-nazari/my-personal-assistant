import { request } from './api';

export type PriceSnapshot = { id:string; productKey:string; sourceId:string; title:string; url:string|null; currency:string; amount:number; availability:string; observedAt:string };
export type PriceAnalysis = { productKey:string; current:number|null; average7d:number|null; average30d:number|null; min30d:number|null; max30d:number|null; changeVs7d:number|null; changeVs30d:number|null; trend:'rising'|'falling'|'stable'|'insufficient_data'; buyScore:number; recommendation:'buy_now'|'wait'|'watch'|'unavailable' };
export type PriceSource = { id:string; name:string; kind:string; baseUrl:string; enabled:boolean; adapterId:string };
export function normalizeProductKey(value:string){return value.trim().toLocaleLowerCase('fa-IR').replace(/[\u200c\s]+/g,'-').replace(/[^\p{L}\p{N}-]+/gu,'').slice(0,180)}
export function getLatestPrices(productKey?:string){return request<{items:PriceSnapshot[]}>(`/price-intelligence${productKey?`?productKey=${encodeURIComponent(productKey)}`:''}`)}
export function getPriceHistory(productKey:string,days=30){const from=new Date(Date.now()-days*86400000).toISOString();return request<{productKey:string;items:PriceSnapshot[]}>(`/price-intelligence/products/${encodeURIComponent(productKey)}/history?from=${encodeURIComponent(from)}`)}
export function getPriceAnalysis(productKey:string){return request<PriceAnalysis>(`/price-intelligence/products/${encodeURIComponent(productKey)}/analysis`)}
export function getPriceSources(){return request<PriceSource[]>('/price-intelligence/sources')}
