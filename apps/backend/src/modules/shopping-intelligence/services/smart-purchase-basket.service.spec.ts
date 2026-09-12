import { SmartPurchaseBasketService } from './smart-purchase-basket.service';
import { SmartPurchaseDecisionService } from './smart-purchase-decision.service';

describe('SmartPurchaseBasketService', () => {
  it('computes a basket total from committed purchases and feasibility against remaining budget', () => {
    const service = new SmartPurchaseBasketService(
      new SmartPurchaseDecisionService(),
    );
    const result = service.optimize(
      [
        {
          productKey: 'ssd',
          quantity: 1,
          candidates: [
            {
              id: '1',
              productKey: 'ssd',
              price: 80,
              currency: 'USD',
              availability: 'in_stock',
              priceVs30dAverage: -0.2,
              stockUrgency: 0.8,
            },
          ],
        },
        {
          productKey: 'mouse',
          quantity: 2,
          candidates: [
            {
              id: '2',
              productKey: 'mouse',
              price: 20,
              currency: 'USD',
              availability: 'in_stock',
              priceVs30dAverage: 0,
              priceTrend: 'stable',
            },
          ],
        },
      ],
      150,
      'USD',
    );
    expect(result.total).toBe(80);
    expect(result.feasible).toBe(true);
    expect(result.currency).toBe('USD');
    expect(result.items[0].decision.action).toBe('buy_now');
    expect(result.items[1].decision.action).toBe('compare_more');
    expect(result.items[1].selectedPrice).toBeNull();
  });

  it('ignores quotes in a different currency when a budget currency is specified', () => {
    const service = new SmartPurchaseBasketService(
      new SmartPurchaseDecisionService(),
    );
    const result = service.optimize(
      [
        {
          productKey: 'milk',
          quantity: 2,
          candidates: [
            {
              id: 'eur-1',
              productKey: 'milk',
              price: 10,
              currency: 'EUR',
              availability: 'in_stock',
              stockUrgency: 0.9,
            },
            {
              id: 'usd-1',
              productKey: 'milk',
              price: 4,
              currency: 'USD',
              availability: 'in_stock',
              stockUrgency: 0.9,
            },
          ],
        },
      ],
      20,
      'USD',
    );

    expect(result.total).toBe(8);
    expect(result.currency).toBe('USD');
    expect(result.feasible).toBe(true);
    expect(result.items[0].selectedPrice).toBe(4);
  });

  it('fails closed when all quotes use a different currency', () => {
    const service = new SmartPurchaseBasketService(
      new SmartPurchaseDecisionService(),
    );
    const result = service.optimize(
      [
        {
          productKey: 'milk',
          quantity: 2,
          candidates: [
            {
              id: 'eur-1',
              productKey: 'milk',
              price: 10,
              currency: 'EUR',
              availability: 'in_stock',
            },
          ],
        },
      ],
      20,
      'USD',
    );

    expect(result.total).toBe(0);
    expect(result.feasible).toBe(false);
    expect(result.items[0].decision).toMatchObject({
      action: 'avoid',
      reasons: ['currency_mismatch'],
    });
    expect(result.items[0].selectedPrice).toBeNull();
  });

  it('applies the remaining budget to each subsequent basket item', () => {
    const service = new SmartPurchaseBasketService(
      new SmartPurchaseDecisionService(),
    );
    const result = service.optimize(
      [
        {
          productKey: 'rice',
          quantity: 1,
          candidates: [
            {
              id: 'rice-1',
              productKey: 'rice',
              price: 8,
              currency: 'USD',
              availability: 'in_stock',
              priceVs30dAverage: -0.2,
              stockUrgency: 0.8,
            },
          ],
        },
        {
          productKey: 'oil',
          quantity: 2,
          candidates: [
            {
              id: 'oil-1',
              productKey: 'oil',
              price: 6,
              currency: 'USD',
              availability: 'in_stock',
              priceVs30dAverage: -0.2,
              stockUrgency: 0.8,
            },
          ],
        },
      ],
      10,
      'USD',
    );

    expect(result.items[0].decision.action).toBe('buy_now');
    expect(result.items[0].selectedPrice).toBe(8);
    expect(result.items[1].decision.action).toBe('avoid');
    expect(result.items[1].decision.reasons).toEqual(['over_budget']);
    expect(result.total).toBe(8);
    expect(result.feasible).toBe(false);
  });

  it('does not count wait decisions as committed basket cost', () => {
    const service = new SmartPurchaseBasketService(
      new SmartPurchaseDecisionService(),
    );
    const result = service.optimize(
      [
        {
          productKey: 'coffee',
          quantity: 1,
          candidates: [
            {
              id: 'coffee-1',
              productKey: 'coffee',
              price: 8,
              currency: 'USD',
              availability: 'in_stock',
              priceTrend: 'falling',
              priceVs30dAverage: 0,
            },
          ],
        },
      ],
      10,
      'USD',
    );

    expect(result.items[0].decision.action).toBe('wait');
    expect(result.items[0].selectedPrice).toBeNull();
    expect(result.total).toBe(0);
    expect(result.feasible).toBe(true);
  });
});
