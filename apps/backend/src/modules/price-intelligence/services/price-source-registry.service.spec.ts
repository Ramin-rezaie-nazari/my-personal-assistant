import { PriceSourceRegistryService } from './price-source-registry.service';

describe('PriceSourceRegistryService', () => {
  it('exposes the configured Iranian market sources', () => {
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
    ]);
    expect(
      sources.every((source) => source.searchUrlTemplate.includes('{query}')),
    ).toBe(true);
    expect(
      sources.every((source) => source.baseUrl.startsWith('https://')),
    ).toBe(true);
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
