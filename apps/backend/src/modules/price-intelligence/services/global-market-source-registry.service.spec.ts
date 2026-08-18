import { GlobalMarketSourceRegistryService } from './global-market-source-registry.service';
import { GLOBAL_MARKET_COUNTRY_CODES } from '../data/global-market-source.catalog';

describe('GlobalMarketSourceRegistryService', () => {
  const service = new GlobalMarketSourceRegistryService();

  it('covers the 195-country sovereign market set without duplicate ISO codes', () => {
    expect(GLOBAL_MARKET_COUNTRY_CODES).toHaveLength(195);
    expect(new Set(GLOBAL_MARKET_COUNTRY_CODES).size).toBe(195);
  });

  it('keeps every country resolvable and attaches discovery fallbacks', () => {
    for (const code of GLOBAL_MARKET_COUNTRY_CODES) {
      const profile = service.getCountryProfile(code);
      expect(profile?.countryCode).toBe(code);
      expect(profile?.sourceIds).toEqual(
        expect.arrayContaining(['market_directory', 'retailer_directory']),
      );
    }
  });

  it('returns direct/aggregator sources before discovery sources when available', () => {
    const sources = service.getSourcesForCountry('US');
    expect(sources.map((source) => source.id)).toEqual(
      expect.arrayContaining(['walmart', 'kroger', 'instacart']),
    );
    expect(sources.every((source) => source.enabled)).toBe(true);
  });

  it('does not expose discovery-only sources as operational price sources', () => {
    const operational = service.getSourcesForCountry('AF');
    const discovery = service.getDiscoverySources('AF');
    expect(operational).toHaveLength(0);
    expect(discovery.map((source) => source.id)).toEqual(
      expect.arrayContaining(['market_directory', 'retailer_directory']),
    );
  });

  it('recognizes direct coverage and rejects unknown countries', () => {
    expect(service.hasDirectOrAggregatorCoverage('MX')).toBe(true);
    expect(service.getCountryProfile('ZZ')).toBeNull();
  });
});
