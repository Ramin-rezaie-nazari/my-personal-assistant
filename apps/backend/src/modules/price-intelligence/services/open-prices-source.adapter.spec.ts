import { OpenPricesSourceAdapter } from './open-prices-source.adapter';

describe('OpenPricesSourceAdapter', () => {
  it('normalizes a public retail price with country, native currency and source id', async () => {
    const adapter = new OpenPricesSourceAdapter();
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [{
            id: 123,
            price: 4.99,
            currency: 'EUR',
            date: '2026-09-17',
            product: {
              code: '1234567890123',
              product_name: 'Test olive oil',
              osm_address_country_code: 'FR',
              osm_address_city: 'Paris',
            },
          }],
          next: null,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    try {
      const prices = await adapter.fetchPrices([]);
      expect(prices).toHaveLength(1);
      expect(prices[0]).toMatchObject({
        sourceId: 'open-prices',
        sourceRecordId: '123',
        countryCode: 'FR',
        currency: 'EUR',
        amount: 4.99,
        city: 'Paris',
      });
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('ignores records with an unknown country', async () => {
    const adapter = new OpenPricesSourceAdapter();
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [{
            id: 1,
            price: 10,
            currency: 'USD',
            date: '2026-09-17',
            product: { product_name: 'Unknown market', country_code: 'ZZ' },
          }],
          next: null,
        }),
        { status: 200 },
      ),
    );
    try {
      await expect(adapter.fetchPrices([])).resolves.toEqual([]);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
