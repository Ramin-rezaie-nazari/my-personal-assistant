import { HouseholdInventoryCoreService } from './household-inventory-core.service';
import { HouseholdItemNormalizerService } from './household-item-normalizer.service';

describe('HouseholdInventoryCoreService', () => {
  const service = new HouseholdInventoryCoreService(new HouseholdItemNormalizerService());

  it('adds a new item using canonical identity and unit', () => {
    const result = service.add(null, {
      productKey: ' Milk ',
      quantity: 2,
      unit: 'L',
    });
    expect(result.item).toEqual({
      productKey: 'milk',
      quantity: 2,
      unit: 'l',
      expiresAt: null,
    });
    expect(result.reason).toBe('add');
  });

  it('merges compatible quantities into the existing unit', () => {
    const result = service.add(
      { productKey: 'rice', quantity: 1, unit: 'kg', expiresAt: null },
      { productKey: 'rice', quantity: 500, unit: 'g' },
    );
    expect(result.item.quantity).toBe(1.5);
  });

  it('prevents consuming more than the available quantity', () => {
    expect(() =>
      service.consume({ productKey: 'milk', quantity: 1, unit: 'l' }, 2, 'l'),
    ).toThrow('Insufficient inventory');
  });

  it('keeps the earlier expiry when merging stock', () => {
    const earlier = new Date('2026-09-01T00:00:00.000Z');
    const later = new Date('2026-09-05T00:00:00.000Z');
    const result = service.add(
      { productKey: 'yogurt', quantity: 1, unit: 'kg', expiresAt: later },
      { productKey: 'yogurt', quantity: 200, unit: 'g', expiresAt: earlier },
    );
    expect(result.item.expiresAt).toEqual(earlier);
  });

  it('separates waste from normal consumption', () => {
    const result = service.waste(
      { productKey: 'bread', quantity: 3, unit: 'pcs' },
      1,
      'pcs',
    );
    expect(result.item.quantity).toBe(2);
    expect(result.reason).toBe('waste');
  });
});
