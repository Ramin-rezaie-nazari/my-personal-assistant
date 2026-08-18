import { Injectable } from '@nestjs/common';

export type PriceConfidence = 'high' | 'medium' | 'low' | 'stale' | 'unverified';

@Injectable()
export class PriceConfidenceService {
  score(input: {
    successfulSources: number;
    attemptedSources: number;
    observedAt?: Date;
    now?: Date;
  }): {
    confidence: PriceConfidence;
    freshnessMinutes: number | null;
    reason: string;
  } {
    if (!input.successfulSources || !input.attemptedSources)
      return { confidence: 'unverified', freshnessMinutes: null, reason: 'no_verified_sources' };

    const now = input.now ?? new Date();
    const observedAt = input.observedAt;
    const freshnessMinutes = observedAt
      ? Math.max(0, Math.round((now.getTime() - observedAt.getTime()) / 60_000))
      : null;
    if (freshnessMinutes !== null && freshnessMinutes > 48 * 60)
      return { confidence: 'stale', freshnessMinutes, reason: 'older_than_48_hours' };

    const ratio = input.successfulSources / input.attemptedSources;
    if (ratio >= 0.75 && input.successfulSources >= 2)
      return { confidence: 'high', freshnessMinutes, reason: 'multiple_fresh_sources' };
    if (ratio >= 0.5)
      return { confidence: 'medium', freshnessMinutes, reason: 'partial_source_coverage' };
    return { confidence: 'low', freshnessMinutes, reason: 'limited_source_coverage' };
  }
}
