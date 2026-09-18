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
        productKey: 'off:1234567890123',
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


  it('stops at the configured recent-data boundary instead of retaining stale observations', async () => {
    const adapter = new OpenPricesSourceAdapter();
    const originalFetch = global.fetch;
    const previousMaxAge = process.env.OPEN_PRICES_MAX_AGE_DAYS;
    process.env.OPEN_PRICES_MAX_AGE_DAYS = '2';
    global.fetch = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              id: 2,
              price: 5,
              currency: 'EUR',
              date: '2026-09-18',
              product: { code: '2', product_name: 'Fresh oil', osm_address_country_code: 'FR' },
            },
            {
              id: 1,
              price: 4,
              currency: 'EUR',
              date: '2026-09-10',
              product: { code: '1', product_name: 'Old oil', osm_address_country_code: 'FR' },
            },
          ],
          next: 'https://prices.openfoodfacts.org/api/v1/prices?page=2',
        }),
      ),
    );
    try {
      await expect(adapter.fetchPrices([])).resolves.toHaveLength(1);
    } finally {
      global.fetch = originalFetch;
      if (previousMaxAge === undefined) delete process.env.OPEN_PRICES_MAX_AGE_DAYS;
      else process.env.OPEN_PRICES_MAX_AGE_DAYS = previousMaxAge;
    }
  });
