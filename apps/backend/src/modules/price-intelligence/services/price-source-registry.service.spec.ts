import { PriceSourceRegistryService } from './price-source-registry.service';

describe('PriceSourceRegistryService', () => {
  it('exposes the configured Iranian and global sources', () => {
    const registry = new PriceSourceRegistryService();
    const sources = registry.list(true);

    expect(sources.map((source) => source.id)).toEqual([
      'okala',
      'snapp-market',
      'digikala',
      'digishahrvand',
      'digikala-jet',
      'pinaket',
      'feenama',
      'torob',
      'emalls',
      'open-prices',
      'fao-fpma',
    ]);
    expect(
      sources.every((source) => source.scope && source.refreshCadence),
    ).toBe(true);
    expect(
      sources.every((source) => source.baseUrl.startsWith('https://')),
    ).toBe(true);
  });

  it('routes country-specific sources together with global sources', () => {
    const registry = new PriceSourceRegistryService();

    expect(registry.listForCollection('IR').map((source) => source.id)).toEqual([
      'okala',
      'snapp-market',
      'digikala',
      'digishahrvand',
      'digikala-jet',
      'pinaket',
      'feenama',
      'torob',
      'emalls',
      'open-prices',
      'fao-fpma',
    ]);

    expect(registry.listForCollection('JP').map((source) => source.id)).toEqual([
      'open-prices',
      'fao-fpma',
    ]);
  });

  it('allows a source search URL to be overridden without changing code', () => {
    const original = process.env.PRICE_OKALA_SEARCH_URL;
    process.env.PRICE_OKALA_SEARCH_URL =
      'https://example.test/search?q={query}';

    try {
      const source = new PriceSourceRegistryService().get('okala');
      expect(source?.searchUrlTemplate).toBe(
        'https://example.test/search?q={query}',
      );
    } finally {
      if (original === undefined) delete process.env.PRICE_OKALA_SEARCH_URL;
      else process.env.PRICE_OKALA_SEARCH_URL = original;
    }
  });
});
