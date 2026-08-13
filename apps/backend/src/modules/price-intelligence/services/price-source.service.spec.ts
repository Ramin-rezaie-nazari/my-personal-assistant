import { PriceSourceService } from './price-source.service';

describe('PriceSourceService', () => {
  it('reports a failed adapter by source id while keeping successful prices', async () => {
    const service = new PriceSourceService();
    service.register({ id: 'good', kind: 'retailer', fetchPrices: async () => [{ productKey: 'p1', title: 'Product', sourceId: 'good', sourceKind: 'retailer', currency: 'IRR', amount: 100, observedAt: new Date() }] });
    service.register({ id: 'bad', kind: 'marketplace', fetchPrices: async () => { throw new Error('network'); } });

    const result = await service.collectDetailed(['p1']);

    expect(result.prices).toHaveLength(1);
    expect(result.failedSourceIds).toEqual(['bad']);
    expect(result.attemptedSourceIds).toEqual(['good', 'bad']);
  });
});
