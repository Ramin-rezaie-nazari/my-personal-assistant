import { Injectable } from '@nestjs/common';
import { DecisionCandidate } from './unified-decision-engine.service';

export type ExecutionPolicy = {
  timeoutMs: number;
  maxAttempts: number;
  retryDelayMs: number;
  dryRun: boolean;
};

export type ExecutionAttempt = {
  attempt: number;
  startedAt: number;
  durationMs: number;
  status: 'completed' | 'failed' | 'timed_out' | 'dry_run';
  error?: string;
};

@Injectable()
export class DecisionExecutionPolicyService {
  resolve(
    candidate: DecisionCandidate,
    context: Record<string, unknown> = {},
  ): ExecutionPolicy {
    const requested = (context.executionPolicy ??
      {}) as Partial<ExecutionPolicy>;
    const domainDefaults: Record<string, Partial<ExecutionPolicy>> = {
      notification: { timeoutMs: 5000, maxAttempts: 2, retryDelayMs: 250 },
      workout: { timeoutMs: 15000, maxAttempts: 1, retryDelayMs: 0 },
      schedule: { timeoutMs: 10000, maxAttempts: 2, retryDelayMs: 300 },
      nutrition: { timeoutMs: 5000, maxAttempts: 2, retryDelayMs: 200 },
    };
    const defaults = domainDefaults[candidate.domain] ?? {
      timeoutMs: 10000,
      maxAttempts: 2,
      retryDelayMs: 250,
    };
    return {
      timeoutMs: this.bound(
        requested.timeoutMs ?? defaults.timeoutMs ?? 10000,
        250,
        60000,
      ),
      maxAttempts: this.bound(
        requested.maxAttempts ?? defaults.maxAttempts ?? 2,
        1,
        3,
      ),
      retryDelayMs: this.bound(
        requested.retryDelayMs ?? defaults.retryDelayMs ?? 250,
        0,
        5000,
      ),
      dryRun: requested.dryRun === true,
    };
  }

  async run<T>(
    candidate: DecisionCandidate,
    policy: ExecutionPolicy,
    operation: () => Promise<T> | T,
  ): Promise<{ result?: T; attempts: ExecutionAttempt[] }> {
    if (policy.dryRun)
      return {
        attempts: [
          {
            attempt: 0,
            startedAt: Date.now(),
            durationMs: 0,
            status: 'dry_run',
          },
        ],
      };
    const attempts: ExecutionAttempt[] = [];
    for (let attempt = 1; attempt <= policy.maxAttempts; attempt += 1) {
      const startedAt = Date.now();
      try {
        const result = await this.withTimeout(
          Promise.resolve().then(operation),
          policy.timeoutMs,
        );
        attempts.push({
          attempt,
          startedAt,
          durationMs: Date.now() - startedAt,
          status: 'completed',
        });
        return { result, attempts };
      } catch (error) {
        const timedOut =
          error instanceof Error && error.message === 'execution_timeout';
        attempts.push({
          attempt,
          startedAt,
          durationMs: Date.now() - startedAt,
          status: timedOut ? 'timed_out' : 'failed',
          error: error instanceof Error ? error.message : String(error),
        });
        if (attempt < policy.maxAttempts && policy.retryDelayMs > 0)
          await this.sleep(policy.retryDelayMs * attempt);
      }
    }
    const last = attempts[attempts.length - 1];
    throw new Error(last?.error ?? 'execution_failed');
  }

  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('execution_timeout')),
        timeoutMs,
      );
      promise.then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (error) => {
          clearTimeout(timer);
          reject(error);
        },
      );
    });
  }

  private sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }
  private bound(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
  }
}
