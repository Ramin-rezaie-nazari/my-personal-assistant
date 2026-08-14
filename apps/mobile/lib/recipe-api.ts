import { getStoredAccessToken } from './api';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export type RecipeMatch = {
  recipeId: string; name: string; calories: number; protein: number; carbs: number; fat: number;
  coveragePercent: number; missingCount: number;
  missing: Array<{ foodId: string; name: string; quantity: number; unit: string }>;
  available: Array<{ foodId: string; name: string; quantity: number; unit: string }>;
  score: number;
};

export async function getRecipeMatches(): Promise<RecipeMatch[]> {
  const token = await getStoredAccessToken();
  const response = await fetch(`${API_URL}/recipes/match`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!response.ok) throw new Error((await response.text()) || `Request failed with ${response.status}`);
  return response.json() as Promise<RecipeMatch[]>;
}
