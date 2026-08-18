import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { GLOBAL_MARKET_COUNTRY_CODES } from '../data/global-market-source.catalog';
import { GlobalMarketScheduleService } from './global-market-schedule.service';
import { NightlyMarketIntelligenceService } from './nightly-market-intelligence.service';
import { PricePersistenceService } from './price-persistence.service';

@Injectable()
export class GlobalMarketAutomaticSchedulerService
  implements OnModuleInit, OnModuleDestroy
{
  private timer?: ReturnType<typeof setTimeout>;
  private running = false;

  constructor(
    private readonly schedule: GlobalMarketScheduleService,
    private readonly nightly: NightlyMarketIntelligenceService,
    private readonly persistence: PricePersistenceService,
  ) {}

  onModuleInit() {
    if (process.env.PRICE_GLOBAL_SCHEDULER_ENABLED === 'false') return;
    this.scheduleNext();
  }

  onModuleDestroy() {
    if (this.timer) clearTimeout(this.timer);
  }

  private scheduleNext() {
    if (this.timer) clearTimeout(this.timer);
    const target = this.findSoonestOccurrence(new Date());
    const delay = Math.max(1_000, target.when.getTime() - Date.now());
    this.timer = setTimeout(() => void this.execute(target.countryCode, target.when), Math.min(delay, 2_147_000_000));
  }

  private findSoonestOccurrence(now: Date) {
    let best: { countryCode: string; when: Date } | undefined;
    for (const countryCode of GLOBAL_MARKET_COUNTRY_CODES) {
      const timezone = this.schedule.timezoneForCountry(countryCode);
      const when = this.schedule.nextOccurrence(now, timezone);
      if (!best || when.getTime() < best.when.getTime()) best = { countryCode, when };
    }
    return best ?? { countryCode: 'US', when: new Date(now.getTime() + 24 * 60 * 60 * 1000) };
  }

  private async execute(countryCode: string, scheduledFor: Date) {
    if (this.running) {
      this.scheduleNext();
      return;
    }
    this.running = true;
    try {
      await this.persistence.ensureTrackedProducts();
      const result = await this.nightly.run(
        undefined,
        undefined,
        scheduledFor,
        countryCode,
      );
      if (result.status === 'failed') {
        // The next occurrence scheduler remains authoritative; source failures are persisted by NightlyMarketIntelligenceService.
      }
    } finally {
      this.running = false;
      this.scheduleNext();
    }
  }
}
