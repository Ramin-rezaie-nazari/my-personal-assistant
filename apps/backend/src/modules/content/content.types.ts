export type ContentType = 'recipe' | 'exercise';

export type RecommendationSignals = {
  language?: string;
  country?: string;
  originCountry?: string;
  preferredCuisines?: string[];
  dislikedCuisines?: string[];
  likedContentIds?: string[];
  dislikedContentIds?: string[];
  recentContentIds?: string[];
  availableIngredients?: string[];
  availableEquipment?: string[];
  dietaryTags?: string[];
  goals?: string[];
  difficulty?: string;
};

export type RecipeCandidate = {
  id: string;
  title: string;
  originCountry?: string;
  cuisines: string[];
  countries: string[];
  tags: string[];
  ingredients: string[];
  calories?: number;
  protein?: number;
  prepTimeMinutes?: number;
  difficulty?: string;
  popularityScore?: number;
};

export type ExerciseCandidate = {
  id: string;
  title: string;
  discipline: string;
  targetCountries?: string[];
  tags: string[];
  equipment: string[];
  difficulty?: string;
  goals?: string[];
  popularityScore?: number;
};

export type ScoredCandidate<T> = T & {
  recommendationScore: number;
  recommendationReasons: string[];
};
