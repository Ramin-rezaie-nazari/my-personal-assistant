import { MOBILE_API_URL } from './api-base';
import { getStoredAccessToken } from './api';

export type FoodRecommendation = {
  recipeId: string;
  name: string;
  score: number;
  baseScore: number;
  personalizationAdjustment: number;
  recentlyEaten: boolean;
  reasons: string[];
  coveragePercent: number;
  missingCount: number;
  caloriesPerServing: number;
  proteinPerServing: number;
  targetServings: number;
  missingIngredients: Array<{ foodId: string; name: string; quantity: number; unit: string }>;
};

export type FoodRecommendationResponse = {
  targetServings: number;
  countryCode: string | null;
  generatedDeterministically: true;
  personalization: {
    primaryGoal: string | null;
    dietType: string | null;
    calorieLimit?: number;
    proteinFloor?: number;
    recentMealCount: number;
  };
  recommendations: FoodRecommendation[];
};

export async function getFoodRecommendations(input: {
  targetServings: number;
  countryCode?: string;
  maxCalories?: number;
  minProteinGrams?: number;
  maxMissingIngredients?: number;
}): Promise<FoodRecommendationResponse> {
  const token = await getStoredAccessToken();
  if (!token) throw new Error('Authentication is required for food recommendations.');

  const response = await fetch(`${MOBILE_API_URL}/recommendation-intelligence/food`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error((await response.text()) || `Food recommendation failed with ${response.status}`);
  }

  return response.json() as Promise<FoodRecommendationResponse>;
}
