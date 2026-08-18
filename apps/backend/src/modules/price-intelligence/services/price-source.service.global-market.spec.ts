import { GlobalMarketSourceRegistryService } from './global-market-source-registry.service';
import { PriceSourceService } from './price-source.service';

describe('PriceSourceService global market routing', () => {
  it('routes a country request only to that country operational sources', async () => {
    const service = new PriceSourceService(
      undefined,
      new GlobalMarketSourceRegistryService(),
    );
    const makeMock = (id: string) => ({
      id,
      kind: 'retailer' as const,
      fetchPrices: jest.fn().mockResolvedValue(
        id === 'walmart'
          ? [
              {
                productKey: 'milk',
                title: 'Milk',
                sourceId: 'walmart',
                sourceKind: 'retailer',
                currency: 'USD',
                amount: 4.5,
                observedAt: new Date(),
              },
            ]
          : [],
      ),
    });
    const walmart = makeMock('walmart');
    service.register(walmart);
    service.register(makeMock('kroger'));
    service.register(makeMock('instacart'));

    const result = await service.collectForCountryDetailed('US', ['milk']);

    expect(walmart.fetchPrices).toHaveBeenCalledWith(['milk']);
    expect(result.attemptedSourceIds).toEqual(
      expect.arrayContaining(['walmart', 'kroger', 'instacart']),
    );
    expect(result.prices).toHaveLength(1);
  });

  it('returns no operational sources for discovery-only markets', async () => {
    const service = new PriceSourceService(
      undefined,
      new GlobalMarketSourceRegistryService(),
    );
    const result = await service.collectForCountryDetailed('AF', ['rice']);
    expect(result.attemptedSourceIds).toEqual([]);
    expect(result.prices).toEqual([]);
  });

  it('registers corrected regional adapters so operational routing cannot fail at runtime', () => {
    const service = new PriceSourceService(
      undefined,
      new GlobalMarketSourceRegistryService(),
    );
    expect(service.registeredSourceIds()).toEqual(
      expect.arrayContaining(['rappi', 'woolworths_nz']),
    );
  });
});
