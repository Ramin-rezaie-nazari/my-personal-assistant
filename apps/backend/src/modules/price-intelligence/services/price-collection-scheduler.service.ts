import { Injectable } from '@nestjs/common';
import { NightlyMarketIntelligenceService, NightlyRunResult } from './nightly-market-intelligence.service';

export type PriceCollectionSchedule = {
  hour: number;
  minute: number;
  timezone?: string;
  enabled: boolean;
};

@Injectable()
export class PriceCollectionSchedulerService {
  private readonly defaults: PriceCollectionSchedule = {
    hour: 3,
    minute: 30,
    timezone: 'Asia/Tehran',
    enabled: true,
  };

  constructor(private readonly nightly: NightlyMarketIntelligenceService) {}

  schedule(override: Partial<PriceCollectionSchedule> = {}): PriceCollectionSchedule {
    const merged = { ...this.defaults, ...override };
    return {
      ...merged,
      hour: Math.min(23, Math.max(0, merged.hour)),
      minute: Math.min(59, Math.max(0, merged.minute)),
    };
  }

  shouldRun(now = new Date(), lastSuccessfulRunAt?: Date, override: Partial<PriceCollectionSchedule> = {}) {
    const schedule = this.schedule(override);
    if (!schedule.enabled) return { run: false, reason: 'disabled' } as const;
    if (this.nightly.shouldRun(now, lastSuccessfulRunAt, schedule).run) {
      return { run: true, reason: 'scheduled_or_catch_up' } as const;
    }
    return { run: false, reason: 'outside_window' } as const;
  }

  async collect(productKeys: string[], sourceIds?: string[], scheduledFor = new Date()): Promise<NightlyRunResult> {
    return this.nightly.run(productKeys, sourceIds, scheduledFor);
  }
}
