import { getStoredAccessToken } from './api';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export type RecipeMissingItem = { foodId: string; name: string; quantity: number; unit: string };
export type RecipeMatch = {
  recipeId: string; name: string; calories: number; protein: number; carbs: number; fat: number;
  coveragePercent: number; missingCount: number;
  missing: RecipeMissingItem[];
  available: Array<{ foodId: string; name: string; quantity: number; unit: string }>;
  score: number;
};

export async function getRecipeMatches(): Promise<RecipeMatch[]> {
  const token = await getStoredAccessToken();
  const response = await fetch(`${API_URL}/recipes/match`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!response.ok) throw new Error((await response.text()) || `Request failed with ${response.status}`);
  return response.json() as Promise<RecipeMatch[]>;
}

export async function addRecipeMissingToBasket(recipeId: string, missing: RecipeMissingItem[]): Promise<{ added: number; recipeId: string }> {
  const token = await getStoredAccessToken();
  const response = await fetch(`${API_URL}/shopping/from-recipe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ recipeId, items: missing }),
  });
  if (!response.ok) throw new Error((await response.text()) || `Request failed with ${response.status}`);
  return response.json() as Promise<{ added: number; recipeId: string }>;
}
