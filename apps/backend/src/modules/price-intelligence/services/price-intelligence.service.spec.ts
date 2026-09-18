import { PriceIntelligenceService } from './price-intelligence.service';

describe('PriceIntelligenceService global analysis scope', () => {
  it('refuses to aggregate observations from multiple countries even when currency is shared', async () => {
    const persistence = {
      history: jest.fn().mockResolvedValue([
        { amount: 2, observedAt: new Date(), currency: 'USD', countryCode: 'US' },
        { amount: 3, observedAt: new Date(), currency: 'USD', countryCode: 'EC' },
      ]),
    };
    const service = new PriceIntelligenceService({ match: jest.fn() } as any, persistence as any);
    const result = await service.analyze('openprices:123');
    expect(result).toMatchObject({
      scopeRequired: true,
      reason: 'mixed_market_data_requires_country_scope',
      recommendation: 'unavailable',
    });
  });
}