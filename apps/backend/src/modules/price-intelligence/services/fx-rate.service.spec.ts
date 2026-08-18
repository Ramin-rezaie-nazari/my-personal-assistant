import { FxRateService } from './fx-rate.service';

describe('FxRateService', () => {
  it('returns identity conversion without network access', async () => {
    const service = new FxRateService();
    const rate = await service.getRate('USD', 'USD');
    expect(rate).toMatchObject({ base: 'USD', quote: 'USD', rate: 1 });
    await expect(service.convert(25, 'USD', 'USD')).resolves.toMatchObject({
      amount: 25,
      currency: 'USD',
    });
  });

  it('falls back cleanly when public FX sources are unavailable', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error('network unavailable'));
    const service = new FxRateService();
    await expect(service.getRate('USD', 'EUR')).resolves.toBeNull();
    global.fetch = originalFetch;
  });
});
