import { Injectable } from '@nestjs/common';
import { GLOBAL_MARKET_COUNTRY_CODES } from '../data/global-market-source.catalog';
import { GlobalMarketSourceRegistryService } from './global-market-source-registry.service';

export type GlobalMarketCoverageSummary = {
  totalCountries: number;
  directOrAggregatorCountries: number;
  discoveryOnlyCountries: number;
  directCoveragePercent: number;
  complete: boolean;
};

@Injectable()
export class GlobalMarketCoverageService {
  constructor(private readonly registry: GlobalMarketSourceRegistryService) {}

  summary(): GlobalMarketCoverageSummary {
    const directOrAggregatorCountries = GLOBAL_MARKET_COUNTRY_CODES.filter((country) =>
      this.registry.hasDirectOrAggregatorCoverage(country),
    ).length;
    const totalCountries = GLOBAL_MARKET_COUNTRY_CODES.length;
    const discoveryOnlyCountries = totalCountries - directOrAggregatorCountries;
    return {
      totalCountries,
      directOrAggregatorCountries,
      discoveryOnlyCountries,
      directCoveragePercent:
        totalCountries === 0 ? 0 : Number(((directOrAggregatorCountries / totalCountries) * 100).toFixed(2)),
      complete: discoveryOnlyCountries === 0,
    };
  }

  countriesNeedingVerification() {
    return GLOBAL_MARKET_COUNTRY_CODES.filter(
      (country) => !this.registry.hasDirectOrAggregatorCoverage(country),
    );
  }

  sourceLinks(countryCode: string) {
    return this.registry.getSourcesForCountry(countryCode, false).map((source) => ({
      id: source.id,
      name: source.name,
      role: source.role,
      enabled: source.enabled,
      url: source.baseUrl,
    }));
  }
}
