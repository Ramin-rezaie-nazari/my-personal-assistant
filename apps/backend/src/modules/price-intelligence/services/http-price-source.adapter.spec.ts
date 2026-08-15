import { HttpPriceSourceAdapter } from './http-price-source.adapter';

describe('HttpPriceSourceAdapter', () => {
  it('parses JSON-LD product offers', async () => {
    const adapter = new HttpPriceSourceAdapter({ id: 'test', kind: 'retailer', baseUrl: 'https://example.com', searchUrlTemplate: 'https://example.com/search?q={query}' });
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue(new Response('<script type="application/ld+json">{"@type":"Product","name":"شیر کم چرب","offers":{"price":125000,"priceCurrency":"IRR","availability":"InStock"}}</script>', { status: 200 }));
    const prices = await adapter.fetchPrices(['شیر-کم-چرب']);
    expect(prices).toHaveLength(1);
    expect(prices[0]).toMatchObject({ sourceId: 'test', amount: 125000, currency: 'IRR', availability: 'in_stock' });
    global.fetch = originalFetch;
  });

  it('falls back to Persian numeric price text', async () => {
    const adapter = new HttpPriceSourceAdapter({ id: 'test', kind: 'retailer', baseUrl: 'https://example.com', searchUrlTemplate: 'https://example.com/search?q={query}' });
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue(new Response('<div>قیمت: ۱٬۲۵۰٬۰۰۰ تومان</div>', { status: 200 }));
    const prices = await adapter.fetchPrices(['شیر']);
    expect(prices[0].amount).toBe(1250000);
    global.fetch = originalFetch;
  });

  it('fails cleanly on non-2xx responses', async () => {
    const adapter = new HttpPriceSourceAdapter({ id: 'test', kind: 'retailer', baseUrl: 'https://example.com', searchUrlTemplate: 'https://example.com/search?q={query}' });
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue(new Response('', { status: 503 }));
    await expect(adapter.fetchPrices(['شیر'])).rejects.toThrow('price_source_http_test_503');
    global.fetch = originalFetch;
  });
});
