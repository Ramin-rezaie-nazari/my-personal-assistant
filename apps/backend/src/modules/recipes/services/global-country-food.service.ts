import { Injectable } from '@nestjs/common';
import {
  GLOBAL_COUNTRY_FOOD_PROFILES,
  GlobalCountryFoodProfile,
} from '../data/global-country-food-profiles';

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

@Injectable()
export class GlobalCountryFoodService {
  getSupportedCountryCodes(): string[] {
    return Object.keys(GLOBAL_COUNTRY_FOOD_PROFILES);
  }

  getProfile(countryCode: string): GlobalCountryFoodProfile | null {
    const normalized = countryCode.trim().toUpperCase();
    return GLOBAL_COUNTRY_FOOD_PROFILES[normalized] ?? null;
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

  /**
   * Orders an existing recipe list for a user's market without hiding global
   * recipes. Local cuisine gets a deterministic boost; explicit user intent
   * can still request any cuisine.
   */
  rankRecipesForCountry(
    countryCode: string,
    recipes: Array<{ name: string; cuisineFamily?: string | null }>,
  ) {
    const profile = this.getProfile(countryCode);
    if (!profile) return recipes;

    const signature = new Set(profile.signatureRecipes.map((name) => name.toLowerCase()));
    return [...recipes].sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const aScore = signature.has(aName) ? 3 : a.cuisineFamily === profile.cuisineFamily ? 2 : 0;
      const bScore = signature.has(bName) ? 3 : b.cuisineFamily === profile.cuisineFamily ? 2 : 0;
      return bScore - aScore || a.name.localeCompare(b.name);
    });
  }
}
