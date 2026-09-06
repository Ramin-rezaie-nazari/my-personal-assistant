import {
  CanActivate,
  ExecutionContext,
  Injectable,
  TooManyRequestsException,
} from '@nestjs/common';
import type { Request } from 'express';

interface Bucket {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 60_000;
const MAX_TRACKED_KEYS = 10_000;
const DEFAULT_LIMIT = 120;

const ROUTE_LIMITS: Record<string, number> = {
  'POST /auth/register': 5,
  'POST /auth/login': 8,
  'POST /auth/refresh': 20,
};

@Injectable()
export class RequestRateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();

  canActivate(context: ExecutionContext): boolean {
    if (process.env.NODE_ENV === 'test') return true;

    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method.toUpperCase();
    const path = this.normalizePath(request.path);
    const limit = ROUTE_LIMITS[`${method} ${path}`] ?? DEFAULT_LIMIT;
    const tracker = this.getTracker(request);
    const key = `${method}:${path}:${tracker}`;
    const now = Date.now();

    this.prune(now);

    const existing = this.buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
      return true;
    }

    if (existing.count >= limit) {
      throw new TooManyRequestsException('Too many requests. Please try again later.');
    }

    existing.count += 1;
    return true;
  }

  private getTracker(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.trim()) {
      return forwarded.split(',')[0].trim();
    }
    return request.ip || request.socket.remoteAddress || 'unknown';
  }

  private normalizePath(path: string): string {
    const normalized = path.replace(/\/+$/, '');
    return normalized || '/';
  }

  private prune(now: number): void {
    if (this.buckets.size <= MAX_TRACKED_KEYS) {
      for (const [key, bucket] of this.buckets) {
        if (bucket.resetAt <= now) this.buckets.delete(key);
      }
      return;
    }

    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
      if (this.buckets.size <= MAX_TRACKED_KEYS) break;
    }
  }
}
