import { Injectable } from '@nestjs/common';
import { GLOBAL_COUNTRY_FOOD_PROFILES, GlobalCountryFoodProfile } from '../data/global-country-food-profiles';

export type LocalRecipeGuidance = {
  countryCode: string;
  cuisineFamily: string;
  preferredRecipes: readonly string[];
  stapleIngredients: readonly string[];
  hardToSourceIngredients: readonly string[];
  substitutionPolicy: {
    preserveCuisineIdentity: true;
    preferLocalStaples: true;
    neverSilentlyReplace: true;
  };
};

export type CountryRecipeCandidate = {
  name: string;
  cuisineFamily?: string | null;
};

const GLOBAL_RECIPE_PATTERNS = [
  'pizza', 'pasta', 'burger', 'hamburger', 'fried rice', 'noodle', 'sushi',
  'ramen', 'taco', 'curry', 'sandwich', 'ice cream', 'cheesecake', 'pancake',
  'waffle', 'hot dog', 'french fries', 'chocolate cake', 'chocolate chip cookie',
  'mochi', 'dumpling', 'shawarma', 'falafel', 'hummus', 'teriyaki', 'pad thai',
  'pho', 'biryani', 'empanada', 'crepe', 'smoothie', 'muffin', 'doughnut',
  'donut', 'fried chicken',
] as const;

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\u0600-\u06ff]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isGlobalRecipe(name: string): boolean {
  const normalized = normalizeName(name);
  return GLOBAL_RECIPE_PATTERNS.some((pattern) => normalized.includes(pattern));
}

@Injectable()
export class GlobalCountryFoodService {
  getSupportedCountryCodes(): string[] {
    return Object.keys(GLOBAL_COUNTRY_FOOD_PROFILES);
  }

  getProfile(countryCode: string): GlobalCountryFoodProfile | null {
    return GLOBAL_COUNTRY_FOOD_PROFILES[countryCode.trim().toUpperCase()] ?? null;
  }

  getLocalRecipeGuidance(countryCode: string): LocalRecipeGuidance | null {
    const profile = this.getProfile(countryCode);
    if (!profile) return null;
    return {
      countryCode: profile.countryCode,
      cuisineFamily: profile.cuisineFamily,
      preferredRecipes: profile.signatureRecipes,
      stapleIngredients: profile.stapleIngredients,
      hardToSourceIngredients: profile.hardToSourceIngredients,
      substitutionPolicy: {
        preserveCuisineIdentity: true,
        preferLocalStaples: true,
        neverSilentlyReplace: true,
      },
    };
  }

  filterRecipesForCountry(
    countryCode: string,
    recipes: CountryRecipeCandidate[],
  ): CountryRecipeCandidate[] {
    const profile = this.getProfile(countryCode);
    if (!profile) return [...recipes];
    const localSignatures = new Set(profile.signatureRecipes.map(normalizeName));
    const foreignSignatures = new Set<string>();
    for (const [code, otherProfile] of Object.entries(GLOBAL_COUNTRY_FOOD_PROFILES)) {
      if (code === profile.countryCode) continue;
      for (const recipe of otherProfile.signatureRecipes) foreignSignatures.add(normalizeName(recipe));
    }
    const relevant = recipes.filter((recipe) => {
      const normalized = normalizeName(recipe.name);
      if (localSignatures.has(normalized) || isGlobalRecipe(recipe.name)) return true;
      if (recipe.cuisineFamily && recipe.cuisineFamily === profile.cuisineFamily) return true;
      return !foreignSignatures.has(normalized);
    });
    return relevant.length > 0 ? relevant : [...recipes];
  }

  rankRecipesForCountry(countryCode: string, recipes: CountryRecipeCandidate[]) {
    const profile = this.getProfile(countryCode);
    if (!profile) return recipes;
    const signature = new Set(profile.signatureRecipes.map(normalizeName));
    return this.filterRecipesForCountry(countryCode, recipes).sort((a, b) => {
      const aName = normalizeName(a.name);
      const bName = normalizeName(b.name);
      const aGlobal = isGlobalRecipe(a.name);
      const bGlobal = isGlobalRecipe(b.name);
      const aScore = signature.has(aName) ? 4 : a.cuisineFamily === profile.cuisineFamily ? 3 : aGlobal ? 2 : 1;
      const bScore = signature.has(bName) ? 4 : b.cuisineFamily === profile.cuisineFamily ? 3 : bGlobal ? 2 : 1;
      return bScore - aScore || a.name.localeCompare(b.name);
    });
  }
}
