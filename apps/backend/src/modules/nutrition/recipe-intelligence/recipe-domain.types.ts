/**
 * Recipe Intelligence domain contract.
 *
 * This is deliberately provider-agnostic and persistence-agnostic. The recipe
 * engine must be able to operate from our own structured knowledge base and
 * must not require an external recipe API at runtime.
 */

export type RecipeStatus = 'draft' | 'verified' | 'retired';

export type RecipeDifficulty = 'easy' | 'medium' | 'hard';

export type RecipeMealType =
  | 'breakfast'
  | 'brunch'
  | 'lunch'
  | 'dinner'
  | 'snack'
  | 'dessert'
  | 'drink';

export type DietaryTag =
  | 'vegetarian'
  | 'vegan'
  | 'pescatarian'
  | 'halal'
  | 'kosher'
  | 'gluten_free'
  | 'dairy_free'
  | 'low_carb'
  | 'high_protein'
  | 'low_calorie';

export type IngredientRole =
  | 'main'
  | 'protein'
  | 'carbohydrate'
  | 'vegetable'
  | 'fruit'
  | 'dairy'
  | 'fat'
  | 'spice'
  | 'sauce'
  | 'garnish'
  | 'other';

export interface RecipeIngredientContract {
  ingredientId: string;
  role: IngredientRole;
  quantity: number;
  unit: string;
  optional?: boolean;
  preparation?: string;
  substitutions?: string[];
}

export interface RecipeNutritionContract {
  calories: number;
  proteinGrams: number;
  carbohydratesGrams: number;
  fatGrams: number;
  fiberGrams?: number;
  sodiumMg?: number;
  sugarGrams?: number;
}

export interface RecipeContract {
  id: string;
  canonicalName: string;
  localizedNames: Record<string, string>;
  countryCodes: string[];
  regionIds: string[];
  cuisineIds: string[];
  mealTypes: RecipeMealType[];
  dietaryTags: DietaryTag[];
  ingredients: RecipeIngredientContract[];
  nutritionPerServing: RecipeNutritionContract;
  servings: number;
  prepMinutes: number;
  cookMinutes: number;
  difficulty: RecipeDifficulty;
  status: RecipeStatus;
  sourceType: 'internal' | 'licensed' | 'user';
  version: number;
}

export interface RecipeMatchContext {
  countryCode?: string;
  preferredCuisineIds?: string[];
  mealType?: RecipeMealType;
  dietaryTags?: DietaryTag[];
  excludedIngredients?: string[];
  availableIngredientIds?: string[];
  maxCalories?: number;
  minProteinGrams?: number;
  maxPrepMinutes?: number;
  servings?: number;
}

export interface RecipeMatchReason {
  code:
    | 'country_match'
    | 'cuisine_match'
    | 'inventory_match'
    | 'nutrition_match'
    | 'diet_match'
    | 'time_match'
    | 'excluded_ingredient'
    | 'missing_ingredient';
  score: number;
  detail: string;
}

export interface RecipeMatchResult {
  recipeId: string;
  score: number;
  reasons: RecipeMatchReason[];
  missingIngredientIds: string[];
  matchedIngredientIds: string[];
}
