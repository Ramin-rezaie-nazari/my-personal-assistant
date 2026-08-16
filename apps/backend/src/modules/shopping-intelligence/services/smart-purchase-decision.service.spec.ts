import { SmartPurchaseDecisionService } from './smart-purchase-decision.service';

describe('SmartPurchaseDecisionService', () => {
  const service = new SmartPurchaseDecisionService();

  it('selects buy now for a strong discount and urgency signal', () => {
    const result = service.decide(
      [
        {
          id: '1',
          productKey: 'ssd-2tb',
          price: 80,
          currency: 'USD',
          availability: 'in_stock',
          priceVs30dAverage: -0.2,
          priceTrend: 'stable',
          stockUrgency: 0.9,
          sellerScore: 0.9,
          userPreferenceScore: 0.9,
        },
      ],
      200,
    );
    expect(result.action).toBe('buy_now');
  });

  it('waits when the price is falling without urgency', () => {
    const result = service.decide(
      [
        {
          id: '1',
          productKey: 'phone',
          price: 500,
          currency: 'USD',
          availability: 'in_stock',
          priceVs30dAverage: 0.02,
          priceTrend: 'falling',
          stockUrgency: 0.1,
        },
      ],
      1000,
    );
    expect(result.action).toBe('wait');
  });

  it('avoids purchases over the remaining budget', () => {
    const result = service.decide(
      [
        {
          id: '1',
          productKey: 'tv',
          price: 1500,
          currency: 'USD',
          availability: 'in_stock',
          priceVs30dAverage: -0.3,
        },
      ],
      1000,
    );
    expect(result.action).toBe('avoid');
  });
});
