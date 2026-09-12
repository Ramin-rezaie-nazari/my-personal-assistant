import { getStoredAccessToken, getStoredRefreshToken, setAuthSession, clearAuthSession, AuthResponse } from './api';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export type RecipeMissingItem = { foodId: string; name: string; quantity: number; unit: string };
export type RecipeMatch = {
  recipeId: string; name: string; calories: number; protein: number; carbs: number; fat: number;
  coveragePercent: number; missingCount: number;
  missing: RecipeMissingItem[];
  available: Array<{ foodId: string; name: string; quantity: number; unit: string }>;
  score: number;
};

async function request<T>(path:string, init:RequestInit={}):Promise<T>{
  let token=await getStoredAccessToken();
  const send=async(current:string|null)=>fetch(`${API_URL}${path}`,{...init,headers:{'Content-Type':'application/json',...(current?{Authorization:`Bearer ${current}`}:{})}});
  let response=await send(token);
  if(response.status===401&&token){
    const refresh=await getStoredRefreshToken();
    if(refresh){
      const refreshResponse=await fetch(`${API_URL}/auth/refresh`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refreshToken:refresh})});
      if(refreshResponse.ok){const auth=await refreshResponse.json() as AuthResponse;await setAuthSession(auth);token=auth.accessToken;response=await send(token)}
      else await clearAuthSession();
    }
  }
  if(!response.ok)throw new Error((await response.text())||`Request failed with ${response.status}`);
  return response.json() as Promise<T>;
}

export function getRecipeMatches(){return request<RecipeMatch[]>('/recipes/match');}
export function addRecipeMissingToBasket(recipeId:string,missing:RecipeMissingItem[]){return request<{added:number;recipeId:string}>('/shopping/from-recipe',{method:'POST',body:JSON.stringify({recipeId,items:missing})});}
