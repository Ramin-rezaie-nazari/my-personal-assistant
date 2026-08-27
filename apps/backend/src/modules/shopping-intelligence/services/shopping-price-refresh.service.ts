import { Injectable } from '@nestjs/common';
import { ShoppingPriceProviderService, ShoppingPriceQuote } from './shopping-price-provider.service';

@Injectable()
export class ShoppingPriceRefreshService {
  constructor(private readonly providers: ShoppingPriceProviderService) {}

  async refresh(productKeys: string[], context: { countryCode?: string; currency?: string } = {}): Promise<{
    requested: number;
    quotes: ShoppingPriceQuote[];
    providerCount: number;
    refreshedAt: Date;
  }> {
    const quotes = await this.providers.quote(productKeys, context);
    return {
      requested: productKeys.length,
      quotes,
      providerCount: this.providers.listProviders().length,
      refreshedAt: new Date(),
    };
  }
}
