import { GLOBAL_COUNTRY_CURRENCIES } from '../../budget-intelligence/data/global-country-currency';
import { NormalizedPrice } from '../models/price-intelligence.model';

type JsonRecord = Record<string, unknown>;
type OpenPricesResponse = { items?: JsonRecord[]; next?: string | null };

const DEFAULT_BASE_URL = 'https://prices.openfoodfacts.org/api/v1/prices';

export class OpenPricesSourceAdapter {
  readonly id = 'open-prices' as const;
  readonly kind = 'public_dataset' as const;

  async fetchPrices(_productKeys: string[]): Promise<NormalizedPrice[]> {
    const maxPages = Math.min(Math.max(Number(process.env.OPEN_PRICES_MAX_PAGES ?? 20), 1), 200);
    const maxAgeDays = Math.min(Math.max(Number(process.env.OPEN_PRICES_MAX_AGE_DAYS ?? 2), 1), 365);
    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
    const output: NormalizedPrice[] = [];
    let nextUrl: string | null = this.buildUrl(1);
    let page = 0;

    while (nextUrl && page < maxPages) {
      page += 1;
      const response = await fetch(nextUrl, {
        headers: {
          accept: 'application/json',
          'user-agent': 'MyPersonalAssistant/1.0 price-intelligence',
        },
        signal: AbortSignal.timeout(
          Math.min(Math.max(Number(process.env.OPEN_PRICES_TIMEOUT_MS ?? 15_000), 1_000), 60_000),
        ),
      });
      if (!response.ok)
        throw new Error('price_source_http_open-prices_' + response.status);

      const data = (await response.json()) as OpenPricesResponse;
      let hitCutoff = false;
      for (const item of data.items ?? []) {
        const normalized = this.normalize(item);
        if (!normalized) continue;
        if (normalized.observedAt.getTime() < cutoff) {
          hitCutoff = true;
          break;
        }
        output.push(normalized);
      }
      if (hitCutoff) break;
      nextUrl = typeof data.next === 'string' && data.next ? data.next : null;
    }

    return output;
  }

  private buildUrl(page: number) {
    const url = new URL(process.env.OPEN_PRICES_API_URL ?? DEFAULT_BASE_URL);
    url.searchParams.set('size', '100');
    url.searchParams.set('page', String(page));
    url.searchParams.set('order_by', '-date');
    return url.toString();
  }

  private normalize(item: JsonRecord): NormalizedPrice | null {
    const product = this.record(item.product);
    const location = this.record(item.location);
    const countryCode = String(
      product?.osm_address_country_code ??
        location?.osm_address_country_code ??
        product?.country_code ??
        location?.country_code ??
        '',
    ).trim().toUpperCase();
    if (!countryCode || !GLOBAL_COUNTRY_CURRENCIES[countryCode]) return null;

    const amount = this.number(item.price);
    if (!(amount > 0)) return null;

    const productCode = this.clean(String(product?.code ?? ''));
    const productName =
      this.clean(String(product?.product_name ?? product?.brands ?? '')) ||
      (productCode ? 'Open Food Facts ' + productCode : 'Food product');
    const productKey = productCode
      ? 'off:' + productCode
      : this.productKey(productName);
    const currency =
      this.clean(String(item.currency ?? '')).toUpperCase() ||
      GLOBAL_COUNTRY_CURRENCIES[countryCode].currencyCode;
    const observedAt = this.parseDate(item.date ?? item.created_at);
    if (!observedAt) return null;

    return {
      productKey,
      title: productName,
      sourceId: this.id,
      sourceKind: this.kind,
      sourceRecordId: item.id != null ? String(item.id) : undefined,
      countryCode,
      url: 'https://prices.openfoodfacts.org/app',
      currency,
      amount,
      unit: this.clean(String(item.price_per ?? item.unit ?? '')) || undefined,
      city:
        this.clean(String(
          product?.osm_address_city ?? location?.osm_address_city ?? '',
        )) || undefined,
      availability: 'unknown',
      observedAt,
    };
  }

  private parseDate(value: unknown) {
    if (!value) return null;
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private number(value: unknown) {
    const parsed = Number(
      String(value ?? '')
        .replace(/[,٬،\s]/g, '')
        .replace(/[^0-9.-]/g, ''),
    );
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private productKey(value: string) {
    return value
      .trim()
      .toLocaleLowerCase()
      .replace(/[\u200c\s]+/g, '-')
      .replace(/[^\p{L}\p{N}-]+/gu, '')
      .slice(0, 180);
  }

  private clean(value: string) {
    return value.trim();
  }

  private record(value: unknown): JsonRecord | null {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as JsonRecord)
      : null;
  }
}
