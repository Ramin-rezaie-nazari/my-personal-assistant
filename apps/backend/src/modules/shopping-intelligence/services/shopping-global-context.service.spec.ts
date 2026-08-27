import { HouseholdItemNormalizerService } from './household-item-normalizer.service';
import { ShoppingGlobalContextService } from './shopping-global-context.service';

describe('ShoppingGlobalContextService', () => {
  const service = new ShoppingGlobalContextService(new HouseholdItemNormalizerService());

  it('normalizes country, currency and RTL direction', () => {
    expect(service.normalize({ countryCode: 'ir' })).toMatchObject({ countryCode: 'IR', currency: 'IRR', direction: 'rtl' });
  });

  it('keeps locale-specific labels separate from canonical units', () => {
    expect(service.normalizeItem(2, 'کیلو')).toEqual({ quantity: 2, unit: 'kg' });
  });
});
