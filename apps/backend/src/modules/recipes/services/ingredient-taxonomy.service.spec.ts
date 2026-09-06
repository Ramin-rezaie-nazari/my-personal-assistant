import { IngredientTaxonomyService } from './ingredient-taxonomy.service';

describe('IngredientTaxonomyService', () => {
  const service = new IngredientTaxonomyService();

  it('normalizes Persian orthography and zero-width joiners', () => {
    expect(service.canonicalize('تخم‌مرغ').canonicalKey).toBe('egg');
    expect(service.canonicalize('ك').displayName).toBe('ك');
  });

  it('maps trusted aliases without inventing an unknown match', () => {
    expect(service.canonicalize('سینه مرغ')).toMatchObject({
      canonicalKey: 'chicken-breast',
      matchedBy: 'alias',
      foodGroup: 'protein',
      confidence: 1,
      provenance: 'internal-starter-registry',
    });
    expect(service.isKnown('سینه مرغ')).toBe(true);
    expect(service.isKnown('نمونه غذای خیالی')).toBe(false);
  });

  it('returns a deterministic safe representation for unknown ingredients', () => {
    expect(service.canonicalize('  Dragon Fruit Powder  ')).toEqual({
      canonicalKey: 'dragon fruit powder',
      displayName: 'Dragon Fruit Powder',
      foodGroup: 'other',
      matchedBy: 'unknown',
      confidence: 0,
      provenance: 'unresolved-input',
    });
  });

  it('does not treat an empty ingredient name as a known taxonomy entry', () => {
    expect(service.canonicalize('   ')).toEqual({
      canonicalKey: '',
      displayName: '',
      foodGroup: 'other',
      matchedBy: 'unknown',
      confidence: 0,
      provenance: 'unresolved-input',
    });
    expect(service.isKnown('   ')).toBe(false);
  });

  it('canonicalizes batches without sharing mutable result state', () => {
    expect(service.canonicalizeMany(['نمک', 'rice', 'unknown food'])).toEqual([
      expect.objectContaining({ canonicalKey: 'salt', matchedBy: 'alias' }),
      expect.objectContaining({ canonicalKey: 'rice', matchedBy: 'canonical' }),
      expect.objectContaining({ canonicalKey: 'unknown food', matchedBy: 'unknown' }),
    ]);
  });
});
