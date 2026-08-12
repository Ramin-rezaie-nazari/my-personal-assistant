import { Injectable } from '@nestjs/common';

@Injectable()
export class DecisionRateLimiterService {
  private readonly buckets = new Map<string, number[]>();

  allow(scope: string, limit: number, windowMs: number, now = Date.now()): boolean {
    const safeLimit = Math.max(1, limit);
    const safeWindow = Math.max(1, windowMs);
    const timestamps = (this.buckets.get(scope) ?? []).filter((time) => now - time < safeWindow);
    if (timestamps.length >= safeLimit) {
      this.buckets.set(scope, timestamps);
      return false;
    }
    timestamps.push(now);
    this.buckets.set(scope, timestamps);
    return true;
  }

  remaining(scope: string, limit: number, windowMs: number, now = Date.now()): number {
    const timestamps = (this.buckets.get(scope) ?? []).filter((time) => now - time < Math.max(1, windowMs));
    this.buckets.set(scope, timestamps);
    return Math.max(0, Math.max(1, limit) - timestamps.length);
  }
}
