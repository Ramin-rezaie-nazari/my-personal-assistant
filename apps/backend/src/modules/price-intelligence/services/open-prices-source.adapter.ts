import { NormalizedPrice } from '../models/price-intelligence.model';

export type OpenPricesCollectionResult = {
  prices: NormalizedPrice[];
  pagesFetched: number;
  totalPages: number;
  truncated: boolean;
};

type JsonRecord = Record<string, unknown>;

export class OpenPricesSourceAdapter {
  readonly id = 'open-prices';
  readonly kind = 'open_dataset' as const;
  private readonly baseUrl = process.env.PRICE_OPEN_PRICES_URL ?? 'https://prices.openfoodfacts.org';

  async fetchRecentPrices(
    since: Date,
    options: { maxPages?: number; pageSize?: number } = {},
  ): Promise<OpenPricesCollectionResult> {
    const maxPages = Math.max(
      1,
      Number(options.maxPages ?? process.env.PRICE_OPEN_PRICES_MAX_PAGES ?? 50),
    );
    const pageSize = Math.min(
      100,
      Math.max(1, Number(options.pageSize ?? process.env.PRICE_OPEN_PRICES_PAGE_SIZE ?? 100)),
    );
    const prices: NormalizedPrice[] = [];
    const seen = new Set<string>();
    let page = 1;
    let totalPages = 1;
    let pagesFetched = 0;

    while (page <= totalPages && page <= maxPages) {
      const url = new URL('/api/v1/prices', this.baseUrl);
      url.searchParams.set('date__gte', this.dateOnly(since));
      url.searchParams.set('type', 'PRODUCT');
      url.searchParams.set('size', String(pageSize));
      url.searchParams.set('page', String(page));

      const response = await fetch(url, {
        headers: {
          accept: 'application/json',
          'user-agent':
            process.env.PRICE_OPEN_PRICES_USER_AGENT ??
            'MyPersonalAssistant/1.0 (https://github.com/Ramin-rezaie-nazari/my-personal-assistant)',
        },
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) throw new Error(`open_prices_http_${response.status}`);

      const body = (await response.json()) as JsonRecord;
      const items = Array.isArray(body.items) ? body.items : [];
      totalPages = Math.max(1, Number(body.pages ?? page));
      pagesFetched += 1;

      for (const raw of items) {
        const normalized = this.normalize(raw);
        if (!normalized) continue;
        const fingerprint = [
          normalized.productKey,
          normalized.countryCode ?? '',
          normalized.currency,
          normalized.amount,
          normalized.city ?? '',
          normalized.observedAt.toISOString(),
        ].join('|');
        if (seen.has(fingerprint)) continue;
        seen.add(fingerprint);
        prices.push(normalized);
      }

      if (!items.length || page >= totalPages) break;
      page += 1;
    }

    return { prices, pagesFetched, totalPages, truncated: totalPages > pagesFetched };
  }

  private normalize(raw: unknown): NormalizedPrice | null {
    if (!this.isRecord(raw)) return null;
    const amount = Number(raw.price);
    const currency = String(raw.currency ?? '').trim().toUpperCase();
    const dateText = String(raw.date ?? '').trim();
    const observedAt = /^\d{4}-\d{2}-\d{2}$/.test(dateText)
      ? new Date(`${dateText}T00:00:00.000Z`)
      : null;
    if (!Number.isFinite(amount) || amount <= 0 || !currency || !observedAt || Number.isNaN(observedAt.getTime())) return null;

    const location = this.isRecord(raw.location) ? raw.location : {};
    const countryCode = String(
      location.osm_address_country_code ?? location.country_code ?? raw.countryCode ?? '',
    ).trim().toUpperCase().slice(0, 2) || undefined;
    const product = this.isRecord(raw.product) ? raw.product : {};
    const productCode = String(raw.product_code ?? product.code ?? '').trim();
    const productName = String(
      raw.product_name ?? product.product_name ?? product.name ?? productCode ?? '',
    ).trim();
    if (!productName) return null;

    const productKey = productCode
      ? `openprices:${productCode.slice(0, 64)}`
      : `openprices:name:${encodeURIComponent(productName).slice(0, 150)}`;
    const unit = raw.price_per ? String(raw.price_per).trim().toLowerCase() : undefined;
    const city = String(location.osm_address_city ?? location.city ?? '').trim() || undefined;

    return {
      productKey,
      title: productName.slice(0, 300),
      sourceId: this.id,
      sourceKind: this.kind,
      url: productCode
        ? `https://world.openfoodfacts.org/product/${encodeURIComponent(productCode)}`
        : undefined,
      currency,
      amount,
      unit,
      city,
      countryCode,
      observedAt,
    };
  }

  private dateOnly(value: Date) {
    return value.toISOString().slice(0, 10);
  }

  private isRecord(value: unknown): value is JsonRecord {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}