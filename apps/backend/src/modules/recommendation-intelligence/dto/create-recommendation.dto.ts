export class CreateRecommendationDto {
  category!: string;
  goal!: string;
  context!: string;

  targetServings?: number;
  countryCode?: string;
  maxCalories?: number;
  minProteinGrams?: number;
  maxMissingIngredients?: number;
  preferredIngredients?: string[];
  dislikedIngredients?: string[];
  dietaryPreferences?: string[];
  allergySignals?: string[];
  maxResults?: number;
}
