import { Injectable } from '@nestjs/common';
import {
  GLOBAL_MARKET_COUNTRY_CODES,
  GLOBAL_MARKET_SOURCES,
  buildGlobalMarketProfile,
  GlobalMarketProfile,
  GlobalMarketSource,
} from '../data/global-market-source.catalog';

@Injectable()
export class GlobalMarketSourceRegistryService {
  listCountries() {
    return [...GLOBAL_MARKET_COUNTRY_CODES];
  }

  getCountryProfile(countryCode: string): GlobalMarketProfile | null {
    return buildGlobalMarketProfile(countryCode);
  }

  getSourcesForCountry(countryCode: string, operationalOnly = true): GlobalMarketSource[] {
    const profile = this.getCountryProfile(countryCode);
    if (!profile) return [];
    return profile.sourceIds
      .map((id) => GLOBAL_MARKET_SOURCES[id])
      .filter((source): source is GlobalMarketSource => Boolean(source))
      .filter((source) => !operationalOnly || source.enabled);
  }

  getOperationalSourceIds(countryCode: string) {
    return this.getSourcesForCountry(countryCode, true).map((source) => source.id);
  }

  getDiscoverySources(countryCode: string) {
    return this.getSourcesForCountry(countryCode, false).filter(
      (source) => source.role === 'discovery',
    );
  }

  hasDirectOrAggregatorCoverage(countryCode: string) {
    return this.getCountryProfile(countryCode)?.coverage === 'direct_and_aggregator';
  }
}
