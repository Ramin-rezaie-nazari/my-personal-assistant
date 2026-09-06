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

  it('does not recommend another country’s signature recipe by default', () => {
    const filtered = service.filterRecipesForCountry('JP', [
      { name: 'Ghormeh Sabzi' },
      { name: 'Sushi' },
      { name: 'Pizza' },
      { name: 'Pasta' },
    ]);
    expect(filtered.map((recipe) => recipe.name)).toEqual([
      'Sushi',
      'Pizza',
      'Pasta',
    ]);
  });

  it('keeps globally popular recipes available across countries', () => {
    const filtered = service.filterRecipesForCountry('JP', [
      { name: 'Pizza' },
      { name: 'Pasta' },
      { name: 'Hamburger' },
      { name: 'Ghormeh Sabzi' },
    ]);
    expect(filtered.map((recipe) => recipe.name)).toEqual([
      'Pizza',
      'Pasta',
      'Hamburger',
    ]);
  });

  it('ranks local recipes first, then global recipes', () => {
    const ranked = service.rankRecipesForCountry('JP', [
      { name: 'Ghormeh Sabzi' },
      { name: 'Pizza' },
      { name: 'Sushi' },
    ]);
    expect(ranked.map((recipe) => recipe.name)).toEqual([
      'Sushi',
      'Pizza',
    ]);
  });
});
