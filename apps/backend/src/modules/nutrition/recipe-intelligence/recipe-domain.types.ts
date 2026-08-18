/**
 * Recipe Intelligence domain contracts.
 *
 * Provider-agnostic and persistence-agnostic by design. The recipe engine must
 * operate from our own structured knowledge base and must not require an
 * external recipe API at runtime.
 */

export type RecipeStatus = 'draft' | 'verified' | 'retired';
export type RecipeDifficulty = 'easy' | 'medium' | 'hard';
export type RecipeMealType = 'breakfast' | 'brunch' | 'lunch' | 'dinner' | 'snack' | 'dessert' | 'drink';

export type DietaryTag =
  | 'vegetarian' | 'vegan' | 'pescatarian' | 'halal' | 'kosher'
  | 'gluten_free' | 'dairy_free' | 'low_carb' | 'high_protein' | 'low_calorie';

export type IngredientRole =
  | 'main' | 'protein' | 'carbohydrate' | 'vegetable' | 'fruit' | 'dairy'
  | 'fat' | 'spice' | 'sauce' | 'garnish' | 'leavening' | 'other';

/** Real cooking is not purely linear. */
export type IngredientScalingPolicy =
  | 'linear'
  | 'sublinear'
  | 'fixed'
  | 'per_batch'
  | 'manual_review';

export type IngredientMeasurementKind = 'mass' | 'volume' | 'count' | 'package' | 'unitless';

export interface RecipeIngredientContract {
  ingredientId: string;
  role: IngredientRole;
  quantity: number;
  unit: string;
  measurementKind?: IngredientMeasurementKind;
  optional?: boolean;
  preparation?: string;
  substitutions?: string[];
  scalingPolicy?: IngredientScalingPolicy;
  /** Review when a recipe is scaled beyond this multiplier. */
  maxLinearMultiplier?: number;
  /** Exponent for sublinear ingredients such as salt/spices/oil. */
  scalingExponent?: number;
  /** Number of servings represented by one ingredient batch. */
  batchSize?: number;
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
    | 'country_match' | 'cuisine_match' | 'inventory_match' | 'nutrition_match'
    | 'diet_match' | 'time_match' | 'excluded_ingredient' | 'missing_ingredient';
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

/** User-facing recipe scaling is mandatory for every recipe. */
export interface RecipeScalingContext {
  /** Number of people being served. */
  targetServings: number;
  /** Optional explicit batch count for production/catering workflows. */
  targetBatches?: number;
  locale?: string;
  kitchenFriendlyRounding?: boolean;
}

export interface ScaledRecipeIngredient {
  ingredientId: string;
  baseQuantity: number;
  scaledQuantity: number;
  unit: string;
  scalingPolicy: IngredientScalingPolicy;
  manualReviewRequired: boolean;
  note?: string;
}

export interface ScaledRecipeNutrition {
  calories: number;
  proteinGrams: number;
  carbohydratesGrams: number;
  fatGrams: number;
  fiberGrams?: number;
  sodiumMg?: number;
  sugarGrams?: number;
}

export interface ScaledRecipeResult {
  recipeId: string;
  baseServings: number;
  targetServings: number;
  scaleFactor: number;
  estimatedBatches: number;
  ingredients: ScaledRecipeIngredient[];
  nutritionForFullBatch: ScaledRecipeNutrition;
  nutritionPerServing: ScaledRecipeNutrition;
  requiresManualReview: boolean;
}

/**
 * Deterministic serving scaler used by every recipe regardless of country,
 * cuisine or meal type. The UI must not perform its own scaling math.
 */
export function scaleRecipe(
  recipe: RecipeContract,
  context: RecipeScalingContext,
): ScaledRecipeResult {
  if (!Number.isInteger(context.targetServings) || context.targetServings <= 0) {
    throw new Error('targetServings must be a positive integer');
  }
  if (!Number.isFinite(recipe.servings) || recipe.servings <= 0) {
    throw new Error('recipe.servings must be greater than zero');
  }

  const scaleFactor = context.targetServings / recipe.servings;
  const estimatedBatches = context.targetBatches ?? Math.max(1, Math.ceil(scaleFactor));
  let requiresManualReview = false;

  const ingredients = recipe.ingredients.map((ingredient) => {
    const policy = ingredient.scalingPolicy ?? 'linear';
    let scaledQuantity: number;
    let manualReviewRequired = false;
    let note: string | undefined;

    switch (policy) {
      case 'linear':
        scaledQuantity = ingredient.quantity * scaleFactor;
        break;
      case 'sublinear': {
        const exponent = ingredient.scalingExponent ?? 0.85;
        scaledQuantity = ingredient.quantity * Math.pow(scaleFactor, exponent);
        note = 'Scaled sublinearly because culinary impact does not normally grow 1:1 with servings.';
        break;
      }
      case 'fixed':
        scaledQuantity = ingredient.quantity;
        note = 'Kept fixed per recipe/batch; cookware and technique may require adjustment.';
        break;
      case 'per_batch': {
        const batchSize = ingredient.batchSize ?? recipe.servings;
        const batches = Math.ceil(context.targetServings / batchSize);
        scaledQuantity = ingredient.quantity * batches;
        note = `Scaled by ${batches} cooking batch(es).`;
        break;
      }
      case 'manual_review':
        scaledQuantity = ingredient.quantity * scaleFactor;
        manualReviewRequired = true;
        note = 'Technique-sensitive ingredient requires review at this scale.';
        break;
    }

    if (
      ingredient.maxLinearMultiplier !== undefined &&
      scaleFactor > ingredient.maxLinearMultiplier
    ) {
      manualReviewRequired = true;
      note = 'Scale exceeds the configured linear range; review before cooking.';
    }

    requiresManualReview ||= manualReviewRequired;

    return {
      ingredientId: ingredient.ingredientId,
      baseQuantity: ingredient.quantity,
      scaledQuantity: context.kitchenFriendlyRounding === false
        ? scaledQuantity
        : roundKitchenQuantity(scaledQuantity),
      unit: ingredient.unit,
      scalingPolicy: policy,
      manualReviewRequired,
      note,
    };
  });

  const nutritionForFullBatch = scaleNutrition(
    recipe.nutritionPerServing,
    context.targetServings,
  );

  return {
    recipeId: recipe.id,
    baseServings: recipe.servings,
    targetServings: context.targetServings,
    scaleFactor,
    estimatedBatches,
    ingredients,
    nutritionForFullBatch,
    nutritionPerServing: recipe.nutritionPerServing,
    requiresManualReview,
  };
}

function scaleNutrition(
  nutrition: RecipeNutritionContract,
  targetServings: number,
): ScaledRecipeNutrition {
  return {
    calories: nutrition.calories * targetServings,
    proteinGrams: nutrition.proteinGrams * targetServings,
    carbohydratesGrams: nutrition.carbohydratesGrams * targetServings,
    fatGrams: nutrition.fatGrams * targetServings,
    fiberGrams: nutrition.fiberGrams === undefined ? undefined : nutrition.fiberGrams * targetServings,
    sodiumMg: nutrition.sodiumMg === undefined ? undefined : nutrition.sodiumMg * targetServings,
    sugarGrams: nutrition.sugarGrams === undefined ? undefined : nutrition.sugarGrams * targetServings,
  };
}

function roundKitchenQuantity(quantity: number): number {
  if (quantity <= 0) return 0;
  if (quantity < 1) return Number(quantity.toFixed(2));
  if (quantity < 10) return Number(quantity.toFixed(1));
  return Math.round(quantity * 2) / 2;
}
