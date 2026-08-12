import { Injectable } from '@nestjs/common';
import { NotificationAdaptationService } from './notification-adaptation.service';
import { NotificationSignal } from './notification-feedback.service';

@Injectable()
export class AdaptiveNotificationDecisionService {
  constructor(private readonly adaptation: NotificationAdaptationService) {}

  decide(input: { signal: NotificationSignal; basePriority: 'critical' | 'high' | 'normal'; scheduledAt: Date; now?: Date }) {
    const now = input.now ?? new Date();
    const recommendation = this.adaptation.recommend(input.signal);
    const priorityRank = { normal: 1, high: 2, critical: 3 } as const;
    const effectivePriority = priorityRank[input.basePriority] >= priorityRank[recommendation.recommendedMinimumPriority]
      ? input.basePriority
      : recommendation.recommendedMinimumPriority;
    const shiftMinutes = recommendation.recommendedAction === 'shift_timing' ? recommendation.recommendedQuietHoursExtensionMinutes : 0;
    const effectiveAt = new Date(input.scheduledAt.getTime() + shiftMinutes * 60000);
    const suppressed = recommendation.recommendedAction === 'reduce_frequency' && input.signal.resistanceScore >= 0.85 && input.basePriority !== 'critical';
    return { notify: !suppressed, effectivePriority, effectiveAt, confidence: recommendation.confidence, action: recommendation.recommendedAction, reason: recommendation.reason, evaluatedAt: now };
  }
}
