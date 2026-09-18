import { GlobalPriceCollectionService } from './global-price-collection.service';

describe('GlobalPriceCollectionService', () => {
  it('keeps the 195-country registry authoritative and does not fabricate unknown markets', async () => {
    const countryCodes = Array.from({ length: 195 }, (_, index) => `C${String(index).padStart(3, '0')}`);
    const persistence = {
      createRun: jest.fn().mockResolvedValue({ acquired: true, id: 'run-1' }),
      record: jest.fn().mockResolvedValue(1),
      upsertCoverage: jest.fn().mockResolvedValue(undefined),
      finishRun: jest.fn().mockResolvedValue(undefined),
      coverage: jest.fn().mockResolvedValue([]),
    };
    const countries = {
      getSupportedCountryCodes: jest.fn().mockReturnValue(countryCodes),
      getCountryCurrency: jest.fn((code: string) => ({ countryCode: code, currencyCode: 'USD', fractionDigits: 2 })),
    };
    const source = {
      id: 'open-prices',
      fetchRecentPrices: jest.fn().mockResolvedValue({
        prices: [
          {
            productKey: 'openprices:123', title: 'Milk', sourceId: 'open-prices', sourceKind: 'open_dataset',
            currency: 'USD', amount: 2, countryCode: countryCodes[0], observedAt: new Date(),
          },
          {
            productKey: 'openprices:999', title: 'Unknown', sourceId: 'open-prices', sourceKind: 'open_dataset',
            currency: 'USD', amount: 3, countryCode: 'XX', observedAt: new Date(),
          },
        ],
        pagesFetched: 1, totalPages: 1, truncated: false,
      }),
    };
    const service = new GlobalPriceCollectionService(persistence as any, countries as any, source as any);
    const result = await service.collect(new Date(), 2);
    expect(result.accepted).toBe(1);
    expect(persistence.upsertCoverage).toHaveBeenCalledTimes(195);
    expect(persistence.finishRun).toHaveBeenCalledWith('run-1', expect.objectContaining({ collected: 1 }));
  });
}