import { PriceProductKeyService } from './price-product-key.service';

describe('PriceProductKeyService', () => {
  const service = new PriceProductKeyService();

  it('preserves the canonical locale-aware lower-case separator contract', () => {
    expect(service.fromFoodName('  Extra Virgin  Olive Oil  ')).toBe(
      'extra-virgin-olive-oil',
    );
    expect(service.fromFoodName('شیر  کم‌چرب')).toBe('شیر-کم-چرب');
  });

  it('strips punctuation but preserves letters, numbers and separators', () => {
    expect(service.fromFoodName('Milk, 2% fat!')).toBe('milk-2-fat');
  });

  it('bounds the key length for storage stability', () => {
    const value = service.fromFoodName('x'.repeat(500));
    expect(value).toHaveLength(180);
  });
});
