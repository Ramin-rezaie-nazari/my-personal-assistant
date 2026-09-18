import { PriceCoverageService } from './price-coverage.service';

describe('PriceCoverageService', () => {
  it('maps snapshot freshness onto the complete country currency catalog', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([
        {
          countryCode: 'IR',
          latestObservedAt: new Date('2026-09-18T00:00:00Z'),
          priceCount: 12n,
          sourceCount: 3n,
        },
      ]),
    };
    const service = new PriceCoverageService(prisma as never);

    const result = await service.getCoverage(1, 'open-prices');

    expect(result.sourceId).toBe('open-prices');
    expect(result.totalCountries).toBe(195);
    expect(result.countriesWithData).toBe(1);
    expect(result.countriesFresh).toBe(1);
    expect(result.countriesWithoutData).toBe(194);

    const iran = result.countries.find((country) => country.countryCode === 'IR');
    expect(iran).toMatchObject({
      countryCode: 'IR',
      currency: 'IRR',
      priceCount: 12,
      sourceCount: 3,
      status: 'fresh',
    });
  });
});
