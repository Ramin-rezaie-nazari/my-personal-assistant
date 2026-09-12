import { ProductMatchingService } from './product-matching.service';

describe('ProductMatchingService', () => {
  const service = new ProductMatchingService();

  it('accepts a strong identifier match', () => {
    const result = service.match({ productKey: 'milk', title: 'Low Fat Milk 1L', brand: 'X', quantityValue: 1, quantityUnit: 'l', identifiers: { gtin: '123' } }, [{ productKey: 'milk-x', title: 'Low Fat Milk 1L', brand: 'X', quantityValue: 1, quantityUnit: 'l', identifiers: { gtin: '123' } }])[0];
    expect(result.confidence).toBeGreaterThanOrEqual(0.78);
    expect(result.ambiguous).toBe(false);
  });

  it('marks a title-only near match as ambiguous', () => {
    const result = service.match({ productKey: 'milk', title: 'Low Fat Milk', brand: 'X', quantityValue: 1, quantityUnit: 'l' }, [{ productKey: 'milk-y', title: 'Low Fat Milk', brand: 'X', quantityValue: 1.5, quantityUnit: 'l' }])[0];
    expect(result.ambiguous).toBe(true);
    expect(result.matchedBy).toContain('quantity_mismatch');
  });

  it('penalizes incompatible package units even when title and brand match', () => {
    const result = service.match({ productKey: 'milk', title: 'Low Fat Milk', brand: 'X', quantityValue: 1, quantityUnit: 'l' }, [{ productKey: 'milk-y', title: 'Low Fat Milk', brand: 'X', quantityValue: 1, quantityUnit: 'piece' }])[0];
    expect(result.matchedBy).toContain('incompatible_quantity_unit');
    expect(result.confidence).toBeLessThan(0.55);
  });

  it('accepts equivalent mass units after normalization', () => {
    const result = service.match({ productKey: 'rice', title: 'Rice', brand: 'X', quantityValue: 1, quantityUnit: 'kg' }, [{ productKey: 'rice-x', title: 'Rice', brand: 'X', quantityValue: 1000, quantityUnit: 'g' }])[0];
    expect(result.matchedBy).toContain('quantity');
  });

  it('keeps clearly different products below the acceptance threshold', () => {
    const result = service.match({ productKey: 'milk', title: 'Low Fat Milk 1L', brand: 'X' }, [{ productKey: 'juice', title: 'Orange Juice 1L', brand: 'Y' }])[0];
    expect(result.confidence).toBeLessThan(0.55);
  });
});
