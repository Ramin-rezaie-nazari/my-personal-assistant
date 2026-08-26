import { getStoredAccessToken } from './api';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export type ConsolidatedShoppingNeed = {
  foodId: string;
  name: string;
  quantity: number;
  unit: string;
  recipeIds: string[];
};

export type ConsolidatedShoppingResponse = {
  recipes: Array<{ recipeId: string; name: string; servings: number }>;
  items: ConsolidatedShoppingNeed[];
  totalItems: number;
  generatedDeterministically: boolean;
};

export async function buildConsolidatedShoppingPlan(
  recipes: Array<{ recipeId: string; servings: number }>,
  countryCode = '',
): Promise<ConsolidatedShoppingResponse> {
  const token = await getStoredAccessToken();
  const response = await fetch(`${API_URL}/recipes/shopping/consolidate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ recipes, countryCode }),
  });
  if (!response.ok) throw new Error((await response.text()) || `Request failed with ${response.status}`);
  return response.json() as Promise<ConsolidatedShoppingResponse>;
}
