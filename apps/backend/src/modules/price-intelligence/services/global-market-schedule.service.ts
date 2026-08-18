import { Injectable } from '@nestjs/common';
import { GLOBAL_MARKET_COUNTRY_CODES } from '../data/global-market-source.catalog';
import { GLOBAL_MARKET_PRIMARY_TIMEZONES } from '../data/global-market-timezones';

export type MarketSchedule = {
  hour: number;
  minute: number;
  enabled: boolean;
};

@Injectable()
export class GlobalMarketScheduleService {
  private readonly defaultSchedule: MarketSchedule = {
    hour: 3,
    minute: 30,
    enabled: true,
  };

  config(override: Partial<MarketSchedule> = {}) {
    const merged = { ...this.defaultSchedule, ...override };
    return {
      ...merged,
      hour: Math.min(23, Math.max(0, merged.hour)),
      minute: Math.min(59, Math.max(0, merged.minute)),
    };
  }

  timezoneForCountry(countryCode: string) {
    return GLOBAL_MARKET_PRIMARY_TIMEZONES[countryCode.trim().toUpperCase()] ?? 'UTC';
  }

  dueCountries(now: Date, override: Partial<MarketSchedule> = {}) {
    const policy = this.config(override);
    if (!policy.enabled) return [];
    return GLOBAL_MARKET_COUNTRY_CODES.filter((countryCode) => {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: this.timezoneForCountry(countryCode),
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).formatToParts(now);
      const hour = Number(parts.find((part) => part.type === 'hour')?.value);
      const minute = Number(parts.find((part) => part.type === 'minute')?.value);
      return hour === policy.hour && minute === policy.minute;
    });
  }

  nextOccurrence(now: Date, timezone: string, override: Partial<MarketSchedule> = {}) {
    const policy = this.config(override);
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
    const get = (type: string) =>
      Number(parts.find((part) => part.type === type)?.value);
    const y = get('year');
    const m = get('month');
    const d = get('day');
    const h = get('hour');
    const min = get('minute');
    const targetToday = this.zonedUtc(y, m, d, policy.hour, policy.minute, timezone);
    if (h < policy.hour || (h === policy.hour && min < policy.minute)) return targetToday;
    const tomorrow = new Date(Date.UTC(y, m - 1, d + 1));
    return this.zonedUtc(
      tomorrow.getUTCFullYear(),
      tomorrow.getUTCMonth() + 1,
      tomorrow.getUTCDate(),
      policy.hour,
      policy.minute,
      timezone,
    );
  }

  private zonedUtc(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    timezone: string,
  ) {
    const guess = new Date(Date.UTC(year, month - 1, day, hour, minute));
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(guess);
    const actual = new Date(
      Date.UTC(
        Number(parts.find((part) => part.type === 'year')?.value),
        Number(parts.find((part) => part.type === 'month')?.value) - 1,
        Number(parts.find((part) => part.type === 'day')?.value),
        Number(parts.find((part) => part.type === 'hour')?.value),
        Number(parts.find((part) => part.type === 'minute')?.value),
      ),
    );
    return new Date(guess.getTime() - (actual.getTime() - guess.getTime()));
  }
}
