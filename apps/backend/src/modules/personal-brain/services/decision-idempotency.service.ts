import { Injectable } from '@nestjs/common';

@Injectable()
export class DecisionIdempotencyService {
  private readonly executed = new Map<
    string,
    { result: unknown; expiresAt: number }
  >();

  has(key: string): boolean {
    const entry = this.executed.get(key);
    if (!entry) return false;
    if (entry.expiresAt <= Date.now()) {
      this.executed.delete(key);
      return false;
    }
    return true;
  }

  get<T = unknown>(key: string): T | null {
    return this.has(key) ? (this.executed.get(key)?.result as T) : null;
  }

  remember(key: string, result: unknown, ttlMs = 24 * 60 * 60 * 1000): void {
    this.executed.set(key, {
      result,
      expiresAt: Date.now() + Math.max(1, ttlMs),
    });
  }
}
