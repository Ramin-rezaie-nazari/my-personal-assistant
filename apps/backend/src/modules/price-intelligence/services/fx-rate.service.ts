import { Injectable } from '@nestjs/common';

export type FxRate = {
  base: string;
  quote: string;
  rate: number;
  observedAt: Date;
  source: 'frankfurter' | 'ecb';
};

export type FxRateClient = {
  getRate(base: string, quote: string): Promise<FxRate | null>;
};

@Injectable()
export class FxRateService {
  private readonly baseUrl =
    process.env.FX_PRIMARY_URL ?? 'https://api.frankfurter.dev/v2';
  private readonly fallbackUrl =
    process.env.FX_FALLBACK_URL ?? 'https://api.frankfurter.dev/v2';
  private cache = new Map<string, FxRate>();

  async getRate(base: string, quote: string): Promise<FxRate | null> {
    const normalizedBase = base.trim().toUpperCase();
    const normalizedQuote = quote.trim().toUpperCase();
    if (!normalizedBase || !normalizedQuote) return null;
    if (normalizedBase === normalizedQuote)
      return {
        base: normalizedBase,
        quote: normalizedQuote,
        rate: 1,
        observedAt: new Date(),
        source: 'frankfurter',
      };

    const key = `${normalizedBase}:${normalizedQuote}`;
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.observedAt.getTime() < 12 * 60 * 60 * 1000)
      return cached;

    const primary = await this.fetchRate(
      `${this.baseUrl}/rate/${normalizedBase}/${normalizedQuote}`,
      'frankfurter',
    );
    if (primary) {
      this.cache.set(key, primary);
      return primary;
    }

    const fallback = await this.fetchRate(
      `${this.fallbackUrl}/rate/${normalizedBase}/${normalizedQuote}?providers=ECB`,
      'ecb',
    );
    if (fallback) this.cache.set(key, fallback);
    return fallback;
  }

  async convert(amount: number, base: string, quote: string) {
    const rate = await this.getRate(base, quote);
    if (!rate) return null;
    return {
      amount: amount * rate.rate,
      currency: rate.quote,
      rate,
    };
  }

  private async fetchRate(url: string, source: FxRate['source']) {
    try {
      const response = await fetch(url, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) return null;
      const body = (await response.json()) as {
        base?: string;
        quote?: string;
        rate?: number;
        date?: string;
      };
      if (!body.base || !body.quote || typeof body.rate !== 'number' || !body.rate)
        return null;
      return {
        base: body.base.toUpperCase(),
        quote: body.quote.toUpperCase(),
        rate: body.rate,
        observedAt: body.date ? new Date(body.date) : new Date(),
        source,
      };
    } catch {
      return null;
    }
  }
}
