import { Injectable } from '@nestjs/common';
import {
  GLOBAL_MARKET_COUNTRY_CODES,
  GLOBAL_MARKET_SOURCES,
  buildGlobalMarketProfile,
  GlobalMarketProfile,
  GlobalMarketSource,
} from '../data/global-market-source.catalog';
import {
  GLOBAL_MARKET_SOURCE_CORRECTIONS,
  GLOBAL_MARKET_SOURCE_EXCLUSIONS,
} from '../data/global-market-source.corrections';

@Injectable()
export class GlobalMarketSourceRegistryService {
  listCountries() {
    return [...GLOBAL_MARKET_COUNTRY_CODES];
  }

  getCountryProfile(countryCode: string): GlobalMarketProfile | null {
    return buildGlobalMarketProfile(countryCode);
  }

  getSourcesForCountry(countryCode: string, operationalOnly = true): GlobalMarketSource[] {
    const normalizedCountry = countryCode.trim().toUpperCase();
    const profile = this.getCountryProfile(normalizedCountry);
    if (!profile) return [];

    const exclusions = new Set(GLOBAL_MARKET_SOURCE_EXCLUSIONS[normalizedCountry] ?? []);
    const correctionSources = GLOBAL_MARKET_SOURCE_CORRECTIONS[normalizedCountry] ?? [];
    const correctionById = new Map(correctionSources.map((source) => [source.id, source]));

    return [
      ...profile.sourceIds
        .filter((id) => !exclusions.has(id))
        .map((id) => correctionById.get(id) ?? GLOBAL_MARKET_SOURCES[id])
        .filter((source): source is GlobalMarketSource => Boolean(source)),
      ...correctionSources.filter((source) => !profile.sourceIds.includes(source.id)),
    ].filter((source) => !operationalOnly || source.enabled);
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
    return this.getSourcesForCountry(countryCode, true).some(
      (source) => source.role !== 'discovery',
    );
  }
}
