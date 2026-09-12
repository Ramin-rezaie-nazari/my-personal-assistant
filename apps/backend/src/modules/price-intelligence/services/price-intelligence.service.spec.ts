import { PriceIntelligenceService } from './price-intelligence.service';

describe('PriceIntelligenceService', () => {
  it('delegates analysis to the canonical market analysis service', async () => {
    const analysis = {
      analyze: jest.fn().mockResolvedValue({ productKey: 'milk', trend: 'stable' }),
    };
    const service = new PriceIntelligenceService(
      { match: () => [] } as any,
      { latest: jest.fn(), history: jest.fn() } as any,
      analysis as any,
    );

    await expect(service.analyze('milk')).resolves.toMatchObject({ productKey: 'milk', trend: 'stable' });
    expect(analysis.analyze).toHaveBeenCalledWith('milk');
  });
});
