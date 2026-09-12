import { SmartPurchaseBasketService } from './smart-purchase-basket.service';
import { SmartPurchaseDecisionService } from './smart-purchase-decision.service';

describe('SmartPurchaseBasketService', () => {
  it('computes a basket total and feasibility against remaining budget', () => {
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
    expect(result.total).toBe(120);
    expect(result.feasible).toBe(true);
    expect(result.currency).toBe('USD');
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
});
