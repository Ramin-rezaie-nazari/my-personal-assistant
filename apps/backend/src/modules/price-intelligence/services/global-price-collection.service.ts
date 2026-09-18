import { Injectable } from '@nestjs/common';
import { GlobalCountryFinanceService } from '../../budget-intelligence/services/global-country-finance.service';
import { NormalizedPrice } from '../models/price-intelligence.model';
import { OpenPricesSourceAdapter } from './open-prices-source.adapter';
import { PricePersistenceService } from './price-persistence.service';

export type GlobalPriceCoverageRow = {
  countryCode: string;
  currencyCode: string | null;
  status: 'fresh' | 'stale' | 'missing';
  lastObservedAt: Date | null;
  lastCollectedAt: Date | null;
  observationCount: number;
};

@Injectable()
export class GlobalPriceCollectionService {
  constructor(
    private readonly persistence: PricePersistenceService,
    private readonly countries: GlobalCountryFinanceService,
    private readonly source: OpenPricesSourceAdapter,
  ) {}

  async collect(
    scheduledFor = this.dailySchedule(new Date()),
    sinceDays = Number(process.env.PRICE_OPEN_PRICES_SINCE_DAYS ?? 2),
  ) {
    const startedAt = new Date();
    const lock = await this.persistence.createRun(scheduledFor, startedAt, 'global', this.source.id);
    if (!lock.acquired) {
      return { status: 'skipped' as const, runId: lock.id, fetched: 0, accepted: 0, written: 0 };
    }

    try {
      const since = this.utcDayOffset(new Date(), -Math.max(1, sinceDays));
      const result = await this.source.fetchRecentPrices(since);
      const supported = new Set(this.countries.getSupportedCountryCodes());
      const accepted = result.prices.filter(
        (price) =>
          !!price.countryCode &&
          supported.has(price.countryCode) &&
          price.observedAt >= since,
      );
      const written = await this.persistence.record(accepted);
      const byCountry = new Map<string, NormalizedPrice[]>();
      for (const price of accepted) {
        const code = price.countryCode!;
        const rows = byCountry.get(code) ?? [];
        rows.push(price);
        byCountry.set(code, rows);
      }

      for (const countryCode of supported) {
        const rows = byCountry.get(countryCode) ?? [];
        const lastObservedAt = rows.reduce<Date | null>(
          (latest, row) => (!latest || row.observedAt > latest ? row.observedAt : latest),
          null,
        );
        await this.persistence.upsertCoverage(this.source.id, countryCode, lastObservedAt, rows.length);
      }

      const coverage = await this.coverage(this.source.id);
      const freshCountries = coverage.filter((row) => row.status === 'fresh').length;
      const staleCountries = coverage.filter((row) => row.status === 'stale').length;
      const missingCountries = coverage.filter((row) => row.status === 'missing').length;
      const status = accepted.length === 0
        ? 'failed'
        : result.truncated || missingCountries > 0 || staleCountries > 0
          ? 'partial'
          : 'completed';

      await this.persistence.finishRun(lock.id, {
        status,
        attempts: 1,
        collected: written,
        failedSources: result.truncated ? [this.source.id] : [],
        attemptedSources: [this.source.id],
        error: result.truncated ? `open_prices_page_cap_reached:${result.pagesFetched}/${result.totalPages}` : undefined,
      });

      return {
        status: status as 'completed' | 'partial' | 'failed',
        runId: lock.id,
        fetched: result.prices.length,
        accepted: accepted.length,
        written,
        pagesFetched: result.pagesFetched,
        totalPages: result.totalPages,
        truncated: result.truncated,
        freshCountries,
        staleCountries,
        missingCountries,
      };
    } catch (cause) {
      await this.persistence.finishRun(lock.id, {
        status: 'failed',
        attempts: 1,
        collected: 0,
        failedSources: [this.source.id],
        attemptedSources: [this.source.id],
        error: cause instanceof Error ? cause.message : String(cause),
      });
      throw cause;
    }
  }

  async coverage(sourceId = this.source.id): Promise<GlobalPriceCoverageRow[]> {
    const rows = (await this.persistence.coverage(sourceId)) as Array<{
      countryCode: string;
      sourceId: string;
      lastObservedAt: Date | null;
      lastCollectedAt: Date | null;
      observationCount: number;
      status: string;
    }>;
    const byCountry = new Map(rows.map((row) => [row.countryCode, row]));
    return this.countries.getSupportedCountryCodes().map((countryCode) => {
      const row = byCountry.get(countryCode);
      const finance = this.countries.getCountryCurrency(countryCode);
      const status = row?.status === 'fresh' || row?.status === 'stale' ? row.status : 'missing';
      return {
        countryCode,
        currencyCode: finance?.currencyCode ?? null,
        status,
        lastObservedAt: row?.lastObservedAt ?? null,
        lastCollectedAt: row?.lastCollectedAt ?? null,
        observationCount: Number(row?.observationCount ?? 0),
      };
    });
  }

  private dailySchedule(now: Date) {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 2, 17, 0, 0));
  }

  private utcDayOffset(now: Date, offsetDays: number) {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offsetDays));
  }
}