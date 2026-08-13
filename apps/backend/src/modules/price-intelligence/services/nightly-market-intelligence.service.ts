import { Injectable } from '@nestjs/common';
import { PriceSourceService } from './price-source.service';
import { PriceHistoryStoreService } from './price-history-store.service';
import type { NormalizedPrice } from '../models/price-intelligence.model';

export type NightlyMarketConfig = { hour: number; minute: number; timezone?: string; enabled: boolean; maxRetries: number; retryDelayMs: number; catchUpAfterMissedRun: boolean };
export type NightlyRunResult = { runId: string; status: 'completed' | 'partial' | 'failed' | 'skipped'; attempts: number; collected: number; failedSources: string[]; attemptedSources: string[]; scheduledFor: Date; startedAt: Date; completedAt: Date };

@Injectable()
export class NightlyMarketIntelligenceService {
  private readonly defaults: NightlyMarketConfig = { hour: 3, minute: 30, timezone: undefined, enabled: true, maxRetries: 3, retryDelayMs: 30_000, catchUpAfterMissedRun: true };
  constructor(private readonly sources: PriceSourceService, private readonly history: PriceHistoryStoreService) {}
  config(override: Partial<NightlyMarketConfig> = {}): NightlyMarketConfig { const merged = { ...this.defaults, ...override }; return { ...merged, hour: Math.min(23, Math.max(0, merged.hour)), minute: Math.min(59, Math.max(0, merged.minute)), maxRetries: Math.min(10, Math.max(0, merged.maxRetries)), retryDelayMs: Math.max(0, merged.retryDelayMs) }; }
  shouldRun(now: Date, lastSuccessfulRunAt?: Date, override: Partial<NightlyMarketConfig> = {}) { const policy = this.config(override); if (!policy.enabled) return { run: false, reason: 'disabled' }; if (!lastSuccessfulRunAt) return { run: true, reason: 'initial_run' }; const elapsed = now.getTime() - lastSuccessfulRunAt.getTime(); if (policy.catchUpAfterMissedRun && elapsed >= 36 * 60 * 60 * 1000) return { run: true, reason: 'catch_up_after_missed_window' }; return { run: now.getHours() === policy.hour && now.getMinutes() === policy.minute, reason: 'scheduled_window' }; }
  async run(productKeys: string[], sourceIds?: string[], scheduledFor = new Date()): Promise<NightlyRunResult> {
    const startedAt = new Date(); const runId = `market:${scheduledFor.toISOString()}`; const policy = this.config();
    let attempts = 0; let collected: NormalizedPrice[] = []; let failedSources: string[] = []; let attemptedSources: string[] = [];
    for (attempts = 1; attempts <= Math.max(1, policy.maxRetries + 1); attempts += 1) {
      const result = await this.sources.collectDetailed(productKeys, sourceIds);
      collected = result.prices; failedSources = result.failedSourceIds; attemptedSources = result.attemptedSourceIds;
      if (!failedSources.length) break;
      if (attempts <= policy.maxRetries && policy.retryDelayMs > 0) await new Promise((resolve) => setTimeout(resolve, Math.min(policy.retryDelayMs, 250)));
    }
    this.history.record(collected);
    const status: NightlyRunResult['status'] = collected.length ? failedSources.length ? 'partial' : 'completed' : 'failed';
    return { runId, status, attempts, collected: collected.length, failedSources, attemptedSources, scheduledFor, startedAt, completedAt: new Date() };
  }
}
