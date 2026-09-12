import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type { Request } from 'express';

type Bucket = { count: number; resetAt: number };

/**
 * Lightweight abuse protection for unauthenticated auth endpoints.
 * This is intentionally dependency-free so the lockfile stays reproducible.
 * For a multi-instance deployment, the same policy must also be enforced at
 * the edge/API gateway or backed by shared storage (for example Redis).
 */
@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private static readonly WINDOW_MS = 60_000;
  private static readonly MAX_REQUESTS = 10;
  private readonly buckets = new Map<string, Bucket>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = this.clientIp(request);
    const route = `${request.method}:${request.baseUrl || ''}${request.path || ''}`;
    const key = `${route}:${ip}`;
    const now = Date.now();
    const current = this.buckets.get(key);

    if (!current || current.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + AuthRateLimitGuard.WINDOW_MS });
      this.cleanup(now);
      return true;
    }

    if (current.count >= AuthRateLimitGuard.MAX_REQUESTS) {
      const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      throw new HttpException(
        `Too many authentication requests. Retry after ${retryAfter} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    current.count += 1;
    return true;
  }

  private clientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.trim()) return forwarded.split(',')[0].trim();
    if (Array.isArray(forwarded) && forwarded[0]) return forwarded[0];
    return request.ip || request.socket.remoteAddress || 'unknown';
  }

  private cleanup(now: number) {
    if (this.buckets.size < 1000) return;
    for (const [key, bucket] of this.buckets) if (bucket.resetAt <= now) this.buckets.delete(key);
  }
}
