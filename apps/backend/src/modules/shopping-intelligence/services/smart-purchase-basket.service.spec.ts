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
    );
    expect(result.total).toBe(120);
    expect(result.feasible).toBe(true);
  });
});
