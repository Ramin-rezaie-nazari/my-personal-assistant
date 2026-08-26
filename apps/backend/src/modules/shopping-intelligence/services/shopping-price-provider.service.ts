import { Injectable } from '@nestjs/common';

export type ShoppingPriceQuote = {
  productKey: string;
  price: number;
  currency: string;
  countryCode?: string;
  retailer?: string;
  source: string;
  observedAt: Date;
  available: boolean;
};

export interface ShoppingPriceProvider {
  readonly name: string;
  quote(productKeys: string[], context: { countryCode?: string; currency?: string }): Promise<ShoppingPriceQuote[]>;
}

@Injectable()
export class ShoppingPriceProviderService {
  private readonly providers = new Map<string, ShoppingPriceProvider>();

  register(provider: ShoppingPriceProvider) {
    this.providers.set(provider.name, provider);
  }

  listProviders() {
    return Array.from(this.providers.keys());
  }

  async quote(
    productKeys: string[],
    context: { countryCode?: string; currency?: string } = {},
  ): Promise<ShoppingPriceQuote[]> {
    const providers = Array.from(this.providers.values());
    if (providers.length === 0) return [];
    const results = await Promise.allSettled(providers.map((provider) => provider.quote(productKeys, context)));
    return results
      .filter((result): result is PromiseFulfilledResult<ShoppingPriceQuote[]> => result.status === 'fulfilled')
      .flatMap((result) => result.value)
      .filter((quote) => quote.price >= 0 && Boolean(quote.source));
  }

  chooseBest(
    quotes: ShoppingPriceQuote[],
    context: { currency?: string; countryCode?: string } = {},
  ) {
    const eligible = quotes.filter((quote) => quote.available && quote.price >= 0);
    return eligible.sort((a, b) => {
      const currencyBias = (quote: ShoppingPriceQuote) => (context.currency && quote.currency === context.currency ? 0 : 1);
      const countryBias = (quote: ShoppingPriceQuote) => (context.countryCode && quote.countryCode === context.countryCode ? 0 : 1);
      return (
        currencyBias(a) - currencyBias(b) ||
        countryBias(a) - countryBias(b) ||
        a.price - b.price ||
        b.observedAt.getTime() - a.observedAt.getTime()
      );
    })[0] ?? null;
  }
}
