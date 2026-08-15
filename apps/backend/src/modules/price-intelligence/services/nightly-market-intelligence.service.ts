import { Injectable } from '@nestjs/common';
import { PriceSourceService } from './price-source.service';
import { PricePersistenceService } from './price-persistence.service';

export type NightlyMarketConfig = { hour: number; minute: number; timezone?: string; enabled: boolean; maxRetries: number; retryDelayMs: number; catchUpAfterMissedRun: boolean };
export type NightlyRunResult = { runId: string; status: 'completed' | 'partial' | 'failed' | 'skipped'; attempts: number; collected: number; failedSources: string[]; attemptedSources: string[]; scheduledFor: Date; startedAt: Date; completedAt: Date };

@Injectable()
export class NightlyMarketIntelligenceService {
  private readonly defaults: NightlyMarketConfig = { hour: 3, minute: 30, timezone: 'Asia/Tehran', enabled: true, maxRetries: 3, retryDelayMs: 30_000, catchUpAfterMissedRun: true };

  constructor(private readonly sources: PriceSourceService, private readonly persistence: PricePersistenceService) {}

  config(override: Partial<NightlyMarketConfig> = {}): NightlyMarketConfig {
    const merged = { ...this.defaults, ...override };
    return { ...merged, hour: Math.min(23, Math.max(0, merged.hour)), minute: Math.min(59, Math.max(0, merged.minute)), maxRetries: Math.min(10, Math.max(0, merged.maxRetries)), retryDelayMs: Math.max(0, merged.retryDelayMs) };
  }

  shouldRun(now: Date, lastSuccessfulRunAt?: Date, override: Partial<NightlyMarketConfig> = {}) {
    const policy = this.config(override);
    if (!policy.enabled) return { run: false, reason: 'disabled' };
    if (!lastSuccessfulRunAt) return { run: true, reason: 'initial_run' };
    const elapsed = now.getTime() - lastSuccessfulRunAt.getTime();
    if (policy.catchUpAfterMissedRun && elapsed >= 36 * 60 * 60 * 1000) return { run: true, reason: 'catch_up_after_missed_window' };
    return { run: this.isScheduledMinute(now, policy), reason: 'scheduled_window' };
  }

  async run(productKeys?: string[], sourceIds?: string[], scheduledFor = new Date()): Promise<NightlyRunResult> {
    const startedAt = new Date();
    const runId = await this.persistence.createRun(scheduledFor, startedAt);
    const keys = productKeys?.length ? productKeys : await this.persistence.trackedProductKeys();
    let attempts = 0;
    let collected: Awaited<ReturnType<PriceSourceService['collectDetailed']>>['prices'] = [];
    let failedSources: string[] = [];
    let attemptedSources: string[] = [];
    let error: string | undefined;

    try {
      for (attempts = 1; attempts <= Math.max(1, this.config().maxRetries + 1); attempts += 1) {
        try {
          const result = await this.sources.collectDetailed(keys, sourceIds);
          collected = result.prices;
          failedSources = result.failedSourceIds;
          attemptedSources = result.attemptedSourceIds;
          if (!failedSources.length || attempts > this.config().maxRetries) break;
        } catch (cause) {
          error = cause instanceof Error ? cause.message : String(cause);
          if (attempts > this.config().maxRetries) break;
        }
        await new Promise((resolve) => setTimeout(resolve, Math.min(this.config().retryDelayMs, 250)));
      }
      await this.persistence.record(collected);
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
    }

    const status: NightlyRunResult['status'] = collected.length ? failedSources.length ? 'partial' : 'completed' : 'failed';
    await this.persistence.finishRun(runId, { status, attempts, collected: collected.length, failedSources, attemptedSources, error });
    return { runId, status, attempts, collected: collected.length, failedSources, attemptedSources, scheduledFor, startedAt, completedAt: new Date() };
  }

  private isScheduledMinute(now: Date, policy: NightlyMarketConfig) {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: policy.timezone ?? 'Asia/Tehran', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
    const hour = Number(parts.find((part) => part.type === 'hour')?.value);
    const minute = Number(parts.find((part) => part.type === 'minute')?.value);
    return hour === policy.hour && minute === policy.minute;
  }
}
