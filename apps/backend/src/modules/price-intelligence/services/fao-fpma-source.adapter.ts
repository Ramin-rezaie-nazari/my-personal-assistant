import { GLOBAL_COUNTRY_CURRENCIES } from '../../budget-intelligence/data/global-country-currency';
import { ISO3_TO_ISO2 } from '../data/iso3-to-iso2';
import { NormalizedPrice } from '../models/price-intelligence.model';

type JsonRecord = Record<string, unknown>;
type FpmaSeriesResponse = { results?: Array<JsonRecord>; next?: string | null };
type FpmaPriceResponse = { results?: Array<JsonRecord> };

type Series = {
  uuid: string;
  countryCode: string;
  commodity: string;
  priceType: string;
  currency: string;
  unit: string;
  market: string;
  periodicities: string[];
};

const BASE = 'https://fpma.fao.org/giews/v4/global/price_module/api/v1';

export class FaoFpmaSourceAdapter {
  readonly id = 'fao-fpma' as const;
  readonly kind = 'public_dataset' as const;

  async fetchPrices(_productKeys: string[]): Promise<NormalizedPrice[]> {
    const series = await this.fetchRetailSeries();
    const output: NormalizedPrice[] = [];

    const byPeriod = new Map<string, Series[]>();
    for (const item of series) {
      const period = item.periodicities.includes('monthly')
        ? 'monthly'
        : item.periodicities.includes('weekly')
          ? 'weekly'
          : item.periodicities.includes('daily')
            ? 'daily'
            : null;
      if (!period) continue;
      const list = byPeriod.get(period) ?? [];
      list.push(item);
      byPeriod.set(period, list);
    }

    const batchSize = 40;
    for (const [periodicity, items] of byPeriod) {
      for (let index = 0; index < items.length; index += batchSize) {
        const batch = items.slice(index, index + batchSize);
        const url = new URL(BASE + '/FpmaSeriePrice/');
        url.searchParams.set('uuid__in', batch.map((item) => item.uuid).join(','));
        url.searchParams.set('periodicity', periodicity);

        const response = await fetch(url.toString(), {
          headers: {
            accept: 'application/json',
            'user-agent': 'MyPersonalAssistant/1.0 price-intelligence',
          },
          signal: AbortSignal.timeout(
            Math.min(Math.max(Number(process.env.FPMA_TIMEOUT_MS ?? 20_000), 1_000), 60_000),
          ),
        });
        if (!response.ok)
          throw new Error('price_source_http_fao-fpma_' + response.status);

        const payload = (await response.json()) as FpmaPriceResponse;
        const metadata = new Map(batch.map((item) => [item.uuid, item]));

        for (const result of payload.results ?? []) {
          const meta = metadata.get(String(result.uuid));
          if (!meta) continue;
          const datapoints = Array.isArray(result.datapoints) ? result.datapoints : [];
          const latest = datapoints
            .map((point) => this.record(point))
            .filter((point): point is JsonRecord => Boolean(point))
            .sort((a, b) => this.dateValue(b.date) - this.dateValue(a.date))[0];
          if (!latest) continue;

          const amount = this.number(latest.price_value);
          if (!(amount > 0)) continue;

          const currency =
            meta.currency ||
            GLOBAL_COUNTRY_CURRENCIES[meta.countryCode]?.currencyCode;
          if (!currency) continue;

          const conversionFactor = this.number(latest.conversion_factor);
          output.push({
            productKey: this.productKey(meta.commodity),
            title: meta.commodity,
            sourceId: this.id,
            sourceKind: this.kind,
            sourceRecordId: meta.uuid + ':' + String(latest.id ?? latest.date),
            countryCode: meta.countryCode,
            currency: currency.toUpperCase(),
            amount,
            unit: meta.unit || undefined,
            unitPrice: conversionFactor > 0 ? amount * conversionFactor : undefined,
            city: meta.market || undefined,
            availability: 'unknown',
            observedAt: new Date(String(latest.date)),
          });
        }
      }
    }

    return output;
  }

  private async fetchRetailSeries() {
    const results: Series[] = [];
    let nextUrl: string | null = this.seriesUrl(1);
    let guard = 0;

    while (nextUrl && guard < 500) {
      guard += 1;
      const response = await fetch(nextUrl, {
        headers: {
          accept: 'application/json',
          'user-agent': 'MyPersonalAssistant/1.0 price-intelligence',
        },
        signal: AbortSignal.timeout(
          Math.min(Math.max(Number(process.env.FPMA_TIMEOUT_MS ?? 20_000), 1_000), 60_000),
        ),
      });
      if (!response.ok)
        throw new Error('price_source_http_fao-fpma_' + response.status);

      const payload = (await response.json()) as FpmaSeriesResponse;
      for (const raw of payload.results ?? []) {
        const item = this.series(raw);
        if (item && item.priceType.toUpperCase() === 'RETAIL') results.push(item);
      }
      nextUrl = typeof payload.next === 'string' && payload.next ? payload.next : null;
    }
    return results;
  }

  private series(raw: JsonRecord): Series | null {
    const iso3 = this.clean(String(raw.iso3_country_code ?? '')).toUpperCase();
    const countryCode = ISO3_TO_ISO2[iso3];
    if (!countryCode || !GLOBAL_COUNTRY_CURRENCIES[countryCode]) return null;

    const commodity =
      typeof raw.commodity === 'string'
        ? this.clean(raw.commodity)
        : this.clean(String(this.record(raw.commodity)?.name ?? ''));
    if (!commodity) return null;

    const uuid = this.clean(String(raw.uuid ?? ''));
    if (!uuid) return null;

    const periodicities = Array.isArray(raw.periodicity)
      ? raw.periodicity
          .map((value) =>
            typeof value === 'string'
              ? value
              : String(this.record(value)?.period ?? ''),
          )
          .filter(Boolean)
          .map((value) => value.toLowerCase())
      : [];

    const currency =
      typeof raw.currency === 'string'
        ? this.clean(raw.currency)
        : this.clean(
            String(
              this.record(raw.currency)?.code ??
                this.record(raw.currency)?.currency_code ??
                '',
            ),
          );

    const unit = this.clean(String(raw.measure_unit_label ?? raw.measure_unit ?? ''));

    const market =
      typeof raw.market === 'string'
        ? this.clean(raw.market)
        : this.clean(String(this.record(raw.market)?.name ?? ''));

    return {
      uuid,
      countryCode,
      commodity,
      priceType: this.clean(String(raw.price_type ?? '')),
      currency,
      unit,
      market,
      periodicities,
    };
  }

  private seriesUrl(page: number) {
    const url = new URL(BASE + '/FpmaSerie/');
    url.searchParams.set('iso3_country_codes', Object.keys(ISO3_TO_ISO2).join(','));
    url.searchParams.set('page', String(page));
    url.searchParams.set(
      'page_size',
      String(
        Math.min(Math.max(Number(process.env.FPMA_SERIES_PAGE_SIZE ?? 100), 20), 500),
      ),
    );
    return url.toString();
  }

  private dateValue(value: unknown) {
    const timestamp = new Date(String(value ?? '')).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  private number(value: unknown) {
    const parsed = Number(String(value ?? '').replace(/[,٬،\s]/g, '').replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private productKey(value: string) {
    return value.trim().toLocaleLowerCase()
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
