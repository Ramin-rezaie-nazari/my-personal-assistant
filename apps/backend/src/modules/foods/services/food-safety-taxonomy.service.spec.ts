import { FoodSafetyTaxonomyService } from './food-safety-taxonomy.service';

describe('FoodSafetyTaxonomyService', () => {
  const service = new FoodSafetyTaxonomyService();

  it('resolves canonical taxonomy entries and aliases', () => {
    expect(service.resolve('Goat Cheese')).toMatchObject({
      status: 'known',
      canonicalId: 'goat_cheese',
      flags: { dairy: true, animal_derived: true },
    });
    expect(service.resolve('pita bread')).toMatchObject({
      status: 'known',
      canonicalId: 'pita',
      flags: { gluten_candidate: true },
    });
  });

  it('fails closed when an ingredient is not present in the safety taxonomy', () => {
    const result = service.evaluate(['ingredient-never-seen'], { allergies: ['milk'] });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('unknown_food_safety:ingredient-never-seen');
  });

  it('blocks dairy for milk allergy', () => {
    const result = service.evaluate(['goat cheese'], { allergies: ['milk'] });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('allergy:milk:goat cheese');
  });

  it('blocks animal-derived ingredients for vegan diets', () => {
    const result = service.evaluate(['pancetta'], { dietaryPreferences: ['vegan'] });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('diet:vegan:pancetta');
  });

  it('blocks gluten candidates for gluten-free diets', () => {
    const result = service.evaluate(['baguette'], { dietaryPreferences: ['gluten_free'] });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('diet:gluten_free:baguette');
  });

  it('allows compatible known ingredients', () => {
    const result = service.evaluate(['asparagus', 'corn', 'olive'], {
      dietaryPreferences: ['vegan', 'gluten_free'],
    });
    expect(result.allowed).toBe(true);
  });

  it('normalizes Persian food names before resolving', () => {
    expect(service.resolve('سماق')).toMatchObject({
      status: 'known',
      canonicalId: 'sumac',
    });
  });
});
