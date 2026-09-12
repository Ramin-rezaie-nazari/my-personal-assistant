import { Injectable } from '@nestjs/common';

export type HistoryRetention =
  '1_month' | '3_months' | '6_months' | '1_year' | 'unlimited';
export type HistoryRetentionPolicy = {
  retention: HistoryRetention;
  deleteRecentActivityHours?: number;
};

const VALID_RETENTION = new Set<HistoryRetention>([
  '1_month',
  '3_months',
  '6_months',
  '1_year',
  'unlimited',
]);

@Injectable()
export class DecisionHistoryRetentionService {
  private readonly policy: HistoryRetentionPolicy = {
    retention: this.readRetention(),
  };

  getPolicy(_userId: string): HistoryRetentionPolicy {
    return this.policy;
  }

  setPolicy(_userId: string, policy: HistoryRetentionPolicy) {
    const normalized: HistoryRetentionPolicy = {
      retention: VALID_RETENTION.has(policy.retention) ? policy.retention : this.policy.retention,
      ...(policy.deleteRecentActivityHours === undefined
        ? {}
        : {
            deleteRecentActivityHours: Math.min(
              Math.max(policy.deleteRecentActivityHours, 0.25),
              24 * 365,
            ),
          }),
    };
    return normalized;
  }

  cutoff(userId: string, now = Date.now()): number | null {
    const retention = this.getPolicy(userId).retention;
    const days: Record<Exclude<HistoryRetention, 'unlimited'>, number> = {
      '1_month': 30,
      '3_months': 90,
      '6_months': 180,
      '1_year': 365,
    };
    if (retention === 'unlimited') return null;
    return now - days[retention] * 86_400_000;
  }

  isExpired(userId: string, recordedAt: number, now = Date.now()): boolean {
    const cutoff = this.cutoff(userId, now);
    return cutoff !== null && recordedAt < cutoff;
  }

  private readRetention(): HistoryRetention {
    const configured = process.env.MYPA_HISTORY_RETENTION?.trim() as HistoryRetention | undefined;
    return configured && VALID_RETENTION.has(configured) ? configured : '3_months';
  }
}
