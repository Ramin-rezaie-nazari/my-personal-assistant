import { apiRequest } from './api';

export type RecipeMissingItem = { foodId: string; name: string; quantity: number; unit: string };
export type RecipeMatch = {
  recipeId: string; name: string; calories: number; protein: number; carbs: number; fat: number;
  coveragePercent: number; missingCount: number;
  missing: RecipeMissingItem[];
  available: Array<{ foodId: string; name: string; quantity: number; unit: string }>;
  score: number;
};

export function getRecipeMatches(): Promise<RecipeMatch[]> {
  return apiRequest<RecipeMatch[]>('/recipes/match');
}

export function addRecipeMissingToBasket(recipeId: string, missing: RecipeMissingItem[]): Promise<{ added: number; recipeId: string }> {
  return apiRequest<{ added: number; recipeId: string }>('/shopping/from-recipe', {
    method: 'POST',
    body: JSON.stringify({ recipeId, items: missing }),
  });
}
