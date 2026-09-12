import { getStoredAccessToken, getStoredRefreshToken, setAuthSession, clearAuthSession, AuthResponse } from './api';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export type AssistantHistoryTurn = { id:string; userId:string; role:'user'|'assistant'; text:string; createdAt:number; intent?:string; action?:string; executionId?:string; resourceType?:string; resourceId?:string };
export type AssistantExecution = { executed:boolean; action:string; message:string; intent:string };
export type AssistantResponse = { message:string; intent?:string; confidence?:number; nextAction?:string|null; responsePlan?:unknown; metadata?:Record<string,unknown>; execution?:AssistantExecution };

async function authorizedFetch(path:string, init:RequestInit={}) {
  let token=await getStoredAccessToken();
  if(!token) throw new Error('AUTH_REQUIRED');
  const send=async(current:string)=>fetch(`${API_URL}${path}`,{...init,headers:{'Content-Type':'application/json',Authorization:`Bearer ${current}`,...(init.headers??{})}});
  let response=await send(token);
  if(response.status===401){
    const refresh=await getStoredRefreshToken();
    if(refresh){
      const r=await fetch(`${API_URL}/auth/refresh`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refreshToken:refresh})});
      if(r.ok){const auth=await r.json() as AuthResponse;await setAuthSession(auth);token=auth.accessToken;response=await send(token)}
      else await clearAuthSession();
    }
  }
  return response;
}

export async function getAssistantHistory(limit=24):Promise<AssistantHistoryTurn[]> {
  const response=await authorizedFetch(`/assistant/history?limit=${encodeURIComponent(String(limit))}`);
  if(!response.ok)throw new Error((await response.text())||`Request failed with ${response.status}`);
  const data=await response.json() as AssistantHistoryTurn[]; return Array.isArray(data)?data:[];
}
export async function sendAssistantMessage(message:string):Promise<AssistantResponse> {
  const response=await authorizedFetch('/assistant',{method:'POST',body:JSON.stringify({message})});
  if(!response.ok)throw new Error((await response.text())||`Request failed with ${response.status}`);
  const data=await response.json() as AssistantResponse;
  return {...data,message:typeof data.message==='string'?data.message:'I could not understand the response.'};
}
