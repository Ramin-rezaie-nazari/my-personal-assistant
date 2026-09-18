import { OpenPricesSourceAdapter } from './open-prices-source.adapter';

describe('OpenPricesSourceAdapter', () => {
  it('preserves source currency and observation date while extracting country metadata', async () => {
    const adapter = new OpenPricesSourceAdapter();
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [{
            product_code: '1234567890123',
            product_name: 'Milk',
            price: 2.5,
            currency: 'USD',
            date: '2026-09-17',
            price_per: 'UNIT',
            location: { osm_address_country_code: 'US', osm_address_city: 'Baku' },
          }],
          page: 1, pages: 1,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    try {
      const result = await adapter.fetchRecentPrices(new Date('2026-09-16T00:00:00Z'), { maxPages: 5, pageSize: 10 });
      expect(result).toMatchObject({ pagesFetched: 1, totalPages: 1, truncated: false });
      expect(result.prices[0]).toMatchObject({
        productKey: 'openprices:1234567890123', sourceId: 'open-prices', sourceKind: 'open_dataset',
        countryCode: 'US', currency: 'USD', amount: 2.5, unit: 'unit', city: 'Baku',
        observedAt: new Date('2026-09-17T00:00:00Z'),
      });
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('fails on provider errors instead of fabricating data', async () => {
    const adapter = new OpenPricesSourceAdapter();
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue(new Response('', { status: 503 }));
    try {
      await expect(adapter.fetchRecentPrices(new Date('2026-09-16T00:00:00Z'))).rejects.toThrow('open_prices_http_503');
    } finally {
      global.fetch = originalFetch;
    }
  });
}