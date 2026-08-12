import { Injectable } from '@nestjs/common';
import { DecisionCandidate } from './unified-decision-engine.service';
import { DecisionIdempotencyService } from './decision-idempotency.service';
import { DecisionRateLimiterService } from './decision-rate-limiter.service';

@Injectable()
export class DecisionGuardrailService {
  constructor(private readonly idempotency: DecisionIdempotencyService, private readonly rateLimiter: DecisionRateLimiterService) {}

  check(userId: string, candidate: DecisionCandidate, now = Date.now()) {
    const key = `${userId}:${candidate.id}:${candidate.action}`;
    if (this.idempotency.has(key)) return { allowed: false, reason: 'already_executed', key };
    if (!this.rateLimiter.allow(`decision:${userId}:${candidate.domain}`, 10, 60_000, now)) {
      return { allowed: false, reason: 'rate_limited', key };
    }
    return { allowed: true, reason: 'allowed', key };
  }

  remember(userId: string, candidate: DecisionCandidate, result: unknown) {
    this.idempotency.remember(`${userId}:${candidate.id}:${candidate.action}`, result);
  }
}
