import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { NightlyMarketIntelligenceService } from './nightly-market-intelligence.service';
import { PricePersistenceService } from './price-persistence.service';

@Injectable()
export class AutomaticPriceSchedulerService implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setTimeout>;
  private running = false;
  private readonly timezone = process.env.PRICE_SCHEDULER_TIMEZONE ?? 'Asia/Tehran';
  private readonly hour = Number(process.env.PRICE_SCHEDULER_HOUR ?? 3);
  private readonly minute = Number(process.env.PRICE_SCHEDULER_MINUTE ?? 30);

  constructor(private readonly nightly: NightlyMarketIntelligenceService, private readonly persistence: PricePersistenceService) {}

  onModuleInit() {
    if (process.env.PRICE_SCHEDULER_ENABLED !== 'false') this.scheduleNext();
  }

  onModuleDestroy() { if (this.timer) clearTimeout(this.timer); }

  private scheduleNext() {
    if (this.timer) clearTimeout(this.timer);
    const target = this.nextOccurrence(new Date());
    const delay = Math.max(1_000, target.getTime() - Date.now());
    this.timer = setTimeout(() => void this.execute(target), Math.min(delay, 2_147_000_000));
  }

  private async execute(scheduledFor: Date) {
    try {
      if (!this.running) {
        this.running = true;
        await this.persistence.ensureTrackedProducts();
        await this.nightly.run(undefined, undefined, scheduledFor);
      }
    } finally {
      this.running = false;
      this.scheduleNext();
    }
  }

  private nextOccurrence(now: Date) {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: this.timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
    const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
    const y = get('year'); const m = get('month'); const d = get('day'); const h = get('hour'); const min = get('minute');
    const today = this.zonedUtc(y, m, d, this.hour, this.minute);
    if (h < this.hour || (h === this.hour && min < this.minute)) return today;
    const tomorrow = new Date(Date.UTC(y, m - 1, d + 1));
    return this.zonedUtc(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth() + 1, tomorrow.getUTCDate(), this.hour, this.minute);
  }

  private zonedUtc(year: number, month: number, day: number, hour: number, minute: number) {
    let guess = new Date(Date.UTC(year, month - 1, day, hour, minute));
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: this.timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(guess);
    const actual = new Date(Date.UTC(Number(parts.find((p) => p.type === 'year')?.value), Number(parts.find((p) => p.type === 'month')?.value) - 1, Number(parts.find((p) => p.type === 'day')?.value), Number(parts.find((p) => p.type === 'hour')?.value), Number(parts.find((p) => p.type === 'minute')?.value)));
    return new Date(guess.getTime() - (actual.getTime() - guess.getTime()));
  }
}
