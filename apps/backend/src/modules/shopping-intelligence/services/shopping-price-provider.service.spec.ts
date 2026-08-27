import { ShoppingPriceProviderService, ShoppingPriceProvider } from './shopping-price-provider.service';

describe('ShoppingPriceProviderService', () => {
  it('collects healthy provider results and ignores rejected providers', async () => {
    const service = new ShoppingPriceProviderService();
    const good: ShoppingPriceProvider = {
      name: 'good',
      async quote() {
        return [{ productKey: 'milk', price: 3, currency: 'USD', source: 'good', observedAt: new Date(), available: true }];
      },
    };
    const bad: ShoppingPriceProvider = {
      name: 'bad',
      async quote() { throw new Error('down'); },
    };
    service.register(good);
    service.register(bad);
    const quotes = await service.quote(['milk'], { currency: 'USD' });
    expect(quotes).toHaveLength(1);
    expect(service.listProviders()).toEqual(['good', 'bad']);
  });

  it('prefers local country/currency before price', () => {
    const service = new ShoppingPriceProviderService();
    const now = new Date();
    const result = service.chooseBest([
      { productKey: 'milk', price: 1, currency: 'EUR', countryCode: 'DE', source: 'a', observedAt: now, available: true },
      { productKey: 'milk', price: 2, currency: 'USD', countryCode: 'US', source: 'b', observedAt: now, available: true },
    ], { currency: 'USD', countryCode: 'US' });
    expect(result?.source).toBe('b');
  });
});
