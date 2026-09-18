import { Injectable } from '@nestjs/common';
import { GLOBAL_COUNTRY_CURRENCIES } from '../../budget-intelligence/data/global-country-currency';
import { PrismaService } from '../../../common/database/prisma.service';

export type PriceCountryCoverage = {
  countryCode: string;
  currency: string;
  latestObservedAt: Date | null;
  priceCount: number;
  sourceCount: number;
  status: 'fresh' | 'stale' | 'no_data';
};

@Injectable()
export class PriceCoverageService {
  constructor(private readonly prisma: PrismaService) {}

  async getCoverage(maxAgeDays = 7) {
    const boundedAgeDays = Math.min(Math.max(Number(maxAgeDays) || 7, 1), 365);
    const cutoff = new Date(Date.now() - boundedAgeDays * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.$queryRaw<
      Array<{
        countryCode: string;
        latestObservedAt: Date | null;
        priceCount: bigint;
        sourceCount: bigint;
      }>
    >`SELECT "countryCode", MAX("observedAt") AS "latestObservedAt", COUNT(*) AS "priceCount", COUNT(DISTINCT "sourceId") AS "sourceCount" FROM "PriceSnapshot" GROUP BY "countryCode"`;

    const byCountry = new Map(rows.map((row) => [row.countryCode.toUpperCase(), row]));
    const countries = Object.keys(GLOBAL_COUNTRY_CURRENCIES).map((countryCode) => {
      const currency = GLOBAL_COUNTRY_CURRENCIES[countryCode].currencyCode;
      const row = byCountry.get(countryCode);
      const latestObservedAt = row?.latestObservedAt ?? null;
      return {
        countryCode,
        currency,
        latestObservedAt,
        priceCount: Number(row?.priceCount ?? 0),
        sourceCount: Number(row?.sourceCount ?? 0),
        status: !latestObservedAt
          ? 'no_data'
          : latestObservedAt >= cutoff
            ? 'fresh'
            : 'stale',
      } satisfies PriceCountryCoverage;
    });

    return {
      totalCountries: countries.length,
      freshnessWindowDays: boundedAgeDays,
      countriesWithData: countries.filter((country) => country.status !== 'no_data').length,
      countriesFresh: countries.filter((country) => country.status === 'fresh').length,
      countriesStale: countries.filter((country) => country.status === 'stale').length,
      countriesWithoutData: countries.filter((country) => country.status === 'no_data').length,
      countries,
    };
  }
}
