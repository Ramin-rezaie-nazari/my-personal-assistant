import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

export type HistoryRetention =
  | '1_month'
  | '3_months'
  | '6_months'
  | '1_year'
  | 'unlimited';
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
const FACT_CATEGORY = 'privacy';
const FACT_KEY = 'history_retention';

@Injectable()
export class DecisionHistoryRetentionService {
  constructor(private readonly prisma?: PrismaService) {}

  async getPolicy(userId: string): Promise<HistoryRetentionPolicy> {
    if (!this.prisma) return this.getPolicySync(userId);
    const fact = await this.prisma.userFact.findFirst({
      where: { userId, category: FACT_CATEGORY, key: FACT_KEY },
      orderBy: { updatedAt: 'desc' },
      select: { value: true },
    });
    if (!fact) return { retention: this.readRetention() };
    try {
      const parsed = JSON.parse(fact.value) as Partial<HistoryRetentionPolicy>;
      return this.normalize(parsed);
    } catch {
      return { retention: this.readRetention() };
    }
  }

  getPolicySync(_userId: string): HistoryRetentionPolicy {
    return { retention: this.readRetention() };
  }

  async setPolicy(userId: string, policy: HistoryRetentionPolicy): Promise<HistoryRetentionPolicy> {
    const normalized = this.normalize(policy);
    if (!this.prisma) return normalized;
    await this.prisma.$transaction(async (tx) => {
      await tx.userFact.deleteMany({ where: { userId, category: FACT_CATEGORY, key: FACT_KEY } });
      await tx.userFact.create({
        data: {
          userId,
          category: FACT_CATEGORY,
          key: FACT_KEY,
          value: JSON.stringify(normalized),
          confidence: 1,
          importance: 3,
          source: 'user',
        },
      });
    });
    return normalized;
  }

  async cutoff(userId: string, now = Date.now()): Promise<number | null> {
    const retention = (await this.getPolicy(userId)).retention;
    return this.cutoffForRetention(retention, now);
  }

  cutoffSync(userId: string, now = Date.now()): number | null {
    return this.cutoffForRetention(this.getPolicySync(userId).retention, now);
  }

  async isExpired(userId: string, recordedAt: number, now = Date.now()): Promise<boolean> {
    const cutoff = await this.cutoff(userId, now);
    return cutoff !== null && recordedAt < cutoff;
  }

  isExpiredSync(userId: string, recordedAt: number, now = Date.now()): boolean {
    const cutoff = this.cutoffSync(userId, now);
    return cutoff !== null && recordedAt < cutoff;
  }

  private cutoffForRetention(retention: HistoryRetention, now: number): number | null {
    const days: Record<Exclude<HistoryRetention, 'unlimited'>, number> = {
      '1_month': 30,
      '3_months': 90,
      '6_months': 180,
      '1_year': 365,
    };
    if (retention === 'unlimited') return null;
    return now - days[retention] * 86_400_000;
  }

  private normalize(policy: Partial<HistoryRetentionPolicy>): HistoryRetentionPolicy {
    const retention = VALID_RETENTION.has(policy.retention as HistoryRetention)
      ? (policy.retention as HistoryRetention)
      : this.readRetention();
    const hours = policy.deleteRecentActivityHours;
    return {
      retention,
      ...(hours === undefined
        ? {}
        : { deleteRecentActivityHours: Math.min(Math.max(hours, 0.25), 24 * 365) }),
    };
  }

  private readRetention(): HistoryRetention {
    const configured = process.env.MYPA_HISTORY_RETENTION?.trim() as HistoryRetention | undefined;
    return configured && VALID_RETENTION.has(configured) ? configured : '3_months';
  }
}
