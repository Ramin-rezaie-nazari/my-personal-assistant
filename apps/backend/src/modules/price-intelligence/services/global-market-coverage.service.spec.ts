import { GlobalMarketCoverageService } from './global-market-coverage.service';
import { GlobalMarketSourceRegistryService } from './global-market-source-registry.service';

describe('GlobalMarketCoverageService', () => {
  const service = new GlobalMarketCoverageService(
    new GlobalMarketSourceRegistryService(),
  );

  it('reports a truthful coverage summary instead of claiming universal live coverage', () => {
    const summary = service.summary();
    expect(summary.totalCountries).toBe(195);
    expect(summary.directOrAggregatorCountries).toBeGreaterThan(0);
    expect(summary.discoveryOnlyCountries).toBeGreaterThan(0);
    expect(summary.complete).toBe(false);
    expect(summary.directCoveragePercent).toBeGreaterThan(0);
    expect(summary.directCoveragePercent).toBeLessThan(100);
  });

  it('returns a deterministic verification queue', () => {
    const queue = service.countriesNeedingVerification();
    expect(queue.length).toBeGreaterThan(0);
    expect(new Set(queue).size).toBe(queue.length);
  });

  it('exposes source links for a market', () => {
    const links = service.sourceLinks('MX');
    expect(links.map((item) => item.id)).toEqual(
      expect.arrayContaining(['walmart_mx', 'rappi']),
    );
  });
});
