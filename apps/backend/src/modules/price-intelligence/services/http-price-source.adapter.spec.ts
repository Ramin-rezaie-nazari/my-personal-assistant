import { HttpPriceSourceAdapter } from './http-price-source.adapter';

describe('HttpPriceSourceAdapter', () => {
  it('parses JSON-LD product offers and normalizes rial to toman', async () => {
    const adapter = new HttpPriceSourceAdapter({
      id: 'test',
      kind: 'retailer',
      baseUrl: 'https://example.com',
      searchUrlTemplate: 'https://example.com/search?q={query}',
    });
    const originalFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        new Response(
          '<script type="application/ld+json">{"@type":"Product","name":"شیر کم چرب","offers":{"price":1250000,"priceCurrency":"IRR","availability":"InStock"}}</script>',
          { status: 200 },
        ),
      );
    const prices = await adapter.fetchPrices(['شیر-کم-چرب']);
    expect(prices).toHaveLength(1);
    expect(prices[0]).toMatchObject({
      sourceId: 'test',
      amount: 125000,
      currency: 'IRT',
      availability: 'in_stock',
    });
    global.fetch = originalFetch;
  });

  it('falls back to Persian toman price text', async () => {
    const adapter = new HttpPriceSourceAdapter({
      id: 'test',
      kind: 'retailer',
      baseUrl: 'https://example.com',
      searchUrlTemplate: 'https://example.com/search?q={query}',
    });
    const originalFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        new Response('<div>قیمت: ۱٬۲۵۰٬۰۰۰ تومان</div>', { status: 200 }),
      );
    const prices = await adapter.fetchPrices(['شیر']);
    expect(prices[0]).toMatchObject({ amount: 1250000, currency: 'IRT' });
    global.fetch = originalFetch;
  });

  it('fails cleanly on non-2xx responses', async () => {
    const adapter = new HttpPriceSourceAdapter({
      id: 'test',
      kind: 'retailer',
      baseUrl: 'https://example.com',
      searchUrlTemplate: 'https://example.com/search?q={query}',
    });
    const originalFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockResolvedValue(new Response('', { status: 503 }));
    await expect(adapter.fetchPrices(['شیر'])).rejects.toThrow(
      'price_source_http_test_503',
    );
    global.fetch = originalFetch;
  });
});
