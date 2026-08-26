import { HouseholdItemNormalizerService } from './household-item-normalizer.service';

describe('HouseholdItemNormalizerService', () => {
  const service = new HouseholdItemNormalizerService();

  it('canonicalizes multilingual product keys deterministically', () => {
    expect(service.canonicalizeProductKey('  Olive‌ Oil  ')).toBe('olive-oil');
    expect(service.canonicalizeProductKey('شیر،')).toBe('شیر');
  });

  it('normalizes common units', () => {
    expect(service.normalizeUnit('کیلوگرم')).toBe('kg');
    expect(service.normalizeUnit('L')).toBe('l');
    expect(service.normalizeUnit('عدد')).toBe('pcs');
  });

  it('converts compatible units and rejects incompatible ones', () => {
    expect(service.convert(2, 'kg', 'g')).toBe(2000);
    expect(service.convert(1500, 'ml', 'l')).toBe(1.5);
    expect(service.canConvert('kg', 'g')).toBe(true);
    expect(service.canConvert('kg', 'l')).toBe(false);
    expect(() => service.convert(1, 'kg', 'l')).toThrow('Incompatible units');
  });
});
