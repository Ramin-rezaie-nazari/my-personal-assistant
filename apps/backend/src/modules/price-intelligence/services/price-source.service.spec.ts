import { PriceSourceRegistryService } from './price-source-registry.service';
import { PriceSourceService } from './price-source.service';

describe('PriceSourceService', () => {
  it('reports a failed adapter by source id while keeping successful prices', async () => {
    const service = new PriceSourceService();
    service.register({
      id: 'good', kind: 'retailer', fetchPrices: async () => [{ productKey: 'p1', title: 'Product', sourceId: 'good', sourceKind: 'retailer', currency: 'IRR', amount: 100, observedAt: new Date() }],
    });
    service.register({ id: 'bad', kind: 'marketplace', fetchPrices: async () => { throw new Error('network'); } });
    const result = await service.collectDetailed(['p1']);
    expect(result.prices).toHaveLength(1);
    expect(result.failedSourceIds).toEqual(['bad']);
    expect(result.attemptedSourceIds).toEqual(['good', 'bad']);
    expect(service.sources()).toEqual([]);
    const health = (service as unknown as { health: Map<string, { attempts: number; successes: number; failures: number }> }).health;
    expect(health.get('good')).toMatchObject({ attempts: 1, successes: 1, failures: 0 });
    expect(health.get('bad')).toMatchObject({ attempts: 1, successes: 0, failures: 1 });
  });

  it('exposes registry capability/trust metadata for enabled sources', () => {
    const registry = new PriceSourceRegistryService();
    const source = registry.get('okala');
    expect(source).toMatchObject({ trustScore: 0.9, supportedCurrencies: ['IRT', 'IRR'], unitAware: false, freshnessWindowHours: 168 });
    expect(registry.list(true)).toHaveLength(9);
  });
});
