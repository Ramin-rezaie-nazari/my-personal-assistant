import { HttpPriceSourceAdapter } from './http-price-source.adapter';

describe('HttpPriceSourceAdapter', () => {
  const withMockFetch = (response: Response) => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue(response);
    return () => {
      global.fetch = originalFetch;
    };
  };

  it('parses JSON-LD product offers and normalizes rial to toman', async () => {
    const adapter = new HttpPriceSourceAdapter({
      id: 'test',
      kind: 'retailer',
      baseUrl: 'https://example.com',
      searchUrlTemplate: 'https://example.com/search?q={query}',
    });
    const restore = withMockFetch(
      new Response(
        '<script type="application/ld+json">{"@type":"Product","name":"شیر کم چرب","offers":{"price":1250000,"priceCurrency":"IRR","availability":"InStock"}}</script>',
        { status: 200 },
      ),
    );
    const prices = await adapter.fetchPrices(['شیر-کم-چرب']);
    restore();
    expect(prices).toHaveLength(1);
    expect(prices[0]).toMatchObject({
      sourceId: 'test',
      amount: 125000,
      currency: 'IRT',
      availability: 'in_stock',
    });
  });

  it('preserves non-Iranian source currencies instead of coercing them to IRT', async () => {
    const adapter = new HttpPriceSourceAdapter({
      id: 'walmart-mx',
      kind: 'retailer',
      baseUrl: 'https://example.com',
      searchUrlTemplate: 'https://example.com/search?q={query}',
    });
    const restore = withMockFetch(
      new Response(
        '<script type="application/ld+json">{"@type":"Product","name":"Leche","offers":{"price":42.5,"priceCurrency":"MXN","availability":"InStock"}}</script>',
        { status: 200 },
      ),
    );
    const prices = await adapter.fetchPrices(['leche']);
    restore();
    expect(prices[0]).toMatchObject({ amount: 42.5, currency: 'MXN' });
  });

  it('falls back to Persian toman price text', async () => {
    const adapter = new HttpPriceSourceAdapter({
      id: 'test',
      kind: 'retailer',
      baseUrl: 'https://example.com',
      searchUrlTemplate: 'https://example.com/search?q={query}',
    });
    const restore = withMockFetch(
      new Response('<div>قیمت: ۱٬۲۵۰٬۰۰۰ تومان</div>', { status: 200 }),
    );
    const prices = await adapter.fetchPrices(['شیر']);
    restore();
    expect(prices[0]).toMatchObject({ amount: 1250000, currency: 'IRT' });
  });

  it('fails cleanly on non-2xx responses', async () => {
    const adapter = new HttpPriceSourceAdapter({
      id: 'test',
      kind: 'retailer',
      baseUrl: 'https://example.com',
      searchUrlTemplate: 'https://example.com/search?q={query}',
    });
    const restore = withMockFetch(new Response('', { status: 503 }));
    await expect(adapter.fetchPrices(['شیر'])).rejects.toThrow(
      'price_source_http_test_503',
    );
    restore();
  });
});
