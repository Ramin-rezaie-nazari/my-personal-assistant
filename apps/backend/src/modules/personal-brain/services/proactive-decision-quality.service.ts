import { Injectable } from '@nestjs/common';
export type ProactiveDecisionQuality = {
  score: number;
  confidence: number;
  shouldNotify: boolean;
  reason: string;
};
@Injectable()
export class ProactiveDecisionQualityService {
  evaluate(i: {
    relevance: number;
    urgency: number;
    userBenefit: number;
    interruptionCost: number;
    duplicatePenalty?: number;
    snoozeRate?: number;
  }): ProactiveDecisionQuality {
    const r = this.c(i.relevance),
      u = this.c(i.urgency),
      b = this.c(i.userBenefit),
      cost = this.c(i.interruptionCost),
      dup = this.c(i.duplicatePenalty ?? 0),
      s = this.c(i.snoozeRate ?? 0),
      score = this.c(r * 0.32 + u * 0.24 + b * 0.32 - cost * 0.08 - dup * 0.04),
      confidence = this.c(
        r * 0.35 + b * 0.35 + u * 0.2 + (1 - s) * 0.1 - dup * 0.08,
      ),
      shouldNotify = score >= 0.62 && confidence >= 0.55;
    return {
      score,
      confidence,
      shouldNotify,
      reason: shouldNotify
        ? 'high expected user value'
        : score < 0.62
          ? 'insufficient value for an interruption'
          : 'confidence too low for proactive delivery',
    };
  }
  private c(v: number) {
    return Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
  }
}
