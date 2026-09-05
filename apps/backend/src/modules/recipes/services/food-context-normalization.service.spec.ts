import { FoodContextNormalizationService } from './food-context-normalization.service';

describe('FoodContextNormalizationService', () => {
  const service = new FoodContextNormalizationService();

  it('normalizes common cuisine family aliases deterministically', () => {
    expect(service.normalizeCuisineFamily('Gulf-Arab')).toBe('arabian-gulf');
    expect(service.normalizeCuisineFamily(' South-East-Asian ')).toBe('south-east-asian');
    expect(service.normalizeCuisineFamily('Persian')).toBe('persian');
  });

  it('does not invent a cuisine family for unknown free text', () => {
    expect(service.normalizeCuisineFamily('My Secret Fusion')).toBe('other');
    expect(service.normalizeCuisineFamily('')).toBe('other');
  });

  it('normalizes and validates ISO-like two-letter country codes', () => {
    expect(service.normalizeCountryCode(' ir ')).toBe('IR');
    expect(service.normalizeCountryCode('JP')).toBe('JP');
    expect(service.normalizeCountryCode('japan')).toBeNull();
    expect(service.normalizeCountryCode('')).toBeNull();
  });

  it('normalizes Persian orthography without changing semantic labels', () => {
    expect(service.normalizeCuisineFamily('ایرانی')).toBe('persian');
    expect(service.normalizeCountryCode('كې')).toBe('KE');
  });
});
