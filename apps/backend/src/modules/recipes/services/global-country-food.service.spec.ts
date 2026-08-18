import { GlobalCountryFoodService } from './global-country-food.service';

describe('GlobalCountryFoodService', () => {
  const service = new GlobalCountryFoodService();

  it('covers exactly the 195-country market set', () => {
    const countries = service.getSupportedCountryCodes();
    expect(countries).toHaveLength(195);
    expect(new Set(countries).size).toBe(195);
  });

  it('prioritizes Japan-local food culture', () => {
    const guidance = service.getLocalRecipeGuidance('jp');
    expect(guidance?.countryCode).toBe('JP');
    expect(guidance?.preferredRecipes).toContain('Sushi');
    expect(guidance?.preferredRecipes).toContain('Miso Ramen');
    expect(guidance?.stapleIngredients).toContain('rice');
  });

  it('keeps Iranian food culture distinct', () => {
    const guidance = service.getLocalRecipeGuidance('IR');
    expect(guidance?.preferredRecipes).toContain('Ghormeh Sabzi');
    expect(guidance?.cuisineFamily).toBe('Persian');
  });

  it('does not silently replace a recipe outside the local culture', () => {
    const ranked = service.rankRecipesForCountry('JP', [
      { name: 'Ghormeh Sabzi' },
      { name: 'Sushi' },
      { name: 'Miso Ramen' },
    ]);
    expect(ranked.map((recipe) => recipe.name)).toEqual([
      'Miso Ramen',
      'Sushi',
      'Ghormeh Sabzi',
    ]);
  });
});
