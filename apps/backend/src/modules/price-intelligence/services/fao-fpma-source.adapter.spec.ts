import { FaoFpmaSourceAdapter } from './fao-fpma-source.adapter';

describe('FaoFpmaSourceAdapter', () => {
  it('maps FAO country series to local currency and latest retail datapoint', async () => {
    const adapter = new FaoFpmaSourceAdapter();
    const originalFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            results: [{
              uuid: 'series-1',
              iso3_country_code: 'JPN',
              commodity: 'Rice',
              price_type: 'RETAIL',
              currency: { code: 'JPY' },
              measure_unit_label: 'kg',
              market: 'Tokyo',
              periodicity: ['monthly'],
            }],
            next: null,
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            results: [{
              uuid: 'series-1',
              datapoints: [{
                id: 7,
                date: '2026-09-01',
                price_value: 520,
                conversion_factor: 1,
              }],
            }],
          }),
          { status: 200 },
        ),
      );
    try {
      const prices = await adapter.fetchPrices([]);
      expect(prices).toHaveLength(1);
      expect(prices[0]).toMatchObject({
        sourceId: 'fao-fpma',
        sourceRecordId: 'series-1:7',
        countryCode: 'JP',
        currency: 'JPY',
        amount: 520,
        unit: 'kg',
        city: 'Tokyo',
      });
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('filters non-retail series', async () => {
    const adapter = new FaoFpmaSourceAdapter();
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [{
            uuid: 'series-1',
            iso3_country_code: 'USA',
            commodity: 'Wheat',
            price_type: 'WHOLESALE',
            currency: { code: 'USD' },
            measure_unit_label: 'kg',
            market: 'New York',
            periodicity: ['monthly'],
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
