import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const ACCESS_TOKEN_KEY = 'mpa.accessToken';
const REFRESH_TOKEN_KEY = 'mpa.refreshToken';

export type RecipeDetail = {
  id:string; userId:string|null; name:string; description:string|null; imageUrl:string|null; imageSource:string|null;
  servings:number; calories:number; protein:number; carbs:number; fat:number; verified:boolean;
  ingredients:Array<{id:string;foodId:string;quantity:number;unit:string;calories:number;protein:number;carbs:number;fat:number;food:{id:string;name:string;category:string;calories:number;protein:number;carbs:number;fat:number;imageUrl?:string|null;verified:boolean}}>;
};
export type ScaledRecipe = { recipe:{id:string;name:string;baseServings:number}; servings:number; ingredients:Array<{ingredientId:string;quantity:number;unit:string;displayQuantity?:number}>; nutritionPerServing?:{calories:number;proteinGrams:number;carbohydratesGrams:number;fatGrams:number} };

async function request<T>(path:string, init:RequestInit={}):Promise<T>{
 let token=await AsyncStorage.getItem(ACCESS_TOKEN_KEY); let response=await fetch(`${API_URL}${path}`,withAuth(init,token));
 if(response.status===401&&token){const refresh=await AsyncStorage.getItem(REFRESH_TOKEN_KEY);if(refresh){const rr=await fetch(`${API_URL}/auth/refresh`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refreshToken:refresh})});if(rr.ok){const auth=await rr.json() as {accessToken:string;refreshToken:string};await AsyncStorage.multiSet([[ACCESS_TOKEN_KEY,auth.accessToken],[REFRESH_TOKEN_KEY,auth.refreshToken]]);response=await fetch(`${API_URL}${path}`,withAuth(init,auth.accessToken));}}}
 if(!response.ok)throw new Error((await response.text())||`Request failed with ${response.status}`);return response.json() as Promise<T>;
}
function withAuth(init:RequestInit,token:string|null):RequestInit{const headers=new Headers(init.headers);headers.set('Content-Type','application/json');if(token)headers.set('Authorization',`Bearer ${token}`);return {...init,headers};}
export function getRecipeDetail(id:string){return request<RecipeDetail>(`/recipes/${encodeURIComponent(id)}`);}
export function getScaledRecipe(id:string,servings:number){return request<ScaledRecipe>(`/recipes/${encodeURIComponent(id)}/scaled?servings=${encodeURIComponent(String(servings))}`);}
export function addRecipeToShopping(id:string,servings:number){return request<{added:number}>(`/recipes/${encodeURIComponent(id)}/food-plan/shopping?servings=${encodeURIComponent(String(servings))}`,{method:'POST'});}
