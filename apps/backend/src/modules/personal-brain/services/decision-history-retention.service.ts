import { Injectable } from '@nestjs/common';

export type HistoryRetention = '1_month' | '3_months' | '6_months' | '1_year' | 'unlimited';

export type HistoryRetentionPolicy = {
  retention: HistoryRetention;
  deleteRecentActivityHours?: number;
};

@Injectable()
export class DecisionHistoryRetentionService {
  private readonly policies = new Map<string, HistoryRetentionPolicy>();
  private readonly defaults: HistoryRetentionPolicy = { retention: '3_months' };

  setPolicy(userId: string, policy: HistoryRetentionPolicy) {
    const normalized = { ...policy };
    if (normalized.deleteRecentActivityHours !== undefined) {
      normalized.deleteRecentActivityHours = Math.min(Math.max(normalized.deleteRecentActivityHours, 0.25), 24 * 365);
    }
    this.policies.set(userId, normalized);
    return normalized;
  }

  getPolicy(userId: string): HistoryRetentionPolicy {
    return this.policies.get(userId) ?? this.defaults;
  }

  cutoff(userId: string, now = Date.now()): number | null {
    const retention = this.getPolicy(userId).retention;
    const months: Record<Exclude<HistoryRetention, 'unlimited'>, number> = {
      '1_month': 1,
      '3_months': 3,
      '6_months': 6,
      '1_year': 12,
    };
    if (retention === 'unlimited') return null;
    const date = new Date(now);
    date.setMonth(date.getMonth() - months[retention]);
    return date.getTime();
  }

  isExpired(userId: string, recordedAt: number, now = Date.now()): boolean {
    const cutoff = this.cutoff(userId, now);
    return cutoff !== null && recordedAt < cutoff;
  }
}
