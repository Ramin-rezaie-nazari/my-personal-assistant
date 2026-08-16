import { Injectable } from '@nestjs/common';

export type ProactiveSignal = { value: number; weight: number };
export type ProactiveDecisionQuality = { score: number; confidence: number; shouldNotify: boolean; reason: string };

@Injectable()
export class ProactiveDecisionQualityService {
  evaluate(input: { relevance: number; urgency: number; userBenefit: number; interruptionCost: number; duplicatePenalty?: number; snoozeRate?: number }): ProactiveDecisionQuality {
    const relevance = this.clamp(input.relevance); const urgency = this.clamp(input.urgency); const userBenefit = this.clamp(input.userBenefit); const interruptionCost = this.clamp(input.interruptionCost); const duplicatePenalty = this.clamp(input.duplicatePenalty ?? 0); const snoozeRate = this.clamp(input.snoozeRate ?? 0);
    const score = this.clamp(relevance * 0.32 + urgency * 0.24 + userBenefit * 0.32 - interruptionCost * 0.08 - duplicatePenalty * 0.04);
    const confidence = this.clamp(relevance * 0.35 + userBenefit * 0.35 + urgency * 0.20 + (1 - snoozeRate) * 0.10 - duplicatePenalty * 0.08);
    const shouldNotify = score >= 0.62 && confidence >= 0.55;
    const reason = shouldNotify ? 'high expected user value' : score < 0.62 ? 'insufficient value for an interruption' : 'confidence too low for proactive delivery';
    return { score, confidence, shouldNotify, reason };
  }
  private clamp(value: number) { return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)); }
}
